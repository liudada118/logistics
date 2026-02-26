# 云途物流 SaaS 管理平台 - Spring Boot 后端

## 技术栈
- Java 17 + Spring Boot 3.2
- Spring Security + JWT
- MyBatis-Plus
- MySQL 8.0
- Maven

## 项目结构
```
src/main/java/com/yuntu/logistics/
├── LogisticsApplication.java          # 启动类
├── config/
│   ├── SecurityConfig.java            # Spring Security 配置
│   ├── JwtConfig.java                 # JWT 配置
│   └── CorsConfig.java               # 跨域配置
├── controller/
│   ├── AuthController.java            # 登录认证
│   └── WaybillController.java         # 运单管理
├── service/
│   ├── AuthService.java
│   ├── WaybillService.java
│   └── impl/
│       ├── AuthServiceImpl.java
│       └── WaybillServiceImpl.java
├── mapper/
│   ├── UserMapper.java
│   └── WaybillMapper.java
├── entity/
│   ├── User.java
│   ├── Waybill.java
│   └── WaybillStatusLog.java
├── dto/
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   ├── WaybillCreateRequest.java
│   └── WaybillUpdateRequest.java
├── security/
│   ├── JwtTokenProvider.java
│   └── JwtAuthenticationFilter.java
└── common/
    ├── Result.java                    # 统一响应
    └── PageResult.java                # 分页响应
```

## 快速启动
```bash
# 1. 创建数据库
mysql -u root -p < sql/init.sql

# 2. 修改配置
# 编辑 src/main/resources/application.yml

# 3. 启动
mvn spring-boot:run
```
