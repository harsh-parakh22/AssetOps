package com.assetops.repository;

import com.assetops.entity.Asset;
import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import com.assetops.enums.LifecycleStage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    Optional<Asset> findByAssetTag(String assetTag);

    boolean existsByAssetTag(String assetTag);

    Page<Asset> findByStatus(AssetStatus status, Pageable pageable);

    Page<Asset> findByCategory(AssetCategory category, Pageable pageable);

    @Query("""
        SELECT a FROM Asset a
        WHERE (:status IS NULL OR a.status = :status)
        AND (:category IS NULL OR a.category = :category)
        AND (:search IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
             OR LOWER(a.assetTag) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
             OR LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))
        """)
    Page<Asset> searchAssets(
        @Param("status") AssetStatus status,
        @Param("category") AssetCategory category,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("SELECT a FROM Asset a WHERE a.refreshDate <= :warningDate AND a.status != 'RETIRED'")
    List<Asset> findAssetsApproachingEol(@Param("warningDate") LocalDate warningDate);

    @Query("""
        SELECT a.category as category, COUNT(a) as count, a.status as status
        FROM Asset a GROUP BY a.category, a.status
        """)
    List<Object[]> getAssetCountByCategoryAndStatus();

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.status = :status")
    long countByStatus(@Param("status") AssetStatus status);

    List<Asset> findByAssignedToId(UUID userId);

    @Query("SELECT a FROM Asset a WHERE a.lifecycleStage = :stage")
    List<Asset> findByLifecycleStage(@Param("stage") LifecycleStage stage);

    @Query("""
        SELECT SUM(a.purchaseCost) FROM Asset a
        WHERE a.refreshDate BETWEEN :start AND :end AND a.status != 'RETIRED'
        """)
    java.math.BigDecimal calculateRefreshBudget(
        @Param("start") LocalDate start,
        @Param("end") LocalDate end
    );
}
