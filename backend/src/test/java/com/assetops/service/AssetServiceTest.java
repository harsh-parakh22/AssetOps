package com.assetops.service;

import com.assetops.dto.request.AssetCreateRequest;
import com.assetops.dto.response.AssetResponse;
import com.assetops.entity.Asset;
import com.assetops.enums.AssetCategory;
import com.assetops.enums.AssetStatus;
import com.assetops.exception.BusinessException;
import com.assetops.kafka.AssetEventProducer;
import com.assetops.repository.AssetRepository;
import com.assetops.repository.UserRepository;
import com.assetops.service.impl.AssetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AssetService Tests")
@SuppressWarnings("null")
class AssetServiceTest {

    @Mock AssetRepository assetRepository;
    @Mock UserRepository userRepository;
    @Mock AssetEventProducer eventProducer;

    @InjectMocks AssetServiceImpl assetService;

    @BeforeEach
    void setupSecurityContext() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("test@example.com");
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }

    @Nested
    @DisplayName("create()")
    class CreateTests {

        @Test
        @DisplayName("should create asset with generated tag when tag not provided")
        void shouldCreateAssetWithGeneratedTag() {
            var req = new AssetCreateRequest(
                null, "MacBook Pro 16\"", null, AssetCategory.LAPTOP,
                "Apple", "MK193LL/A", null, null, null, null, null, "Bangalore", null
            );

            Asset saved = Asset.builder()
                .assetTag("AST-0001")
                .name(req.name())
                .category(req.category())
                .status(AssetStatus.AVAILABLE)
                .build();

            when(assetRepository.save(any())).thenReturn(saved);

            AssetResponse result = assetService.create(req);

            assertThat(result).isNotNull();
            assertThat(result.name()).isEqualTo("MacBook Pro 16\"");
            assertThat(result.status()).isEqualTo(AssetStatus.AVAILABLE);
            verify(eventProducer).publishAssetEvent(eq("CREATED"), any(), any(), any(), isNull(), any(), isNull(), anyString());
            verify(eventProducer).publishAuditEvent(eq("Asset"), any(), eq("CREATE"), isNull(), any(), anyString(), isNull());
        }

        @Test
        @DisplayName("should throw when asset tag already exists")
        void shouldThrowWhenTagExists() {
            var req = new AssetCreateRequest(
                "AST-DUPE", "Test Asset", null, AssetCategory.MONITOR,
                null, null, null, null, null, null, null, null, null
            );
            when(assetRepository.existsByAssetTag("AST-DUPE")).thenReturn(true);

            assertThatThrownBy(() -> assetService.create(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Asset tag already exists");

            verify(assetRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("assign()")
    class AssignTests {

        @Test
        @DisplayName("should assign available asset to user")
        void shouldAssignAvailableAsset() {
            UUID assetId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            Asset asset = Asset.builder()
                .assetTag("AST-0001")
                .name("Dell Monitor")
                .status(AssetStatus.AVAILABLE)
                .category(AssetCategory.MONITOR)
                .build();

            com.assetops.entity.User user = com.assetops.entity.User.builder()
                .name("Test User").email("test@example.com")
                .role(com.assetops.enums.Role.EMPLOYEE).build();
            user.setId(userId);

            when(assetRepository.findById(assetId)).thenReturn(Optional.of(asset));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(assetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AssetResponse result = assetService.assign(assetId, userId);

            assertThat(result.status()).isEqualTo(AssetStatus.ASSIGNED);
            assertThat(result.assignedToName()).isEqualTo("Test User");
        }

        @Test
        @DisplayName("should throw when asset is not available")
        void shouldThrowWhenNotAvailable() {
            UUID assetId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();

            Asset asset = Asset.builder()
                .assetTag("AST-0002")
                .name("Laptop")
                .status(AssetStatus.ASSIGNED)
                .build();

            com.assetops.entity.User user = com.assetops.entity.User.builder()
                .name("User").email("u@e.com")
                .role(com.assetops.enums.Role.EMPLOYEE).build();
            user.setId(userId);
            
            when(assetRepository.findById(assetId)).thenReturn(Optional.of(asset));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> assetService.assign(assetId, userId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not available");
        }
    }

    @Nested
    @DisplayName("findById()")
    class FindByIdTests {

        @Test
        @DisplayName("should throw when asset not found")
        void shouldThrowWhenNotFound() {
            UUID id = UUID.randomUUID();
            when(assetRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> assetService.findById(id))
                .isInstanceOf(com.assetops.exception.AssetNotFoundException.class);
        }
    }
}
