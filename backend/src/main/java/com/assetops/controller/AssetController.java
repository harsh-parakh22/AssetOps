package com.assetops.controller;

import com.assetops.dto.request.AssetCreateRequest;
import com.assetops.dto.request.AssetUpdateRequest;
import com.assetops.dto.response.AssetResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import com.assetops.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
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

import java.util.List;
import java.util.UUID;

@Tag(name = "Assets", description = "Asset lifecycle management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    @Operation(summary = "Search assets with filters and pagination")
    public ResponseEntity<PagedResponse<AssetResponse>> search(
        @RequestParam(required = false) AssetStatus status,
        @RequestParam(required = false) AssetCategory category,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "DESC") Sort.Direction sortDir
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(sortDir, sortBy));
        return ResponseEntity.ok(assetService.search(status, category, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get asset by ID")
    public ResponseEntity<AssetResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(assetService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create a new asset")
    public ResponseEntity<AssetResponse> create(@Valid @RequestBody AssetCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update an asset")
    public ResponseEntity<AssetResponse> update(
        @PathVariable UUID id, @RequestBody AssetUpdateRequest req) {
        return ResponseEntity.ok(assetService.update(id, req));
    }

    @PostMapping("/{id}/assign/{userId}")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Assign asset to user")
    public ResponseEntity<AssetResponse> assign(@PathVariable UUID id, @PathVariable UUID userId) {
        return ResponseEntity.ok(assetService.assign(id, userId));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Return an assigned asset")
    public ResponseEntity<AssetResponse> returnAsset(@PathVariable UUID id) {
        return ResponseEntity.ok(assetService.returnAsset(id));
    }

    @GetMapping("/eol")
    @PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Get assets approaching end-of-life")
    public ResponseEntity<List<AssetResponse>> getEolAssets(
        @RequestParam(defaultValue = "60") int warningDays) {
        return ResponseEntity.ok(assetService.getEolAssets(warningDays));
    }
}
