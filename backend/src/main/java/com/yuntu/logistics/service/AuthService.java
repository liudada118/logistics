package com.yuntu.logistics.service;

import com.yuntu.logistics.dto.LoginRequest;
import com.yuntu.logistics.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}
