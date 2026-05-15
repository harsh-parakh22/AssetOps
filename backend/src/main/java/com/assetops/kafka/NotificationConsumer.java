package com.assetops.kafka;

import com.assetops.entity.Notification;
import com.assetops.entity.User;
import com.assetops.enums.NotificationType;
import com.assetops.repository.NotificationRepository;
import com.assetops.repository.UserRepository;
import com.assetops.service.EmailService;
import com.assetops.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final WebSocketNotificationService wsService;

    @KafkaListener(topics = "${app.kafka.topics.notification-events}",
                   groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ConsumerRecord<String, Map<String, Object>> record, Acknowledgment ack) {
        try {
            Map<String, Object> e = record.value();
            UUID userId = UUID.fromString((String) e.get("targetUserId"));
            User user = userRepository.findById(userId).orElse(null);

            if (user != null) {
                String entityIdStr = (String) e.get("entityId");
                Notification notification = Notification.builder()
                    .user(user)
                    .type(NotificationType.valueOf((String) e.get("type")))
                    .title((String) e.get("title"))
                    .message((String) e.get("message"))
                    .entityId(entityIdStr != null && !entityIdStr.isBlank()
                        ? UUID.fromString(entityIdStr) : null)
                    .entityType((String) e.get("entityType"))
                    .build();

                notificationRepository.save(notification);
                wsService.sendToUser(userId.toString(), notification);
                emailService.sendNotificationEmail(
                    (String) e.get("targetEmail"),
                    (String) e.get("title"),
                    (String) e.get("message")
                );
            }
            ack.acknowledge();
        } catch (Exception ex) {
            log.error("Error processing notification event: {}", ex.getMessage(), ex);
            ack.acknowledge(); // Use DLQ in production
        }
    }

    @KafkaListener(topics = "${app.kafka.topics.audit-events}",
                   groupId = "${spring.kafka.consumer.group-id}")
    public void consumeAudit(ConsumerRecord<String, Map<String, Object>> record, Acknowledgment ack) {
        try {
            Map<String, Object> e = record.value();
            log.info("AUDIT | entity={} id={} action={} by={}",
                e.get("entityType"), e.get("entityId"), e.get("action"), e.get("performedBy"));
            // Audit events are logged here; integrate with BigQuery or Cloud Logging when deploying to GCP
            ack.acknowledge();
        } catch (Exception ex) {
            log.error("Error processing audit event: {}", ex.getMessage(), ex);
            ack.acknowledge();
        }
    }
}
