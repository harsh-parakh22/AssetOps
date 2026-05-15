package com.assetops.entity;

import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import com.assetops.enums.LifecycleStage;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assets",
    indexes = {
        @Index(name = "idx_assets_asset_tag", columnList = "asset_tag", unique = true),
        @Index(name = "idx_assets_status", columnList = "status"),
        @Index(name = "idx_assets_category", columnList = "category"),
        @Index(name = "idx_assets_assigned_to", columnList = "assigned_to_id")
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Asset extends BaseEntity {

    @Column(name = "asset_tag", nullable = false, unique = true, length = 30)
    private String assetTag;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetCategory category;

    @Column(length = 100)
    private String manufacturer;

    @Column(length = 100)
    private String model;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AssetStatus status = AssetStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_stage")
    @Builder.Default
    private LifecycleStage lifecycleStage = LifecycleStage.ACTIVE;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_cost", precision = 12, scale = 2)
    private BigDecimal purchaseCost;

    @Column(name = "refresh_date")
    private LocalDate refreshDate;

    @Column(name = "warranty_expiry")
    private LocalDate warrantyExpiry;

    @Column(length = 100)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "assigned_date")
    private LocalDate assignedDate;

    @Column(name = "notes", length = 1000)
    private String notes;

    // Computed: months since purchase
    @Transient
    public long getAgeInMonths() {
        if (purchaseDate == null) return 0;
        return java.time.temporal.ChronoUnit.MONTHS.between(purchaseDate, LocalDate.now());
    }

    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AssetRequest> requests = new ArrayList<>();

    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AuditLog> auditLogs = new ArrayList<>();
}
