package com.assetops.controller;

import com.assetops.dto.response.PagedResponse;
import com.assetops.entity.AuditLog;
import com.assetops.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Tag(name = "Audit Logs", description = "System audit trail & activity logs")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('IT_ADMIN','SUPER_ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<PagedResponse<Map<String, Object>>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String entityType,
        @RequestParam(required = false) UUID entityId
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> result;

        if (entityType != null && entityId != null) {
            result = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable);
        } else {
            result = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        Page<Map<String, Object>> mapped = result.map(a -> Map.of(
            "id", a.getId().toString(),
            "entityType", a.getEntityType(),
            "entityId", a.getEntityId().toString(),
            "action", a.getAction(),
            "oldValue", a.getOldValue() != null ? a.getOldValue() : "",
            "newValue", a.getNewValue() != null ? a.getNewValue() : "",
            "performedBy", a.getPerformedBy() != null ? a.getPerformedBy() : "System",
            "createdAt", a.getCreatedAt().toString()
        ));

        return ResponseEntity.ok(PagedResponse.of(mapped));
    }
}
