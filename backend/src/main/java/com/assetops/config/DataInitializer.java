package com.assetops.config;

import com.assetops.entity.User;
import com.assetops.enums.Role;
import com.assetops.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Create Super Admin if not exists
            if (!userRepository.existsByEmail("admin@assetops.com")) {
                userRepository.save(User.builder()
                    .employeeId("EMP-0001")
                    .name("System Administrator")
                    .email("admin@assetops.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .department("IT")
                    .jobTitle("Super Admin")
                    .role(Role.SUPER_ADMIN)
                    .enabled(true)
                    .build());
                log.info("✅ Created super admin: admin@assetops.com / Admin@123");
            }

            // Create IT Admin
            if (!userRepository.existsByEmail("arjun@assetops.com")) {
                userRepository.save(User.builder()
                    .employeeId("EMP-0002")
                    .name("Arjun Kumar")
                    .email("arjun@assetops.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .department("IT")
                    .jobTitle("IT Administrator")
                    .role(Role.IT_ADMIN)
                    .enabled(true)
                    .build());
                log.info("✅ Created IT admin: arjun@assetops.com / Admin@123");
            }

            // Create sample employee
            if (!userRepository.existsByEmail("priya@assetops.com")) {
                userRepository.save(User.builder()
                    .employeeId("EMP-0003")
                    .name("Priya Sharma")
                    .email("priya@assetops.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .department("Engineering")
                    .jobTitle("Senior Developer")
                    .role(Role.EMPLOYEE)
                    .enabled(true)
                    .build());
                log.info("✅ Created employee: priya@assetops.com / Admin@123");
            }
        };
    }
}
