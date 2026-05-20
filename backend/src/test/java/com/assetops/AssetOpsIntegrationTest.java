package com.assetops;

import com.assetops.dto.request.LoginRequest;
import com.assetops.dto.response.AuthResponse;
import com.assetops.entity.User;
import com.assetops.enums.Role;
import com.assetops.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@Disabled("Disabled in CI/CD to prevent infrastructure dependency issues")
@SuppressWarnings("resource")
class AssetOpsIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("assetops_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Use embedded for tests
        registry.add("spring.kafka.bootstrap-servers", () -> "localhost:9092");
        registry.add("spring.data.redis.host", () -> "localhost");
        registry.add("spring.autoconfigure.exclude",
            () -> "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
                  "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration");
    }

    @LocalServerPort
    int port;

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api";

        // Seed test user if not exists
        if (!userRepository.existsByEmail("test@assetops.com")) {
            userRepository.save(User.builder()
                .employeeId("EMP-TEST-01")
                .name("Test Admin")
                .email("test@assetops.com")
                .password(passwordEncoder.encode("Test@123"))
                .role(Role.IT_ADMIN)
                .department("IT")
                .build());
        }
    }

    @Test
    void shouldLoginSuccessfully() {
        var req = new LoginRequest("test@assetops.com", "Test@123");
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
            baseUrl + "/auth/login", req, AuthResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isNotBlank();
        assertThat(response.getBody().role()).isEqualTo(Role.IT_ADMIN);
    }

    @Test
    void shouldRejectInvalidCredentials() {
        var req = new LoginRequest("test@assetops.com", "WrongPassword");
        ResponseEntity<String> response = restTemplate.postForEntity(
            baseUrl + "/auth/login", req, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldReturnUnauthorizedWhenNoToken() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl + "/assets", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void shouldAccessAssetsWithValidToken() {
        // Login first
        var loginReq = new LoginRequest("test@assetops.com", "Test@123");
        AuthResponse auth = restTemplate
            .postForEntity(baseUrl + "/auth/login", loginReq, AuthResponse.class)
            .getBody();
        assertThat(auth).isNotNull();

        // Access assets with token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(auth.accessToken());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
            baseUrl + "/assets", HttpMethod.GET, entity, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void healthEndpointShouldBePublic() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl + "/actuator/health", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
