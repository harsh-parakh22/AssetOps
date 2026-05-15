package com.assetops.service.impl;

import com.assetops.dto.request.RequestCreateRequest;
import com.assetops.dto.request.ReviewRequest;
import com.assetops.dto.response.AssetRequestResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.entity.Asset;
import com.assetops.entity.AssetRequest;
import com.assetops.entity.User;
import com.assetops.enums.AssetStatus;
import com.assetops.enums.Priority;
import com.assetops.enums.RequestStatus;
import com.assetops.exception.BusinessException;
import com.assetops.kafka.AssetEventProducer;
import com.assetops.repository.AssetRepository;
import com.assetops.repository.AssetRequestRepository;
import com.assetops.repository.UserRepository;
import com.assetops.service.AssetRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class AssetRequestServiceImpl implements AssetRequestService {

    private final AssetRequestRepository requestRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetEventProducer eventProducer;

    private final AtomicLong reqSequence = new AtomicLong(1000);

    @Override
    public PagedResponse<AssetRequestResponse> findAll(RequestStatus status,
                                                        Priority priority,
                                                        UUID userId,
                                                        Pageable pageable) {
        Page<AssetRequest> page = requestRepository.findWithFilters(status, priority, userId, pageable);
        return PagedResponse.of(page.map(AssetRequestResponse::from));
    }

    @Override
    public AssetRequestResponse findById(UUID id) {
        return AssetRequestResponse.from(getOrThrow(id));
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard-stats", allEntries = true)
    public AssetRequestResponse submit(RequestCreateRequest req) {
        String email = currentUserEmail();
        User requestor = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found: " + email));

        Asset asset = req.assetId() != null
            ? assetRepository.findById(req.assetId()).orElse(null)
            : null;

        AssetRequest request = AssetRequest.builder()
            .requestNumber(generateRequestNumber())
            .requestedBy(requestor)
            .asset(asset)
            .requestedAssetType(req.requestedAssetType())
            .reason(req.reason())
            .priority(req.priority() != null ? req.priority() : Priority.MEDIUM)
            .status(RequestStatus.PENDING)
            .build();

        final AssetRequest savedRequest = requestRepository.save(request);
        log.info("Request submitted: {} by {}", savedRequest.getRequestNumber(), email);

        // Notify all IT admins
        userRepository.findByRole(com.assetops.enums.Role.IT_ADMIN).forEach(admin ->
            eventProducer.publishNotificationEvent(admin.getId(), admin.getEmail(),
                "REQUEST_SUBMITTED", "New Asset Request",
                requestor.getName() + " requested: " + describeAsset(req, asset),
                savedRequest.getId(), "AssetRequest")
        );

        eventProducer.publishRequestEvent("SUBMITTED", savedRequest.getId(), savedRequest.getRequestNumber(),
            requestor.getId(), null, null, RequestStatus.PENDING, req.reason(), email);

        return AssetRequestResponse.from(savedRequest);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard-stats", allEntries = true)
    public AssetRequestResponse approve(UUID id, ReviewRequest review) {
        AssetRequest request = getOrThrow(id);
        if (!request.canApprove()) {
            throw new BusinessException("Request " + request.getRequestNumber() + " cannot be approved in status: " + request.getStatus());
        }

        User reviewer = getCurrentUser();
        RequestStatus oldStatus = request.getStatus();

        request.setStatus(RequestStatus.APPROVED);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewerNotes(review.notes());
        request = requestRepository.save(request);

        eventProducer.publishRequestEvent("APPROVED", request.getId(), request.getRequestNumber(),
            request.getRequestedBy().getId(), reviewer.getId(),
            oldStatus, RequestStatus.APPROVED, review.notes(), reviewer.getEmail());

        eventProducer.publishNotificationEvent(
            request.getRequestedBy().getId(), request.getRequestedBy().getEmail(),
            "REQUEST_APPROVED", "Request Approved ✓",
            "Your request " + request.getRequestNumber() + " has been approved.",
            request.getId(), "AssetRequest");

        return AssetRequestResponse.from(request);
    }

    @Override
    @Transactional
    @CacheEvict(value = "dashboard-stats", allEntries = true)
    public AssetRequestResponse reject(UUID id, ReviewRequest review) {
        AssetRequest request = getOrThrow(id);
        if (!request.canReject()) {
            throw new BusinessException("Request " + request.getRequestNumber() + " cannot be rejected in status: " + request.getStatus());
        }

        User reviewer = getCurrentUser();
        RequestStatus oldStatus = request.getStatus();

        request.setStatus(RequestStatus.REJECTED);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewerNotes(review.notes());
        request = requestRepository.save(request);

        eventProducer.publishRequestEvent("REJECTED", request.getId(), request.getRequestNumber(),
            request.getRequestedBy().getId(), reviewer.getId(),
            oldStatus, RequestStatus.REJECTED, review.notes(), reviewer.getEmail());

        eventProducer.publishNotificationEvent(
            request.getRequestedBy().getId(), request.getRequestedBy().getEmail(),
            "REQUEST_REJECTED", "Request Rejected",
            "Your request " + request.getRequestNumber() + " was rejected. Reason: " + review.notes(),
            request.getId(), "AssetRequest");

        return AssetRequestResponse.from(request);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"dashboard-stats", "assets", "asset-stats"}, allEntries = true)
    public AssetRequestResponse allocate(UUID id, UUID assetId) {
        AssetRequest request = getOrThrow(id);
        if (!request.canAllocate()) {
            throw new BusinessException("Request must be in APPROVED status to allocate.");
        }

        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new BusinessException("Asset not found: " + assetId));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new BusinessException("Asset " + asset.getAssetTag() + " is not available.");
        }

        // Assign asset
        asset.setAssignedTo(request.getRequestedBy());
        asset.setAssignedDate(java.time.LocalDate.now());
        asset.setStatus(AssetStatus.ASSIGNED);
        assetRepository.save(asset);

        // Finalize request
        request.setAsset(asset);
        request.setStatus(RequestStatus.ALLOCATED);
        request.setAllocatedAt(LocalDateTime.now());
        request.setReturnDueDate(LocalDateTime.now().plusMonths(12));
        request = requestRepository.save(request);

        eventProducer.publishNotificationEvent(
            request.getRequestedBy().getId(), request.getRequestedBy().getEmail(),
            "REQUEST_ALLOCATED", "Asset Allocated 🎉",
            asset.getName() + " (" + asset.getAssetTag() + ") has been allocated to you.",
            request.getId(), "AssetRequest");

        eventProducer.publishAuditEvent("AssetRequest", request.getId(), "ALLOCATE",
            null, asset.getAssetTag(), currentUserEmail(), null);

        return AssetRequestResponse.from(request);
    }

    private AssetRequest getOrThrow(UUID id) {
        return requestRepository.findById(id)
            .orElseThrow(() -> new BusinessException("Request not found: " + id));
    }

    private String generateRequestNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "REQ-" + datePart + "-" + String.format("%04d", reqSequence.incrementAndGet() % 10000);
    }

    private String describeAsset(RequestCreateRequest req, Asset asset) {
        return asset != null ? asset.getName() : req.requestedAssetType();
    }

    private String currentUserEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    private User getCurrentUser() {
        return userRepository.findByEmail(currentUserEmail())
            .orElseThrow(() -> new BusinessException("Authenticated user not found"));
    }
}
