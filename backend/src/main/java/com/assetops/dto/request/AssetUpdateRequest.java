package com.assetops.dto.request;
import com.assetops.enums.AssetStatus;
import java.time.LocalDate;
public record AssetUpdateRequest(
    String name, String description, String manufacturer, String model,
    String location, LocalDate refreshDate, LocalDate warrantyExpiry,
    String notes, AssetStatus status
) {}
