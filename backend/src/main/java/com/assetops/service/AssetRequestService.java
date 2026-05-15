package com.assetops.service;

import com.assetops.dto.request.RequestCreateRequest;
import com.assetops.dto.request.ReviewRequest;
import com.assetops.dto.response.AssetRequestResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.enums.Priority;
import com.assetops.enums.RequestStatus;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface AssetRequestService {
    PagedResponse<AssetRequestResponse> findAll(RequestStatus status, Priority priority, UUID userId, Pageable pageable);
    AssetRequestResponse findById(UUID id);
    AssetRequestResponse submit(RequestCreateRequest req);
    AssetRequestResponse approve(UUID id, ReviewRequest review);
    AssetRequestResponse reject(UUID id, ReviewRequest review);
    AssetRequestResponse allocate(UUID id, UUID assetId);
}
