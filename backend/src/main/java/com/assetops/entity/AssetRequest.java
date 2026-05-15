package com.assetops.entity;

import com.assetops.enums.Priority;
import com.assetops.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_requests",
    indexes = {
        @Index(name = "idx_requests_status", columnList = "status"),
        @Index(name = "idx_requests_requested_by", columnList = "requested_by_id"),
        @Index(name = "idx_requests_asset", columnList = "asset_id")
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssetRequest extends BaseEntity {

    @Column(name = "request_number", nullable = false, unique = true, length = 40)
    private String requestNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    // When no specific asset, describe what's needed
    @Column(name = "requested_asset_type", length = 200)
    private String requestedAssetType;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewer_notes", length = 500)
    private String reviewerNotes;

    @Column(name = "allocated_at")
    private LocalDateTime allocatedAt;

    @Column(name = "return_due_date")
    private LocalDateTime returnDueDate;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    // State machine transitions
    public boolean canApprove() {
        return this.status == RequestStatus.PENDING;
    }

    public boolean canReject() {
        return this.status == RequestStatus.PENDING;
    }

    public boolean canAllocate() {
        return this.status == RequestStatus.APPROVED;
    }

    public boolean canReturn() {
        return this.status == RequestStatus.ALLOCATED;
    }
}
