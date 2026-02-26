package com.yuntu.logistics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private Long id;
    private String username;
    private String fullName;
    private String role;
    private Long orgId;
    private String orgName;
    private String token;
}
