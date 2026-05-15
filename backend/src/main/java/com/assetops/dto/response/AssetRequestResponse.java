package com.assetops.dto.response;

import com.assetops.entity.AssetRequest;
import com.assetops.enums.Priority;
import com.assetops.enums.RequestStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record AssetRequestResponse(
    UUID id, String requestNumber,
    UUID requestedById, String requestedByName, String requestedByEmail,
    UUID assetId, String assetTag, String assetName,
    String requestedAssetType, String reason,
    Priority priority, RequestStatus status,
    UUID reviewedById, String reviewedByName,
    LocalDateTime reviewedAt, String reviewerNotes,
    LocalDateTime allocatedAt, LocalDateTime returnDueDate,
    LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static AssetRequestResponse from(AssetRequest r) {
        return new AssetRequestResponse(
            r.getId(), r.getRequestNumber(),
            r.getRequestedBy().getId(), r.getRequestedBy().getName(), r.getRequestedBy().getEmail(),
            r.getAsset() != null ? r.getAsset().getId() : null,
            r.getAsset() != null ? r.getAsset().getAssetTag() : null,
            r.getAsset() != null ? r.getAsset().getName() : null,
            r.getRequestedAssetType(), r.getReason(),
            r.getPriority(), r.getStatus(),
            r.getReviewedBy() != null ? r.getReviewedBy().getId() : null,
            r.getReviewedBy() != null ? r.getReviewedBy().getName() : null,
            r.getReviewedAt(), r.getReviewerNotes(),
            r.getAllocatedAt(), r.getReturnDueDate(),
            r.getCreatedAt(), r.getUpdatedAt()
        );
    }
}
