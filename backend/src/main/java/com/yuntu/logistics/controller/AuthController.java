package com.yuntu.logistics.controller;

import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.dto.LoginRequest;
import com.yuntu.logistics.dto.LoginResponse;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return Result.success(response);
        } catch (RuntimeException e) {
            return Result.error(401, e.getMessage());
        }
    }

    @GetMapping("/me")
    public Result<LoginResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return Result.error(401, "未登录");
        }
        return Result.success(LoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .orgId(user.getOrgId())
                .orgName(user.getOrgName())
                .build());
    }
}
