package com.yuntu.logistics.service.impl;

import com.yuntu.logistics.dto.LoginRequest;
import com.yuntu.logistics.dto.LoginResponse;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.mapper.UserMapper;
import com.yuntu.logistics.security.JwtTokenProvider;
import com.yuntu.logistics.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        return LoginResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .orgId(user.getOrgId())
                .orgName(user.getOrgName())
                .token(token)
                .build();
    }
}
