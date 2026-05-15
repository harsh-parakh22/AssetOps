package com.assetops.scheduler;

import com.assetops.enums.AssetStatus;
import com.assetops.enums.LifecycleStage;
import com.assetops.kafka.AssetEventProducer;
import com.assetops.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class AssetLifecycleScheduler {

    private final AssetRepository assetRepository;
    private final AssetEventProducer eventProducer;

    @Value("${app.lifecycle.eol-warning-days:60}")
    private int eolWarningDays;

    /**
     * Runs every Monday at 8 AM.
     * Flags assets approaching EOL and notifies IT admins.
     */
    @Scheduled(cron = "${app.lifecycle.refresh-check-cron:0 0 8 * * MON}")
    @Transactional
    @CacheEvict(value = {"asset-stats", "dashboard-stats"}, allEntries = true)
    public void checkEolAssets() {
        LocalDate warningDate = LocalDate.now().plusDays(eolWarningDays);
        var eolAssets = assetRepository.findAssetsApproachingEol(warningDate);

        log.info("EOL check: found {} assets approaching refresh date within {} days",
            eolAssets.size(), eolWarningDays);

        eolAssets.forEach(asset -> {
            // Update lifecycle stage
            LocalDate today = LocalDate.now();
            if (asset.getRefreshDate() != null) {
                LifecycleStage newStage = asset.getRefreshDate().isBefore(today)
                    ? LifecycleStage.EOL : LifecycleStage.NEAR_EOL;

                if (asset.getLifecycleStage() != newStage) {
                    asset.setLifecycleStage(newStage);
                    assetRepository.save(asset);

                    // Notify assigned user and IT admins
                    if (asset.getAssignedTo() != null) {
                        eventProducer.publishNotificationEvent(
                            asset.getAssignedTo().getId(),
                            asset.getAssignedTo().getEmail(),
                            "EOL_WARNING",
                            "Asset Refresh Due Soon",
                            asset.getName() + " (" + asset.getAssetTag() + ") is due for refresh on "
                                + asset.getRefreshDate(),
                            asset.getId(), "Asset"
                        );
                    }
                }
            }
        });
    }

    /**
     * Runs daily at midnight — housekeeping.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void dailyHousekeeping() {
        long available = assetRepository.countByStatus(AssetStatus.AVAILABLE);
        long assigned  = assetRepository.countByStatus(AssetStatus.ASSIGNED);
        long maint     = assetRepository.countByStatus(AssetStatus.MAINTENANCE);
        log.info("Daily stats: available={} assigned={} maintenance={}", available, assigned, maint);
    }
}
