package com.assetops.controller;

import com.assetops.dto.request.LoginRequest;
import com.assetops.dto.request.RegisterRequest;
import com.assetops.dto.response.AuthResponse;
import com.assetops.entity.User;
import com.assetops.enums.Role;
import com.assetops.exception.BusinessException;
import com.assetops.repository.UserRepository;
import com.assetops.security.JwtService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth", description = "Authentication & registration")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new BusinessException("User not found"));

        String access = jwtService.generateAccessToken(user.getEmail(), Map.of(
            "role", user.getRole().name(),
            "userId", user.getId().toString(),
            "name", user.getName()
        ));
        String refresh = jwtService.generateRefreshToken(user.getEmail());

        return ResponseEntity.ok(AuthResponse.of(access, refresh, user));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new BusinessException("Email already registered: " + req.email());
        if (userRepository.existsByEmployeeId(req.employeeId()))
            throw new BusinessException("Employee ID already exists: " + req.employeeId());

        User user = User.builder()
            .employeeId(req.employeeId())
            .name(req.name())
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .department(req.department())
            .jobTitle(req.jobTitle())
            .phoneNumber(req.phoneNumber())
            .role(req.role() != null ? req.role() : Role.EMPLOYEE)
            .build();
        user = userRepository.save(user);

        String access = jwtService.generateAccessToken(user.getEmail(), Map.of(
            "role", user.getRole().name(), "userId", user.getId().toString(), "name", user.getName()
        ));
        String refresh = jwtService.generateRefreshToken(user.getEmail());
        return ResponseEntity.ok(AuthResponse.of(access, refresh, user));
    }

    @GetMapping("/me")
    public ResponseEntity<com.assetops.dto.response.UserResponse> me(
        org.springframework.security.core.Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new BusinessException("User not found"));
        return ResponseEntity.ok(com.assetops.dto.response.UserResponse.from(user));
    }
}
