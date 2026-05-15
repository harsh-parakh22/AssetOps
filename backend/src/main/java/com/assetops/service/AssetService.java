package com.assetops.service;

import com.assetops.dto.request.AssetCreateRequest;
import com.assetops.dto.request.AssetUpdateRequest;
import com.assetops.dto.response.AssetResponse;
import com.assetops.dto.response.AssetStatsResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AssetService {
    AssetResponse findById(UUID id);
    PagedResponse<AssetResponse> search(AssetStatus status, AssetCategory category, String searchTerm, Pageable pageable);
    AssetResponse create(AssetCreateRequest req);
    AssetResponse update(UUID id, AssetUpdateRequest req);
    AssetResponse assign(UUID assetId, UUID userId);
    AssetResponse returnAsset(UUID assetId);
    List<AssetResponse> getEolAssets(int warningDays);
    AssetStatsResponse getAssetStats();
}
