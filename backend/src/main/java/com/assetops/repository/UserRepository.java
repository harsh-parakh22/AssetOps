package com.assetops.repository;

import com.assetops.entity.User;
import com.assetops.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
    List<User> findByRole(Role role);

    @Query("""
        SELECT u FROM User u
        WHERE (:search IS NULL
               OR LOWER(u.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
               OR LOWER(u.department) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))
        """)
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    /**
     * Count assigned assets per user without triggering lazy loading.
     * Returns a map-like list of [userId, count] pairs.
     */
    @Query("SELECT a.assignedTo.id, COUNT(a) FROM Asset a WHERE a.assignedTo.id IN :userIds GROUP BY a.assignedTo.id")
    List<Object[]> countAssignedAssetsByUserIds(@Param("userIds") List<UUID> userIds);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.assignedTo.id = :userId")
    int countAssignedAssets(@Param("userId") UUID userId);
}
