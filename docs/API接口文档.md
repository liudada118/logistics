# 物流管理系统 API 接口文档

**版本**: 2.0  
**日期**: 2026-03-01  
**Base URL**: `http://your-server/api`  
**认证方式**: Bearer Token（JWT）  

---

## 目录

1. [认证接口](#1-认证接口)
2. [运单接口](#2-运单接口)
3. [营运中心接口](#3-营运中心接口)
4. [财务接口](#4-财务接口)
5. [基础数据接口](#5-基础数据接口)
6. [系统管理接口](#6-系统管理接口)
7. [枚举值定义](#7-枚举值定义)

---

## 1. 认证接口

### 1.1 登录

**POST** `/auth/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Response (200 OK)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "系统管理员",
      "orgId": 1,
      "orgName": "总部",
      "roles": ["ADMIN"]
    }
  }
}
```

### 1.2 登出

**POST** `/auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{ "code": 200, "message": "已退出登录" }
```

### 1.3 获取当前用户信息

**GET** `/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response (200 OK)**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "系统管理员",
    "orgId": 1,
    "orgName": "总部",
    "roles": ["ADMIN"],
    "permissions": ["waybill:create", "waybill:edit", "waybill:delete"]
  }
}
```

---

## 2. 运单接口

### 2.1 新建运单

**POST** `/waybills`

**Request Body**:
```json
{
  "originOrgId": 1,
  "originOrgName": "广州分拨中心",
  "transitOrgId": null,
  "transitOrgName": null,
  "destOrgId": 2,
  "destOrgName": "上海分拨中心",
  "goodsNo": "HH20260301001",
  "senderName": "张三",
  "senderPhone": "13800138000",
  "senderTel": "020-88888888",
  "senderAddress": "广东省广州市天河区天河路100号",
  "receiverName": "李四",
  "receiverPhone": "13900139000",
  "receiverTel": "",
  "receiverAddress": "上海市浦东新区陆家嘴环路1000号",
  "goodsName": "精密仪器",
  "packingType": "WOODEN_BOX",
  "quantity": 5,
  "weight": 25.50,
  "volume": 1.2000,
  "baseFreight": 450.00,
  "freightDiscount": 1.0,
  "discountFreight": 450.00,
  "insuranceFee": 30.00,
  "pickupFee": 20.00,
  "deliveryFee": 0.00,
  "packingFee": 0.00,
  "otherFee": 0.00,
  "freightFee": 500.00,
  "paymentNow": 500.00,
  "paymentFetch": 0.00,
  "paymentReceipt": 0.00,
  "paymentMonthly": 0.00,
  "paymentCodDeduct": 0.00,
  "codAmount": 0.00,
  "receiptRequired": false,
  "receiptCount": 0,
  "remark": "易碎品，轻拿轻放"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `originOrgId` | Long | ✅ | 发站网点ID |
| `originOrgName` | String | ✅ | 发站网点名称（前端传入，避免二次查库） |
| `transitOrgId` | Long | ❌ | 中转地网点ID |
| `transitOrgName` | String | ❌ | 中转地网点名称 |
| `destOrgId` | Long | ✅ | 到站网点ID |
| `destOrgName` | String | ✅ | 到站网点名称 |
| `goodsNo` | String | ❌ | 客户货号，最长50字符 |
| `senderName` | String | ✅ | 发货人姓名，最长50字符 |
| `senderPhone` | String | ✅ | 发货人手机，11位 |
| `senderTel` | String | ❌ | 发货人座机 |
| `senderAddress` | String | ❌ | 发货地址（上门提货地址） |
| `receiverName` | String | ✅ | 收货人姓名，最长50字符 |
| `receiverPhone` | String | ✅ | 收货人手机，11位 |
| `receiverTel` | String | ❌ | 收货人座机 |
| `receiverAddress` | String | ✅ | 收货地址，最长200字符 |
| `goodsName` | String | ✅ | 品名，最长100字符 |
| `packingType` | Enum | ✅ | 见枚举值定义 |
| `quantity` | Integer | ✅ | 件数，1~9999 |
| `weight` | Float | ✅ | 重量(kg)，保留2位小数 |
| `volume` | Float | ❌ | 体积(m³)，保留4位小数 |
| `baseFreight` | Float | ✅ | 基本运费，≥0 |
| `freightDiscount` | Float | ❌ | 折扣率，0~1，默认1.0 |
| `discountFreight` | Float | 自动计算 | `baseFreight × freightDiscount` |
| `insuranceFee` | Float | ❌ | 保险费，默认0 |
| `pickupFee` | Float | ❌ | 接货费，默认0 |
| `deliveryFee` | Float | ❌ | 送货费，默认0 |
| `packingFee` | Float | ❌ | 包装费，默认0 |
| `otherFee` | Float | ❌ | 其他费，默认0 |
| `freightFee` | Float | 自动计算 | 运费合计 |
| `paymentNow` | Float | ❌ | 现付金额，默认0 |
| `paymentFetch` | Float | ❌ | 提付金额，默认0 |
| `paymentReceipt` | Float | ❌ | 回单付金额，默认0 |
| `paymentMonthly` | Float | ❌ | 月结金额，默认0 |
| `paymentCodDeduct` | Float | ❌ | 货款扣金额，默认0 |
| `codAmount` | Float | ❌ | 代收货款，默认0 |
| `receiptRequired` | Boolean | ❌ | 是否需要回单，默认false |
| `receiptCount` | Integer | ❌ | 回单份数，默认0 |
| `remark` | String | ❌ | 备注，最长500字符 |

**业务约束**:
- `paymentNow + paymentFetch + paymentReceipt + paymentMonthly + paymentCodDeduct` 应等于 `freightFee`（警告但不阻止）
- `freightFee = discountFreight + insuranceFee + pickupFee + deliveryFee + packingFee + otherFee`
- `discountFreight = baseFreight × freightDiscount`

**Response (201 Created)**:
```json
{
  "code": 201,
  "message": "运单创建成功",
  "data": {
    "id": 1001,
    "waybillNo": "YT202603010001",
    "status": "PENDING",
    "createdAt": "2026-03-01T10:30:00"
  }
}
```

---

### 2.2 查询运单列表

**GET** `/waybills`

**Query Parameters**:

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `page` | Integer | ❌ | 页码，默认1 |
| `pageSize` | Integer | ❌ | 每页条数，默认20，最大100 |
| `status` | String | ❌ | 状态筛选，多个用逗号分隔，如 `PENDING,IN_TRANSIT` |
| `keyword` | String | ❌ | 关键字搜索（运单号/发货人/收货人/手机号） |
| `dateFrom` | String | ❌ | 开单开始日期，格式 `YYYY-MM-DD` |
| `dateTo` | String | ❌ | 开单结束日期，格式 `YYYY-MM-DD` |
| `originOrgId` | Long | ❌ | 发站网点ID |
| `destOrgId` | Long | ❌ | 到站网点ID |
| `createdBy` | Long | ❌ | 开单员ID |

**Response (200 OK)**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1001,
        "waybillNo": "YT202603010001",
        "status": "PENDING",
        "statusLabel": "待调度",
        "originOrgName": "广州分拨中心",
        "transitOrgName": null,
        "destOrgName": "上海分拨中心",
        "senderName": "张三",
        "senderPhone": "13800138000",
        "receiverName": "李四",
        "receiverPhone": "13900139000",
        "goodsName": "精密仪器",
        "packingType": "WOODEN_BOX",
        "packingTypeLabel": "木箱",
        "quantity": 5,
        "weight": 25.50,
        "volume": 1.2000,
        "paymentNow": 500.00,
        "paymentFetch": 0.00,
        "paymentReceipt": 0.00,
        "paymentMonthly": 0.00,
        "paymentCodDeduct": 0.00,
        "baseFreight": 450.00,
        "freightFee": 500.00,
        "codAmount": 0.00,
        "createdAt": "2026-03-01T10:30:00",
        "createdByName": "开单员A"
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 2.3 获取运单详情

**GET** `/waybills/{id}`

**Response (200 OK)**:
```json
{
  "code": 200,
  "data": {
    "id": 1001,
    "waybillNo": "YT202603010001",
    "status": "PENDING",
    "statusLabel": "待调度",
    "originOrgId": 1,
    "originOrgName": "广州分拨中心",
    "transitOrgId": null,
    "transitOrgName": null,
    "destOrgId": 2,
    "destOrgName": "上海分拨中心",
    "goodsNo": "HH20260301001",
    "senderName": "张三",
    "senderPhone": "13800138000",
    "senderTel": "020-88888888",
    "senderAddress": "广东省广州市天河区天河路100号",
    "receiverName": "李四",
    "receiverPhone": "13900139000",
    "receiverTel": "",
    "receiverAddress": "上海市浦东新区陆家嘴环路1000号",
    "goodsName": "精密仪器",
    "packingType": "WOODEN_BOX",
    "packingTypeLabel": "木箱",
    "quantity": 5,
    "weight": 25.50,
    "volume": 1.2000,
    "baseFreight": 450.00,
    "freightDiscount": 1.0,
    "discountFreight": 450.00,
    "insuranceFee": 30.00,
    "pickupFee": 20.00,
    "deliveryFee": 0.00,
    "packingFee": 0.00,
    "otherFee": 0.00,
    "freightFee": 500.00,
    "paymentNow": 500.00,
    "paymentFetch": 0.00,
    "paymentReceipt": 0.00,
    "paymentMonthly": 0.00,
    "paymentCodDeduct": 0.00,
    "codAmount": 0.00,
    "receiptRequired": false,
    "receiptCount": 0,
    "remark": "易碎品，轻拿轻放",
    "createdAt": "2026-03-01T10:30:00",
    "createdByName": "开单员A",
    "updatedAt": "2026-03-01T10:30:00",
    "statusHistory": [
      {
        "status": "PENDING",
        "statusLabel": "待调度",
        "operatedAt": "2026-03-01T10:30:00",
        "operatedBy": "开单员A",
        "remark": "运单创建"
      }
    ]
  }
}
```

---

### 2.4 修改运单

**PUT** `/waybills/{id}`

**业务约束**:
- 仅 `PENDING`（待调度）状态的运单可修改
- 已发货（`IN_TRANSIT`）及之后状态不可修改基本信息，仅可修改备注

**Request Body**: 同新建运单（全量更新）

**Response (200 OK)**:
```json
{ "code": 200, "message": "修改成功" }
```

---

### 2.5 删除运单

**DELETE** `/waybills/{id}`

**业务约束**: 仅 `PENDING` 状态可删除

**Response (200 OK)**:
```json
{ "code": 200, "message": "删除成功" }
```

---

### 2.6 作废运单

**POST** `/waybills/{id}/cancel`

**Request Body**:
```json
{ "reason": "客户取消发货" }
```

**业务约束**: `PENDING`、`IN_TRANSIT` 状态可作废，`SIGNED` 状态不可作废

**Response (200 OK)**:
```json
{ "code": 200, "message": "运单已作废" }
```

---

## 3. 营运中心接口

### 3.1 派车单管理

#### 3.1.1 创建派车单

**POST** `/dispatch/orders`

```json
{
  "vehicleId": 1,
  "driverId": 2,
  "routeId": 1,
  "plannedDepartTime": "2026-03-01T14:00:00",
  "waybillIds": [1001, 1002, 1003],
  "remark": ""
}
```

**Response (201 Created)**:
```json
{
  "code": 201,
  "data": {
    "id": 501,
    "dispatchNo": "PC202603010001",
    "status": "PENDING",
    "totalQuantity": 15,
    "totalWeight": 76.50,
    "totalVolume": 3.6000
  }
}
```

#### 3.1.2 发车确认

**POST** `/dispatch/orders/{id}/depart`

```json
{
  "actualDepartTime": "2026-03-01T14:15:00",
  "remark": ""
}
```

**业务效果**: 派车单状态 → `IN_TRANSIT`，关联运单状态 → `IN_TRANSIT`

---

### 3.2 到货确认

**POST** `/waybills/{id}/arrive`

```json
{
  "arriveTime": "2026-03-02T09:30:00",
  "isException": false,
  "exceptionType": null,
  "exceptionDesc": null
}
```

**业务效果**: 运单状态 → `ARRIVED`

---

### 3.3 签收登记

**POST** `/waybills/{id}/sign`

```json
{
  "signType": "NORMAL",
  "signerName": "王五",
  "signTime": "2026-03-02T14:00:00",
  "remark": ""
}
```

**业务效果**: 运单状态 → `SIGNED`

---

### 3.4 异常登记

**POST** `/waybills/{id}/exception`

```json
{
  "exceptionType": "DAMAGE",
  "exceptionDesc": "外包装破损，货物完好",
  "responsibleParty": "TRANSPORT",
  "handleMethod": "COMPENSATION",
  "images": ["url1", "url2"]
}
```

---

## 4. 财务接口

### 4.1 获取应收账款列表

**GET** `/finance/receivables`

**Query Parameters**: `page`, `pageSize`, `status`, `dateFrom`, `dateTo`, `customerId`

**Response (200 OK)**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 2001,
        "waybillNo": "YT202603010001",
        "amount": 500.00,
        "receivedAmount": 500.00,
        "unpaidAmount": 0.00,
        "paymentMethod": "PAYMENT_NOW",
        "status": "SETTLED"
      }
    ],
    "total": 50,
    "totalAmount": 25000.00,
    "receivedAmount": 20000.00,
    "unpaidAmount": 5000.00
  }
}
```

### 4.2 核销收款

**POST** `/finance/receivables/{id}/settle`

```json
{
  "settleAmount": 500.00,
  "settleMethod": "CASH",
  "settleTime": "2026-03-01T10:30:00",
  "remark": ""
}
```

### 4.3 代收货款管理

#### 4.3.1 查询代收货款列表

**GET** `/finance/cod`

**Query Parameters**: `page`, `pageSize`, `status`, `dateFrom`, `dateTo`

#### 4.3.2 转付代收货款

**POST** `/finance/cod/{id}/transfer`

```json
{
  "transferAmount": 1000.00,
  "transferMethod": "BANK_TRANSFER",
  "transferTime": "2026-03-02T10:00:00",
  "bankAccount": "6222xxxxxxxxxxxx",
  "remark": ""
}
```

### 4.4 月结对账

#### 4.4.1 生成月结账单

**POST** `/finance/monthly-bills`

```json
{
  "customerId": 101,
  "year": 2026,
  "month": 3
}
```

#### 4.4.2 查询月结账单列表

**GET** `/finance/monthly-bills`

**Query Parameters**: `page`, `pageSize`, `customerId`, `year`, `month`, `status`

---

## 5. 基础数据接口

### 5.1 网点管理

| 接口 | Method | Path | 说明 |
|---|---|---|---|
| 网点列表 | GET | `/orgs` | 支持分页和关键字搜索 |
| 网点详情 | GET | `/orgs/{id}` | |
| 创建网点 | POST | `/orgs` | |
| 修改网点 | PUT | `/orgs/{id}` | |
| 删除网点 | DELETE | `/orgs/{id}` | 有关联数据时不可删除 |
| 启用/禁用 | PATCH | `/orgs/{id}/status` | `{"status": true/false}` |

**网点对象结构**:
```json
{
  "id": 1,
  "code": "GZ001",
  "name": "广州分拨中心",
  "type": "DISTRIBUTION_CENTER",
  "city": "广州",
  "address": "广东省广州市白云区...",
  "contactName": "张经理",
  "contactPhone": "13800138000",
  "status": true
}
```

### 5.2 线路管理

| 接口 | Method | Path |
|---|---|---|
| 线路列表 | GET | `/routes` |
| 线路详情 | GET | `/routes/{id}` |
| 创建线路 | POST | `/routes` |
| 修改线路 | PUT | `/routes/{id}` |
| 删除线路 | DELETE | `/routes/{id}` |

### 5.3 车辆管理

| 接口 | Method | Path |
|---|---|---|
| 车辆列表 | GET | `/vehicles` |
| 车辆详情 | GET | `/vehicles/{id}` |
| 创建车辆 | POST | `/vehicles` |
| 修改车辆 | PUT | `/vehicles/{id}` |
| 删除车辆 | DELETE | `/vehicles/{id}` |

### 5.4 客户管理

| 接口 | Method | Path |
|---|---|---|
| 客户列表 | GET | `/customers` |
| 客户详情 | GET | `/customers/{id}` |
| 创建客户 | POST | `/customers` |
| 修改客户 | PUT | `/customers/{id}` |
| 删除客户 | DELETE | `/customers/{id}` |

---

## 6. 系统管理接口

### 6.1 用户管理

| 接口 | Method | Path |
|---|---|---|
| 用户列表 | GET | `/users` |
| 用户详情 | GET | `/users/{id}` |
| 创建用户 | POST | `/users` |
| 修改用户 | PUT | `/users/{id}` |
| 重置密码 | POST | `/users/{id}/reset-password` |
| 启用/禁用 | PATCH | `/users/{id}/status` |

---

## 7. 枚举值定义

### 7.1 运单状态 (WaybillStatus)

| 枚举值 | 显示名称 | 颜色建议 |
|---|---|---|
| `PENDING` | 待调度 | 橙色 `#F59E0B` |
| `IN_TRANSIT` | 运输中 | 蓝色 `#3B82F6` |
| `ARRIVED` | 已到货 | 紫色 `#8B5CF6` |
| `DELIVERING` | 派送中 | 青色 `#06B6D4` |
| `SIGNED` | 已签收 | 绿色 `#10B981` |
| `EXCEPTION` | 异常 | 红色 `#EF4444` |
| `REJECTED` | 已拒收 | 深红 `#DC2626` |
| `CANCELLED` | 已作废 | 灰色 `#6B7280` |

### 7.2 包装类型 (PackingType)

| 枚举值 | 显示名称 |
|---|---|
| `CARTON` | 纸箱 |
| `WOODEN_BOX` | 木箱 |
| `WOVEN_BAG` | 编织袋 |
| `BARE` | 裸装 |
| `PALLET` | 托盘 |
| `OTHER` | 其他 |

### 7.3 付款方式 (PaymentMethod)

| 枚举值 | 显示名称 |
|---|---|
| `PAYMENT_NOW` | 现付 |
| `PAYMENT_FETCH` | 提付 |
| `PAYMENT_RECEIPT` | 回单付 |
| `PAYMENT_MONTHLY` | 月结 |
| `PAYMENT_COD_DEDUCT` | 货款扣 |

### 7.4 签收类型 (SignType)

| 枚举值 | 显示名称 |
|---|---|
| `NORMAL` | 正常签收 |
| `EXCEPTION` | 异常签收 |
| `REJECTED` | 拒收 |

### 7.5 异常类型 (ExceptionType)

| 枚举值 | 显示名称 |
|---|---|
| `DAMAGE` | 货物破损 |
| `SHORT` | 货物短少 |
| `DELAY` | 运输延误 |
| `LOST` | 货物丢失 |
| `OTHER` | 其他 |

### 7.6 网点类型 (OrgType)

| 枚举值 | 显示名称 |
|---|---|
| `HEADQUARTERS` | 总部 |
| `DISTRIBUTION_CENTER` | 分拨中心 |
| `BRANCH` | 网点 |
| `AGENT` | 代理点 |

### 7.7 统一响应格式

所有接口均遵循以下响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**错误码说明**:

| 错误码 | 说明 |
|---|---|
| `200` | 成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `401` | 未认证（Token无效或过期） |
| `403` | 无权限 |
| `404` | 资源不存在 |
| `409` | 业务冲突（如运单状态不允许该操作） |
| `500` | 服务器内部错误 |

---

*文档结束*
