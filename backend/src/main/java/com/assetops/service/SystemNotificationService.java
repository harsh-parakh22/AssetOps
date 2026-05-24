package com.assetops.service;

import com.assetops.entity.Notification;
import com.assetops.entity.User;
import com.assetops.enums.NotificationType;
import com.assetops.repository.NotificationRepository;
import com.assetops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SystemNotificationService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final WebSocketNotificationService wsService;

    @Transactional
    public void publishNotificationEvent(UUID targetUserId, String targetEmail,
                                         String type, String title, String message,
                                         UUID entityId, String entityType) {
        log.info("Processing notification locally: user={}, type={}", targetUserId, type);
        try {
            User user = userRepository.findById(targetUserId).orElse(null);
            if (user != null) {
                Notification notification = Notification.builder()
                    .user(user)
                    .type(NotificationType.valueOf(type))
                    .title(title)
                    .message(message)
                    .entityId(entityId)
                    .entityType(entityType)
                    .build();
                notificationRepository.save(notification);
                wsService.sendToUser(targetUserId.toString(), notification);
                emailService.sendNotificationEmail(targetEmail, title, message);
            }
        } catch (Exception ex) {
            log.error("Error processing notification locally: {}", ex.getMessage(), ex);
        }
    }
}
