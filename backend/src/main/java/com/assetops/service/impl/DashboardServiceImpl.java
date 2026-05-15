package com.assetops.service.impl;

import com.assetops.dto.response.DashboardStats;
import com.assetops.enums.AssetStatus;
import com.assetops.repository.AssetRepository;
import com.assetops.repository.AssetRequestRepository;
import com.assetops.service.AssetService;
import com.assetops.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final AssetRepository assetRepository;
    private final AssetRequestRepository requestRepository;
    private final AssetService assetService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable("dashboard-stats")
    public DashboardStats getDashboardStats() {
        long total    = assetRepository.count();
        long avail    = assetRepository.countByStatus(AssetStatus.AVAILABLE);
        long assigned = assetRepository.countByStatus(AssetStatus.ASSIGNED);
        long maint    = assetRepository.countByStatus(AssetStatus.MAINTENANCE);
        long retired  = assetRepository.countByStatus(AssetStatus.RETIRED);
        long pending  = requestRepository.countByStatus(com.assetops.enums.RequestStatus.PENDING);
        long approved = requestRepository.countByStatus(com.assetops.enums.RequestStatus.APPROVED);

        var eolAssets = assetRepository.findAssetsApproachingEol(LocalDate.now().plusDays(60));
        BigDecimal budget = assetRepository.calculateRefreshBudget(
            LocalDate.now(), LocalDate.now().plusYears(1));

        var stats = assetService.getAssetStats();

        return new DashboardStats(
            total, avail, assigned, maint, retired,
            pending, approved,
            eolAssets.size(),
            budget != null ? budget : BigDecimal.ZERO,
            stats.assetsByCategory(),
            stats.assetsByStatus()
        );
    }
}
