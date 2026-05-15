package com.assetops.dto.request;
import com.assetops.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
public record RegisterRequest(
    @NotBlank String employeeId,
    @NotBlank String name,
    @NotBlank @Email String email,
    @NotBlank String password,
    String department,
    String jobTitle,
    String phoneNumber,
    Role role
) {}
