package com.assetops.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardStats(
    long totalAssets, long availableAssets, long assignedAssets,
    long maintenanceAssets, long retiredAssets,
    long pendingRequests, long approvedRequests,
    long assetsNearEol, BigDecimal refreshBudget,
    Map<String, Long> assetsByCategory,
    Map<String, Long> assetsByStatus
) {}
