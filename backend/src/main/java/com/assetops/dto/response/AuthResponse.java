package com.assetops.dto.response;

import com.assetops.enums.Role;
import java.util.UUID;

public record AuthResponse(
    String accessToken, String refreshToken, String tokenType,
    UUID userId, String name, String email, Role role
) {
    public static AuthResponse of(String access, String refresh, com.assetops.entity.User user) {
        return new AuthResponse(access, refresh, "Bearer",
            user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
