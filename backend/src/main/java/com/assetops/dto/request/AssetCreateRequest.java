package com.assetops.dto.request;

import com.assetops.enums.AssetCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;


public record AssetCreateRequest(
    String assetTag,
    @NotBlank String name,
    String description,
    @NotNull AssetCategory category,
    String manufacturer,
    String model,
    String serialNumber,
    LocalDate purchaseDate,
    BigDecimal purchaseCost,
    LocalDate refreshDate,
    LocalDate warrantyExpiry,
    String location,
    String notes
) {}
