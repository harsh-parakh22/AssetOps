package com.assetops.dto.request;
import com.assetops.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
public record RequestCreateRequest(
    UUID assetId,
    String requestedAssetType,
    @NotBlank String reason,
    Priority priority
) {}
