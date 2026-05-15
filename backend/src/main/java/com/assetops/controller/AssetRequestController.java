package com.assetops.controller;

import com.assetops.dto.request.RequestCreateRequest;
import com.assetops.dto.request.ReviewRequest;
import com.assetops.dto.response.AssetRequestResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.enums.Priority;
import com.assetops.enums.RequestStatus;
import com.assetops.service.AssetRequestService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@Tag(name = "Requests", description = "Asset request workflow")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/requests")
@RequiredArgsConstructor
public class AssetRequestController {

    private final AssetRequestService requestService;

    @GetMapping
    public ResponseEntity<PagedResponse<AssetRequestResponse>> findAll(
        @RequestParam(required = false) RequestStatus status,
        @RequestParam(required = false) Priority priority,
        @RequestParam(required = false) UUID userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(requestService.findAll(status, priority, userId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetRequestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(requestService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AssetRequestResponse> submit(@Valid @RequestBody RequestCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(requestService.submit(req));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AssetRequestResponse> approve(
        @PathVariable UUID id, @RequestBody ReviewRequest review) {
        return ResponseEntity.ok(requestService.approve(id, review));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AssetRequestResponse> reject(
        @PathVariable UUID id, @RequestBody ReviewRequest review) {
        return ResponseEntity.ok(requestService.reject(id, review));
    }

    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<AssetRequestResponse> allocate(
        @PathVariable UUID id, @RequestParam UUID assetId) {
        return ResponseEntity.ok(requestService.allocate(id, assetId));
    }
}
