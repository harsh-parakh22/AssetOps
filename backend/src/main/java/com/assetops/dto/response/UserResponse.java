package com.assetops.dto.response;

import com.assetops.entity.User;
import com.assetops.enums.Role;
import java.util.UUID;

public record UserResponse(
    UUID id, String employeeId, String name, String email,
    String department, String jobTitle, String phoneNumber,
    Role role, boolean enabled, int assignedAssetCount,
    java.time.LocalDateTime createdAt
) {
    /** Use this when you already know the asset count (avoids lazy-loading). */
    public static UserResponse from(User u, int assetCount) {
        return new UserResponse(
            u.getId(), u.getEmployeeId(), u.getName(), u.getEmail(),
            u.getDepartment(), u.getJobTitle(), u.getPhoneNumber(),
            u.getRole(), u.isEnabled(), assetCount,
            u.getCreatedAt()
        );
    }

    /** Convenience overload — only safe inside an open Hibernate session (e.g. @Transactional). */
    public static UserResponse from(User u) {
        int count = 0;
        try {
            if (u.getAssignedAssets() != null && org.hibernate.Hibernate.isInitialized(u.getAssignedAssets())) {
                count = u.getAssignedAssets().size();
            }
        } catch (Exception ignored) { }
        return new UserResponse(
            u.getId(), u.getEmployeeId(), u.getName(), u.getEmail(),
            u.getDepartment(), u.getJobTitle(), u.getPhoneNumber(),
            u.getRole(), u.isEnabled(), count,
            u.getCreatedAt()
        );
    }
}
