package com.assetops.dto.response;

import java.util.Map;

public record AssetStatsResponse(
    Map<String, Long> assetsByCategory,
    Map<String, Long> assetsByStatus
) {}
