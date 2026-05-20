package com.assetops.controller;

import com.assetops.dto.response.AssetResponse;
import com.assetops.dto.response.PagedResponse;
import com.assetops.dto.response.UserResponse;
import com.assetops.entity.User;
import com.assetops.enums.Role;
import com.assetops.exception.BusinessException;
import com.assetops.repository.AssetRepository;
import com.assetops.repository.UserRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Tag(name = "Users", description = "User and employee management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<PagedResponse<UserResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<User> result = search != null && !search.isBlank()
            ? userRepository.searchUsers(search, pageable)
            : userRepository.findAll(pageable);

        // Batch-load asset counts to avoid N+1 lazy loading
        List<UUID> userIds = result.getContent().stream().map(User::getId).toList();
        Map<UUID, Integer> countMap = buildCountMap(userIds);

        return ResponseEntity.ok(PagedResponse.of(
            result.map(u -> UserResponse.from(u, countMap.getOrDefault(u.getId(), 0)))
        ));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found: " + id));
        int count = userRepository.countAssignedAssets(id);
        return ResponseEntity.ok(UserResponse.from(user, count));
    }

    @GetMapping("/{id}/assets")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AssetResponse>> getUserAssets(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException("User not found: " + id);
        }
        List<AssetResponse> assets = assetRepository.findByAssignedToId(id)
            .stream()
            .map(AssetResponse::from)
            .toList();
        return ResponseEntity.ok(assets);
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<UserResponse> toggleStatus(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found: " + id));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        int count = userRepository.countAssignedAssets(id);
        return ResponseEntity.ok(UserResponse.from(user, count));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public ResponseEntity<UserResponse> changeRole(@PathVariable UUID id, @RequestParam Role role) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new BusinessException("User not found: " + id));
        user.setRole(role);
        userRepository.save(user);
        int count = userRepository.countAssignedAssets(id);
        return ResponseEntity.ok(UserResponse.from(user, count));
    }

    private Map<UUID, Integer> buildCountMap(List<UUID> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return userRepository.countAssignedAssetsByUserIds(userIds).stream()
            .collect(Collectors.toMap(
                row -> (UUID) row[0],
                row -> ((Number) row[1]).intValue()
            ));
    }
}
