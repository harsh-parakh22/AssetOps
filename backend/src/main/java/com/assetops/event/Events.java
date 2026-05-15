package com.assetops.event;

import com.assetops.enums.AssetStatus;
import com.assetops.enums.NotificationType;
import com.assetops.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

// ─── Base Event ─────────────────────────────────────────────
@Data
@NoArgsConstructor
@AllArgsConstructor
abstract class BaseEvent implements Serializable {
    private String eventId = UUID.randomUUID().toString();
    private LocalDateTime occurredAt = LocalDateTime.now();
    private String performedBy;
}

// ─── Asset Events ────────────────────────────────────────────
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AssetEvent implements Serializable {
    private String eventId;
    private String eventType;   // CREATED, UPDATED, ASSIGNED, RETURNED, STATUS_CHANGED
    private UUID assetId;
    private String assetTag;
    private String assetName;
    private AssetStatus oldStatus;
    private AssetStatus newStatus;
    private UUID assignedToUserId;
    private String performedBy;
    private LocalDateTime occurredAt;
}

// ─── Request Events ──────────────────────────────────────────
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class RequestEvent implements Serializable {
    private String eventId;
    private String eventType;   // SUBMITTED, APPROVED, REJECTED, ALLOCATED, RETURNED
    private UUID requestId;
    private String requestNumber;
    private UUID requestedByUserId;
    private UUID reviewedByUserId;
    private RequestStatus oldStatus;
    private RequestStatus newStatus;
    private String reason;
    private String performedBy;
    private LocalDateTime occurredAt;
}

// ─── Notification Event ──────────────────────────────────────
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class NotificationEvent implements Serializable {
    private String eventId;
    private UUID targetUserId;
    private String targetEmail;
    private NotificationType type;
    private String title;
    private String message;
    private UUID entityId;
    private String entityType;
    private LocalDateTime occurredAt;
}

// ─── Audit Event ─────────────────────────────────────────────
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AuditEvent implements Serializable {
    private String eventId;
    private String entityType;
    private UUID entityId;
    private String action;
    private String oldValue;
    private String newValue;
    private String performedBy;
    private String ipAddress;
    private LocalDateTime occurredAt;
}
