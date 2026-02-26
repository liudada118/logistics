# 云途物流 SaaS 管理平台

一站式物流管理解决方案，覆盖运单管理、运输调度、仓储管控、财务结算全流程。

## 技术栈

### 后端
- **框架**: Spring Boot 3.x + MyBatis-Plus
- **数据库**: MySQL 8.0
- **认证**: JWT Token
- **API**: RESTful

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: TailwindCSS
- **路由**: Wouter

## 功能模块

| 模块 | 功能 |
|------|------|
| **营运中心** | 工作台经营驾驶舱、运单管理（受理开单）、运输任务（配载/装车/发车/到达）、库存管理（发货/到货双库存）、签收管理、异常管理 |
| **回单管理** | 回单全生命周期（签收→寄出→收到→返厂）、反签收/反寄出 |
| **财务中心** | 应收/应付/代收货款、结款核销、批量核销 |
| **基础资料** | 网点管理、线路管理、车辆管理、客户管理 |
| **系统管理** | 预警中心、用户管理、操作日志 |

## 业务流程

```
受理开单 → 调度配载 → 装车发车 → 中转/到达入库 → 签收登记 → 回单管理 → 财务结算
```

### 运单付款方式
- 现付、提付、回单付、月结、货款扣

### 运费明细
- 基本运费、保险费、接货费、送货费、包装费、其他费用（自动汇总）

### 代收货款
- 签收后从收货方收取并返还给发货方

## 项目结构

```
logistics/
├── backend/                  # Java Spring Boot 后端
│   ├── sql/init.sql          # 数据库初始化脚本
│   ├── src/main/java/com/yuntu/logistics/
│   │   ├── controller/       # REST API 控制器
│   │   ├── service/          # 业务逻辑层
│   │   ├── entity/           # 数据实体
│   │   ├── mapper/           # MyBatis Mapper
│   │   ├── dto/              # 数据传输对象
│   │   ├── config/           # 配置类
│   │   └── security/         # JWT 安全认证
│   └── pom.xml
├── frontend/                 # React TypeScript 前端
│   ├── client/src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 公共组件
│   │   ├── contexts/         # 状态管理
│   │   └── lib/              # API客户端/工具
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 快速开始

### 后端
```bash
cd backend
# 配置 MySQL 连接 (application.yml)
mvn spring-boot:run
```

### 前端
```bash
cd frontend
pnpm install
pnpm dev
```

## 数据库表

| 表名 | 说明 |
|------|------|
| sys_user | 系统用户 |
| base_organization | 网点/组织 |
| base_route | 线路 |
| base_vehicle | 车辆 |
| base_customer | 客户 |
| biz_waybill | 运单 |
| biz_waybill_status_log | 运单状态日志 |
| biz_transport_task | 运输任务 |
| biz_transport_waybill | 任务-运单关联 |
| biz_inventory | 库存 |
| biz_sign_record | 签收记录 |
| biz_exception_record | 异常登记 |
| biz_receipt_record | 回单记录 |
| biz_finance_record | 财务流水 |
| biz_alert | 预警记录 |
| sys_operation_log | 操作日志 |
