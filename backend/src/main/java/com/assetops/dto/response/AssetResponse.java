package com.assetops.dto.response;

import com.assetops.entity.Asset;
import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import com.assetops.enums.LifecycleStage;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AssetResponse(
    UUID id,
    String assetTag,
    String name,
    String description,
    AssetCategory category,
    String manufacturer,
    String model,
    String serialNumber,
    AssetStatus status,
    LifecycleStage lifecycleStage,
    LocalDate purchaseDate,
    BigDecimal purchaseCost,
    LocalDate refreshDate,
    LocalDate warrantyExpiry,
    String location,
    String notes,
    long ageInMonths,
    UUID assignedToId,
    String assignedToName,
    String assignedToEmail,
    LocalDate assignedDate,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AssetResponse from(Asset a) {
        return new AssetResponse(
            a.getId(), a.getAssetTag(), a.getName(), a.getDescription(),
            a.getCategory(), a.getManufacturer(), a.getModel(), a.getSerialNumber(),
            a.getStatus(), a.getLifecycleStage(), a.getPurchaseDate(), a.getPurchaseCost(),
            a.getRefreshDate(), a.getWarrantyExpiry(), a.getLocation(), a.getNotes(),
            a.getAgeInMonths(),
            a.getAssignedTo() != null ? a.getAssignedTo().getId() : null,
            a.getAssignedTo() != null ? a.getAssignedTo().getName() : null,
            a.getAssignedTo() != null ? a.getAssignedTo().getEmail() : null,
            a.getAssignedDate(), a.getCreatedAt(), a.getUpdatedAt()
        );
    }
}
