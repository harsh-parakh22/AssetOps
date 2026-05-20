package com.assetops.controller;

import com.assetops.entity.Notification;
import com.assetops.entity.User;
import com.assetops.exception.BusinessException;
import com.assetops.repository.NotificationRepository;
import com.assetops.repository.UserRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> list(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        User user = getUser(auth.getName());
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> result = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        // Map to simple response
        var content = result.getContent().stream().map(n -> Map.of(
            "id", n.getId().toString(),
            "type", n.getType().name(),
            "title", n.getTitle(),
            "message", n.getMessage(),
            "isRead", n.isRead(),
            "createdAt", n.getCreatedAt().toString(),
            "entityId", n.getEntityId() != null ? n.getEntityId().toString() : "",
            "entityType", n.getEntityType() != null ? n.getEntityType() : ""
        )).toList();

        return ResponseEntity.ok(Map.of(
            "content", content,
            "page", result.getNumber(),
            "size", result.getSize(),
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages(),
            "first", result.isFirst(),
            "last", result.isLast()
        ));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        User user = getUser(auth.getName());
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        User user = getUser(auth.getName());
        notificationRepository.markAllAsReadForUser(user.getId());
        return ResponseEntity.ok().build();
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable java.util.UUID id, Authentication auth) {
        User user = getUser(auth.getName());
        notificationRepository.markAsRead(id, user.getId());
        return ResponseEntity.ok().build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found: " + email));
    }
}
