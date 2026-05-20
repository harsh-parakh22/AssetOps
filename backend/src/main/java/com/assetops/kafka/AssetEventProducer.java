package com.assetops.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import com.assetops.entity.Notification;
import com.assetops.entity.User;
import com.assetops.enums.NotificationType;
import com.assetops.repository.NotificationRepository;
import com.assetops.repository.UserRepository;
import com.assetops.service.EmailService;
import com.assetops.service.WebSocketNotificationService;

@Slf4j
@Component
public class AssetEventProducer {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.enabled:false}")
    private boolean kafkaEnabled;

    @org.springframework.beans.factory.annotation.Autowired
    private UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private NotificationRepository notificationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private EmailService emailService;

    @org.springframework.beans.factory.annotation.Autowired
    private WebSocketNotificationService wsService;

    @Value("${app.kafka.topics.asset-events}")        private String assetTopic;
    @Value("${app.kafka.topics.request-events}")      private String requestTopic;
    @Value("${app.kafka.topics.notification-events}") private String notifTopic;
    @Value("${app.kafka.topics.audit-events}")        private String auditTopic;

    public void publishAssetEvent(String eventType, UUID assetId, String assetTag,
                                   String assetName, Object oldStatus, Object newStatus,
                                   UUID assignedTo, String performedBy) {
        Map<String, String> event = new HashMap<>();
        event.put("eventId",          UUID.randomUUID().toString());
        event.put("eventType",        eventType);
        event.put("assetId",          assetId.toString());
        event.put("assetTag",         assetTag);
        event.put("assetName",        assetName);
        event.put("oldStatus",        str(oldStatus));
        event.put("newStatus",        str(newStatus));
        event.put("assignedToUserId", assignedTo != null ? assignedTo.toString() : "");
        event.put("performedBy",      performedBy);
        event.put("occurredAt",       LocalDateTime.now().toString());
        send(assetTopic, assetId.toString(), event);
    }

    public void publishRequestEvent(String eventType, UUID requestId, String requestNumber,
                                     UUID requestedBy, UUID reviewedBy,
                                     Object oldStatus, Object newStatus,
                                     String reason, String performedBy) {
        Map<String, String> event = new HashMap<>();
        event.put("eventId",           UUID.randomUUID().toString());
        event.put("eventType",         eventType);
        event.put("requestId",         requestId.toString());
        event.put("requestNumber",     requestNumber);
        event.put("requestedByUserId", requestedBy.toString());
        event.put("reviewedByUserId",  reviewedBy != null ? reviewedBy.toString() : "");
        event.put("oldStatus",         str(oldStatus));
        event.put("newStatus",         str(newStatus));
        event.put("reason",            reason != null ? reason : "");
        event.put("performedBy",       performedBy);
        event.put("occurredAt",        LocalDateTime.now().toString());
        send(requestTopic, requestId.toString(), event);
    }

    public void publishNotificationEvent(UUID targetUserId, String targetEmail,
                                          String type, String title, String message,
                                          UUID entityId, String entityType) {
        if (!kafkaEnabled) {
            log.info("[KAFKA DISABLED] Processing notification locally: user={}, type={}", targetUserId, type);
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
            return;
        }

        Map<String, String> event = new HashMap<>();
        event.put("eventId",      UUID.randomUUID().toString());
        event.put("targetUserId", targetUserId.toString());
        event.put("targetEmail",  targetEmail);
        event.put("type",         type);
        event.put("title",        title);
        event.put("message",      message);
        event.put("entityId",     entityId != null ? entityId.toString() : "");
        event.put("entityType",   entityType != null ? entityType : "");
        event.put("occurredAt",   LocalDateTime.now().toString());
        send(notifTopic, targetUserId.toString(), event);
    }

    public void publishAuditEvent(String entityType, UUID entityId, String action,
                                   String oldValue, String newValue,
                                   String performedBy, String ipAddress) {
        if (!kafkaEnabled) {
            log.info("AUDIT | entity={} id={} action={} by={}",
                entityType, entityId, action, performedBy);
            return;
        }

        Map<String, String> event = new HashMap<>();
        event.put("eventId",     UUID.randomUUID().toString());
        event.put("entityType",  entityType);
        event.put("entityId",    entityId.toString());
        event.put("action",      action);
        event.put("oldValue",    oldValue != null ? oldValue : "");
        event.put("newValue",    newValue != null ? newValue : "");
        event.put("performedBy", performedBy);
        event.put("ipAddress",   ipAddress != null ? ipAddress : "");
        event.put("occurredAt",  LocalDateTime.now().toString());
        send(auditTopic, entityId.toString(), event);
    }

    private void send(String topic, String key, Object payload) {
        if (!kafkaEnabled || kafkaTemplate == null) {
            log.info("[KAFKA DISABLED] Event for topic {}: {}", topic, payload);
            return;
        }
        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, payload);
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Kafka send failed [topic={}]: {}", topic, ex.getMessage());
            } else {
                log.debug("Kafka event sent [topic={} partition={} offset={}]",
                    topic,
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
            }
        });
    }

    private String str(Object o) { return o != null ? o.toString() : ""; }
}
