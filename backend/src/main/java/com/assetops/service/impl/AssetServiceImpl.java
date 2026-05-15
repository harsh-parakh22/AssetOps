package com.assetops.service.impl;

import com.assetops.dto.request.AssetCreateRequest;
import com.assetops.dto.request.AssetUpdateRequest;
import com.assetops.dto.response.AssetResponse;
import com.assetops.dto.response.AssetStatsResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.entity.Asset;
import com.assetops.entity.User;
import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import com.assetops.enums.LifecycleStage;
import com.assetops.exception.AssetNotFoundException;
import com.assetops.exception.BusinessException;
import com.assetops.kafka.AssetEventProducer;
import com.assetops.repository.AssetRepository;
import com.assetops.repository.UserRepository;
import com.assetops.service.AssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class AssetServiceImpl implements AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AssetEventProducer eventProducer;

    // Thread-safe sequence for tag generation
    private final AtomicLong tagSequence = new AtomicLong(
        System.currentTimeMillis() % 100000
    );

    @Override
    @Cacheable(value = "assets", key = "#id")
    public AssetResponse findById(UUID id) {
        return AssetResponse.from(getAssetOrThrow(id));
    }

    @Override
    public PagedResponse<AssetResponse> search(AssetStatus status, AssetCategory category,
                                                String searchTerm, Pageable pageable) {
        Page<Asset> page = assetRepository.searchAssets(status, category, searchTerm, pageable);
        return PagedResponse.of(page.map(AssetResponse::from));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"assets", "asset-stats", "dashboard-stats"}, allEntries = true)
    public AssetResponse create(AssetCreateRequest req) {
        if (req.assetTag() != null && assetRepository.existsByAssetTag(req.assetTag())) {
            throw new BusinessException("Asset tag already exists: " + req.assetTag());
        }

        Asset asset = Asset.builder()
            .assetTag(req.assetTag() != null ? req.assetTag() : generateAssetTag(req.category()))
            .name(req.name())
            .description(req.description())
            .category(req.category())
            .manufacturer(req.manufacturer())
            .model(req.model())
            .serialNumber(req.serialNumber())
            .status(AssetStatus.AVAILABLE)
            .purchaseDate(req.purchaseDate())
            .purchaseCost(req.purchaseCost())
            .refreshDate(req.refreshDate())
            .warrantyExpiry(req.warrantyExpiry())
            .location(req.location())
            .notes(req.notes())
            .build();

        asset = assetRepository.save(asset);
        log.info("Asset created: {} [{}]", asset.getName(), asset.getAssetTag());

        eventProducer.publishAssetEvent("CREATED", asset.getId(), asset.getAssetTag(),
            asset.getName(), null, asset.getStatus(), null, currentUser());
        eventProducer.publishAuditEvent("Asset", asset.getId(), "CREATE",
            null, asset.getName(), currentUser(), null);

        return AssetResponse.from(asset);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"assets", "asset-stats", "dashboard-stats"}, allEntries = true)
    public AssetResponse update(UUID id, AssetUpdateRequest req) {
        Asset asset = getAssetOrThrow(id);
        String before = asset.getName() + " | " + asset.getStatus();

        if (req.name() != null) asset.setName(req.name());
        if (req.description() != null) asset.setDescription(req.description());
        if (req.manufacturer() != null) asset.setManufacturer(req.manufacturer());
        if (req.model() != null) asset.setModel(req.model());
        if (req.location() != null) asset.setLocation(req.location());
        if (req.refreshDate() != null) asset.setRefreshDate(req.refreshDate());
        if (req.warrantyExpiry() != null) asset.setWarrantyExpiry(req.warrantyExpiry());
        if (req.notes() != null) asset.setNotes(req.notes());
        if (req.status() != null) asset.setStatus(req.status());

        updateLifecycleStage(asset);
        asset = assetRepository.save(asset);

        eventProducer.publishAuditEvent("Asset", asset.getId(), "UPDATE",
            before, asset.getName() + " | " + asset.getStatus(), currentUser(), null);

        return AssetResponse.from(asset);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"assets", "asset-stats", "dashboard-stats"}, allEntries = true)
    public AssetResponse assign(UUID assetId, UUID userId) {
        Asset asset = getAssetOrThrow(assetId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User not found: " + userId));

        if (asset.getStatus() != AssetStatus.AVAILABLE) {
            throw new BusinessException("Asset " + asset.getAssetTag() + " is not available for assignment.");
        }

        AssetStatus oldStatus = asset.getStatus();
        asset.setAssignedTo(user);
        asset.setAssignedDate(LocalDate.now());
        asset.setStatus(AssetStatus.ASSIGNED);
        asset = assetRepository.save(asset);

        eventProducer.publishAssetEvent("ASSIGNED", asset.getId(), asset.getAssetTag(),
            asset.getName(), oldStatus, asset.getStatus(), userId, currentUser());
        eventProducer.publishNotificationEvent(userId, user.getEmail(),
            "ASSET_ASSIGNED", "Asset Assigned",
            "'" + asset.getName() + "' (" + asset.getAssetTag() + ") has been assigned to you.",
            asset.getId(), "Asset");

        return AssetResponse.from(asset);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"assets", "asset-stats", "dashboard-stats"}, allEntries = true)
    public AssetResponse returnAsset(UUID assetId) {
        Asset asset = getAssetOrThrow(assetId);

        if (asset.getStatus() != AssetStatus.ASSIGNED) {
            throw new BusinessException("Asset is not currently assigned.");
        }

        User previousUser = asset.getAssignedTo();
        AssetStatus oldStatus = asset.getStatus();

        asset.setAssignedTo(null);
        asset.setAssignedDate(null);
        asset.setStatus(AssetStatus.AVAILABLE);
        asset = assetRepository.save(asset);

        eventProducer.publishAssetEvent("RETURNED", asset.getId(), asset.getAssetTag(),
            asset.getName(), oldStatus, asset.getStatus(), null, currentUser());

        if (previousUser != null) {
            eventProducer.publishNotificationEvent(previousUser.getId(), previousUser.getEmail(),
                "ASSET_RETURNED", "Asset Returned",
                "'" + asset.getName() + "' has been successfully returned.",
                asset.getId(), "Asset");
        }

        return AssetResponse.from(asset);
    }

    @Override
    public List<AssetResponse> getEolAssets(int warningDays) {
        LocalDate warningDate = LocalDate.now().plusDays(warningDays);
        return assetRepository.findAssetsApproachingEol(warningDate)
            .stream().map(AssetResponse::from).toList();
    }

    private void updateLifecycleStage(Asset asset) {
        if (asset.getRefreshDate() == null) return;
        LocalDate today = LocalDate.now();
        LocalDate refreshDate = asset.getRefreshDate();

        if (asset.getStatus() == AssetStatus.RETIRED || asset.getStatus() == AssetStatus.DISPOSED) {
            asset.setLifecycleStage(LifecycleStage.RETIRED);
        } else if (refreshDate.isBefore(today)) {
            asset.setLifecycleStage(LifecycleStage.EOL);
        } else if (refreshDate.isBefore(today.plusDays(60))) {
            asset.setLifecycleStage(LifecycleStage.NEAR_EOL);
        } else {
            asset.setLifecycleStage(LifecycleStage.ACTIVE);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable("asset-stats")
    public AssetStatsResponse getAssetStats() {
        Map<String, Long> byCategory = assetRepository.getAssetCountByCategoryAndStatus()
            .stream()
            .collect(Collectors.groupingBy(
                row -> row[0].toString(),
                Collectors.summingLong(row -> (Long) row[1])
            ));

        Map<String, Long> byStatus = Arrays.stream(AssetStatus.values())
            .collect(Collectors.toMap(
                Enum::name,
                s -> assetRepository.countByStatus(s)
            ));

        return new AssetStatsResponse(byCategory, byStatus);
    }

    private String generateAssetTag(AssetCategory category) {
        String prefix = switch (category) {
            case LAPTOP, DESKTOP -> "AST";
            case LICENSE -> "LIC";
            case MOBILE, TABLET -> "MOB";
            default -> "ITM";
        };
        return prefix + "-" + String.format("%04d", tagSequence.incrementAndGet() % 10000);
    }

    private Asset getAssetOrThrow(UUID id) {
        return assetRepository.findById(id)
            .orElseThrow(() -> new AssetNotFoundException(id));
    }

    private String currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
