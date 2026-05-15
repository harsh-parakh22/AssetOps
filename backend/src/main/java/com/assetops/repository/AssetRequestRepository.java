package com.assetops.repository;

import com.assetops.entity.AssetRequest;
import com.assetops.enums.Priority;
import com.assetops.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRequestRepository extends JpaRepository<AssetRequest, UUID> {
    Optional<AssetRequest> findByRequestNumber(String requestNumber);
    Page<AssetRequest> findByStatus(RequestStatus status, Pageable pageable);
    Page<AssetRequest> findByRequestedById(UUID userId, Pageable pageable);
    long countByStatus(RequestStatus status);

    @Query("""
        SELECT r FROM AssetRequest r
        WHERE (:status IS NULL OR r.status = :status)
        AND (:priority IS NULL OR r.priority = :priority)
        AND (:userId IS NULL OR r.requestedBy.id = :userId)
        ORDER BY
          CASE r.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
          r.createdAt DESC
        """)
    Page<AssetRequest> findWithFilters(
        @Param("status") RequestStatus status,
        @Param("priority") Priority priority,
        @Param("userId") UUID userId,
        Pageable pageable
    );

    @Query("SELECT COUNT(r) FROM AssetRequest r WHERE r.status = 'PENDING'")
    long countPending();
}
