-- ============================================================
-- 云途物流 SaaS 管理平台 - 数据库初始化脚本 v3.0
-- 参照蓝桥广达T9系统业务逻辑优化
-- 数据库：MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS logistics_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logistics_db;

-- -----------------------------------------------------------
-- 1. 组织机构/网点表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_organization (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '网点名称',
    type ENUM('总部','分拨中心','落点','营业部') NOT NULL DEFAULT '分拨中心' COMMENT '网点类型',
    parent_id BIGINT DEFAULT NULL COMMENT '上级网点ID',
    address VARCHAR(255) DEFAULT '' COMMENT '地址',
    contact_name VARCHAR(50) DEFAULT '' COMMENT '联系人',
    contact_phone VARCHAR(20) DEFAULT '' COMMENT '联系电话',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用 0-停用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent_id (parent_id),
    INDEX idx_type (type)
) ENGINE=InnoDB COMMENT='组织机构/网点表';

-- -----------------------------------------------------------
-- 2. 用户表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    full_name VARCHAR(50) NOT NULL COMMENT '姓名',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    role VARCHAR(20) NOT NULL DEFAULT 'operator' COMMENT '角色：admin/operator/finance/driver',
    org_id BIGINT NOT NULL COMMENT '所属网点ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_id (org_id),
    INDEX idx_username (username)
) ENGINE=InnoDB COMMENT='用户表';

-- -----------------------------------------------------------
-- 3. 客户表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_customer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '客户名称',
    phone VARCHAR(20) DEFAULT '' COMMENT '联系电话',
    address VARCHAR(255) DEFAULT '' COMMENT '地址',
    contact_person VARCHAR(50) DEFAULT '' COMMENT '联系人',
    type ENUM('发货客户','收货客户','双向客户') NOT NULL DEFAULT '发货客户' COMMENT '客户类型',
    monthly_account TINYINT DEFAULT 0 COMMENT '是否月结客户：1-是 0-否',
    credit_limit DECIMAL(12,2) DEFAULT 0 COMMENT '月结额度(元)',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常 0-停用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB COMMENT='客户表';

-- -----------------------------------------------------------
-- 4. 线路表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_route (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '线路名称',
    start_org_id BIGINT NOT NULL COMMENT '始发网点ID',
    end_org_id BIGINT NOT NULL COMMENT '到达网点ID',
    distance DECIMAL(10,1) DEFAULT 0 COMMENT '里程(km)',
    estimated_hours DECIMAL(5,1) DEFAULT 0 COMMENT '预计时效(h)',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用 0-停用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_start_org (start_org_id),
    INDEX idx_end_org (end_org_id)
) ENGINE=InnoDB COMMENT='线路表';

-- -----------------------------------------------------------
-- 5. 车辆表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_vehicle (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plate_no VARCHAR(20) NOT NULL UNIQUE COMMENT '车牌号',
    type VARCHAR(20) NOT NULL DEFAULT '9.6米' COMMENT '车型',
    max_weight DECIMAL(10,1) DEFAULT 0 COMMENT '最大载重(kg)',
    max_volume DECIMAL(10,1) DEFAULT 0 COMMENT '最大容积(m³)',
    driver_name VARCHAR(50) DEFAULT '' COMMENT '司机姓名',
    driver_phone VARCHAR(20) DEFAULT '' COMMENT '司机电话',
    status ENUM('空闲','运输中','维修中','停用') NOT NULL DEFAULT '空闲' COMMENT '车辆状态',
    current_org_id BIGINT DEFAULT NULL COMMENT '当前所在网点ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_current_org (current_org_id)
) ENGINE=InnoDB COMMENT='车辆表';

-- -----------------------------------------------------------
-- 6. 运单表（核心业务表 - 参照T9扩展）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_waybill (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_no VARCHAR(30) NOT NULL UNIQUE COMMENT '运单号',
    
    -- 发货信息
    sender_customer_id BIGINT DEFAULT NULL COMMENT '发货客户ID',
    sender_name VARCHAR(100) NOT NULL COMMENT '发货方名称',
    sender_phone VARCHAR(20) DEFAULT '' COMMENT '发货方电话',
    sender_address VARCHAR(255) DEFAULT '' COMMENT '发货地址',
    
    -- 收货信息
    receiver_name VARCHAR(100) NOT NULL COMMENT '收货人',
    receiver_phone VARCHAR(20) DEFAULT '' COMMENT '收货人电话',
    receiver_address VARCHAR(255) DEFAULT '' COMMENT '收货地址',
    
    -- 站点信息（参照T9：发站/中转地/到站）
    origin_org_id BIGINT DEFAULT NULL COMMENT '发站网点ID',
    origin_org_name VARCHAR(100) DEFAULT '' COMMENT '发站名称',
    transit_org_id BIGINT DEFAULT NULL COMMENT '中转地网点ID',
    transit_org_name VARCHAR(100) DEFAULT '' COMMENT '中转地名称',
    dest_org_id BIGINT DEFAULT NULL COMMENT '到站网点ID',
    dest_org_name VARCHAR(100) DEFAULT '' COMMENT '到站名称',
    
    -- 货物信息
    goods_name VARCHAR(100) NOT NULL COMMENT '货物名称/品名',
    packing_type VARCHAR(20) DEFAULT '纸箱' COMMENT '包装类型：纸箱/木箱/编织袋/裸装/托盘/其他',
    quantity INT DEFAULT 1 COMMENT '件数',
    weight DECIMAL(10,2) DEFAULT 0 COMMENT '重量(kg)',
    volume DECIMAL(10,2) DEFAULT 0 COMMENT '体积(m³)',
    
    -- 费用信息（参照T9：多种付款方式 + 运费明细）
    payment_method VARCHAR(10) DEFAULT '现付' COMMENT '付款方式：现付/提付/回单付/月结/货款扣',
    freight_fee DECIMAL(10,2) DEFAULT 0 COMMENT '运费合计(元)',
    base_freight DECIMAL(10,2) DEFAULT 0 COMMENT '基本运费(元)',
    insurance_fee DECIMAL(10,2) DEFAULT 0 COMMENT '保险费(元)',
    pickup_fee DECIMAL(10,2) DEFAULT 0 COMMENT '接货费/提货费(元)',
    delivery_fee DECIMAL(10,2) DEFAULT 0 COMMENT '送货费(元)',
    packing_fee DECIMAL(10,2) DEFAULT 0 COMMENT '包装费(元)',
    other_fee DECIMAL(10,2) DEFAULT 0 COMMENT '其他费用(元)',
    
    -- 代收货款（参照T9）
    cod_amount DECIMAL(10,2) DEFAULT 0 COMMENT '代收货款金额(元)',
    cod_status VARCHAR(10) DEFAULT '无' COMMENT '代收货款状态：无/待收/已收/已退',
    
    -- 回单要求
    receipt_required TINYINT DEFAULT 1 COMMENT '是否需要回单：1-需要 0-不需要',
    receipt_count INT DEFAULT 1 COMMENT '回单份数',
    
    -- 交接方式
    delivery_method VARCHAR(20) DEFAULT '自提' COMMENT '交接方式：自提/送货上门/代理中转',
    
    -- 状态信息
    status VARCHAR(10) DEFAULT '待调度' COMMENT '运单状态：待调度/已调度/运输中/已到货/派送中/已签收/异常/已取消',
    receipt_status VARCHAR(10) DEFAULT '待签收' COMMENT '回单状态：待签收/已签收/已寄出/已收到/已返厂/无需回单',
    
    -- 位置与操作信息
    current_org_id BIGINT DEFAULT NULL COMMENT '当前所在网点ID',
    current_org_name VARCHAR(100) DEFAULT '' COMMENT '当前所在网点名称',
    transport_task_id BIGINT DEFAULT NULL COMMENT '关联运输任务ID',
    creator_id BIGINT DEFAULT NULL COMMENT '创建人ID',
    creator_name VARCHAR(50) DEFAULT '' COMMENT '创建人姓名',
    
    -- 签收信息
    signed_at DATETIME DEFAULT NULL COMMENT '签收时间',
    signer_name VARCHAR(50) DEFAULT '' COMMENT '签收人',
    sign_remark VARCHAR(255) DEFAULT '' COMMENT '签收备注',
    
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_waybill_no (waybill_no),
    INDEX idx_status (status),
    INDEX idx_receipt_status (receipt_status),
    INDEX idx_sender_customer_id (sender_customer_id),
    INDEX idx_transport_task_id (transport_task_id),
    INDEX idx_created_at (created_at),
    INDEX idx_current_org_id (current_org_id),
    INDEX idx_origin_org_id (origin_org_id),
    INDEX idx_dest_org_id (dest_org_id),
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB COMMENT='运单表';

-- -----------------------------------------------------------
-- 7. 运单状态日志表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_waybill_status_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_id BIGINT NOT NULL COMMENT '运单ID',
    status VARCHAR(10) NOT NULL COMMENT '状态',
    description VARCHAR(255) DEFAULT '' COMMENT '描述',
    operator_id BIGINT DEFAULT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) DEFAULT '' COMMENT '操作人姓名',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waybill_id (waybill_id)
) ENGINE=InnoDB COMMENT='运单状态日志表';

-- -----------------------------------------------------------
-- 8. 运输任务表（增加配载信息）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_transport_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_no VARCHAR(30) NOT NULL UNIQUE COMMENT '任务编号',
    route_id BIGINT NOT NULL COMMENT '线路ID',
    vehicle_id BIGINT NOT NULL COMMENT '车辆ID',
    start_org_id BIGINT NOT NULL COMMENT '始发网点ID',
    end_org_id BIGINT NOT NULL COMMENT '到达网点ID',
    waybill_count INT NOT NULL DEFAULT 0 COMMENT '运单数量',
    total_weight DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总重量(kg)',
    total_volume DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总体积(m³)',
    total_quantity INT NOT NULL DEFAULT 0 COMMENT '总件数',
    load_rate DECIMAL(5,2) DEFAULT 0 COMMENT '装载率(%)',
    status ENUM('待装车','装车中','已发车','运输中','已到达','已完成','异常') NOT NULL DEFAULT '待装车' COMMENT '任务状态',
    creator_id BIGINT DEFAULT NULL COMMENT '创建人ID',
    creator_name VARCHAR(50) DEFAULT '' COMMENT '创建人姓名',
    departed_at DATETIME DEFAULT NULL COMMENT '发车时间',
    arrived_at DATETIME DEFAULT NULL COMMENT '到达时间',
    seal_no VARCHAR(50) DEFAULT '' COMMENT '封签号',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_task_no (task_no),
    INDEX idx_status (status),
    INDEX idx_route (route_id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='运输任务表';

-- -----------------------------------------------------------
-- 9. 运输任务-运单关联表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_transport_waybill (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transport_task_id BIGINT NOT NULL COMMENT '运输任务ID',
    waybill_id BIGINT NOT NULL COMMENT '运单ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_task_waybill (transport_task_id, waybill_id),
    INDEX idx_waybill_id (waybill_id)
) ENGINE=InnoDB COMMENT='运输任务-运单关联表';

-- -----------------------------------------------------------
-- 10. 库存表（区分发货库存和到货库存）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_inventory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_id BIGINT NOT NULL COMMENT '运单ID',
    inventory_type ENUM('发货库存','到货库存') NOT NULL DEFAULT '发货库存' COMMENT '库存类型：发货库存/到货库存',
    goods_name VARCHAR(100) NOT NULL COMMENT '货物名称',
    quantity INT NOT NULL DEFAULT 1 COMMENT '件数',
    weight DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '重量(kg)',
    volume DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '体积(m³)',
    org_id BIGINT NOT NULL COMMENT '所在网点ID',
    receiver_name VARCHAR(100) DEFAULT '' COMMENT '收货人',
    receiver_phone VARCHAR(20) DEFAULT '' COMMENT '收货人电话',
    receiver_address VARCHAR(255) DEFAULT '' COMMENT '收货地址',
    status ENUM('待出库','已出库','异常') NOT NULL DEFAULT '待出库' COMMENT '库存状态',
    transport_task_id BIGINT DEFAULT NULL COMMENT '入库关联运输任务ID',
    inbound_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
    outbound_at DATETIME DEFAULT NULL COMMENT '出库时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_waybill_id (waybill_id),
    INDEX idx_org_id (org_id),
    INDEX idx_status (status),
    INDEX idx_inventory_type (inventory_type)
) ENGINE=InnoDB COMMENT='库存表';

-- -----------------------------------------------------------
-- 11. 签收记录表（参照T9签收登记模块）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_sign_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_id BIGINT NOT NULL COMMENT '运单ID',
    waybill_no VARCHAR(30) NOT NULL COMMENT '运单号',
    sign_type ENUM('本人签收','代签','拒签','部分签收') NOT NULL DEFAULT '本人签收' COMMENT '签收类型',
    signer_name VARCHAR(50) NOT NULL COMMENT '签收人姓名',
    signer_phone VARCHAR(20) DEFAULT '' COMMENT '签收人电话',
    sign_quantity INT DEFAULT 0 COMMENT '签收件数',
    damage_quantity INT DEFAULT 0 COMMENT '破损件数',
    shortage_quantity INT DEFAULT 0 COMMENT '短少件数',
    sign_remark VARCHAR(500) DEFAULT '' COMMENT '签收备注',
    delivery_method VARCHAR(20) DEFAULT '自提' COMMENT '交接方式：自提/送货上门/代理中转',
    org_id BIGINT DEFAULT NULL COMMENT '签收网点ID',
    org_name VARCHAR(100) DEFAULT '' COMMENT '签收网点名称',
    operator_id BIGINT DEFAULT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) DEFAULT '' COMMENT '操作人姓名',
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '签收时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waybill_id (waybill_id),
    INDEX idx_signed_at (signed_at),
    INDEX idx_org_id (org_id)
) ENGINE=InnoDB COMMENT='签收记录表';

-- -----------------------------------------------------------
-- 12. 异常登记表（参照T9异常登记模块）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_exception_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_id BIGINT DEFAULT NULL COMMENT '关联运单ID',
    waybill_no VARCHAR(30) DEFAULT '' COMMENT '关联运单号',
    exception_type ENUM('货损','货差','延误','丢失','错发','客户投诉','其他') NOT NULL COMMENT '异常类型',
    severity ENUM('轻微','一般','严重') NOT NULL DEFAULT '一般' COMMENT '严重程度',
    description VARCHAR(500) NOT NULL COMMENT '异常描述',
    handle_status ENUM('待处理','处理中','已处理','已关闭') NOT NULL DEFAULT '待处理' COMMENT '处理状态',
    handle_result VARCHAR(500) DEFAULT '' COMMENT '处理结果',
    handle_amount DECIMAL(10,2) DEFAULT 0 COMMENT '理赔金额(元)',
    org_id BIGINT DEFAULT NULL COMMENT '登记网点ID',
    org_name VARCHAR(100) DEFAULT '' COMMENT '登记网点名称',
    reporter_id BIGINT DEFAULT NULL COMMENT '登记人ID',
    reporter_name VARCHAR(50) DEFAULT '' COMMENT '登记人姓名',
    handler_id BIGINT DEFAULT NULL COMMENT '处理人ID',
    handler_name VARCHAR(50) DEFAULT '' COMMENT '处理人姓名',
    handled_at DATETIME DEFAULT NULL COMMENT '处理时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_waybill_id (waybill_id),
    INDEX idx_exception_type (exception_type),
    INDEX idx_handle_status (handle_status),
    INDEX idx_org_id (org_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='异常登记表';

-- -----------------------------------------------------------
-- 13. 回单记录表（参照T9回单生命周期）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_receipt_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_id BIGINT NOT NULL COMMENT '运单ID',
    waybill_no VARCHAR(30) NOT NULL COMMENT '运单号',
    action ENUM('签收','寄出','收到','返厂','反签收','反寄出','反收回','取消返厂') NOT NULL COMMENT '回单操作',
    receipt_count INT DEFAULT 1 COMMENT '回单份数',
    express_no VARCHAR(50) DEFAULT '' COMMENT '快递单号（寄出时填写）',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    operator_id BIGINT DEFAULT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) DEFAULT '' COMMENT '操作人姓名',
    org_id BIGINT DEFAULT NULL COMMENT '操作网点ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waybill_id (waybill_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='回单记录表';

-- -----------------------------------------------------------
-- 14. 财务流水表（增强代收货款）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_finance_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    waybill_id BIGINT NOT NULL COMMENT '运单ID',
    waybill_no VARCHAR(30) NOT NULL COMMENT '运单号',
    type ENUM('应收','应付','代收货款') NOT NULL COMMENT '财务类型',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '金额(元)',
    payment_method VARCHAR(10) DEFAULT '现付' COMMENT '付款方式',
    status ENUM('待结算','已结算','已核销','已取消') NOT NULL DEFAULT '待结算' COMMENT '结算状态',
    customer_name VARCHAR(100) DEFAULT '' COMMENT '客户名称',
    org_id BIGINT DEFAULT NULL COMMENT '所属网点ID',
    org_name VARCHAR(100) DEFAULT '' COMMENT '所属网点名称',
    remark VARCHAR(500) DEFAULT '' COMMENT '备注',
    settled_at DATETIME DEFAULT NULL COMMENT '结算时间',
    verified_at DATETIME DEFAULT NULL COMMENT '核销时间',
    creator_id BIGINT DEFAULT NULL COMMENT '创建人ID',
    creator_name VARCHAR(50) DEFAULT '' COMMENT '创建人姓名',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_waybill_id (waybill_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_org_id (org_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='财务流水表';

-- -----------------------------------------------------------
-- 15. 操作日志表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_operation_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    module VARCHAR(50) NOT NULL COMMENT '操作模块',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    description VARCHAR(500) DEFAULT '' COMMENT '操作描述',
    target_id BIGINT DEFAULT NULL COMMENT '操作对象ID',
    target_type VARCHAR(50) DEFAULT '' COMMENT '操作对象类型',
    operator_id BIGINT DEFAULT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) DEFAULT '' COMMENT '操作人姓名',
    ip_address VARCHAR(50) DEFAULT '' COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_module (module),
    INDEX idx_operator_id (operator_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='操作日志表';

-- -----------------------------------------------------------
-- 16. 预警记录表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS biz_alert (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL COMMENT '预警类型',
    level ENUM('低','中','高') NOT NULL DEFAULT '中' COMMENT '预警级别',
    title VARCHAR(200) NOT NULL COMMENT '预警标题',
    content VARCHAR(500) DEFAULT '' COMMENT '预警内容',
    target_id BIGINT DEFAULT NULL COMMENT '关联对象ID',
    target_type VARCHAR(50) DEFAULT '' COMMENT '关联对象类型(waybill/inventory/finance)',
    org_id BIGINT DEFAULT NULL COMMENT '所属网点ID',
    status ENUM('未处理','已处理','已忽略') NOT NULL DEFAULT '未处理' COMMENT '处理状态',
    handler_id BIGINT DEFAULT NULL COMMENT '处理人ID',
    handler_name VARCHAR(50) DEFAULT '' COMMENT '处理人姓名',
    handled_at DATETIME DEFAULT NULL COMMENT '处理时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_org_id (org_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='预警记录表';

-- ============================================================
-- 初始数据
-- ============================================================

-- 组织机构/网点
INSERT INTO sys_organization (id, name, type, parent_id, address, contact_name, contact_phone) VALUES
(1, '云途物流总部', '总部', NULL, '广东省广州市天河区天河路385号', '王总', '020-88880001'),
(2, '广州分拨中心', '分拨中心', 1, '广东省广州市白云区太和镇物流园A区', '陈经理', '020-88880002'),
(3, '深圳分拨中心', '分拨中心', 1, '广东省深圳市宝安区福永街道物流园', '刘经理', '0755-26880003'),
(4, '上海分拨中心', '分拨中心', 1, '上海市嘉定区安亭镇物流园B区', '赵经理', '021-62880004'),
(5, '北京分拨中心', '分拨中心', 1, '北京市大兴区亦庄经济开发区物流园', '孙经理', '010-65880005'),
(6, '成都分拨中心', '分拨中心', 1, '四川省成都市龙泉驿区物流大道88号', '周经理', '028-85880006'),
(7, '广州天河营业部', '营业部', 2, '广东省广州市天河区体育西路', '吴经理', '020-88880007'),
(8, '上海浦东营业部', '营业部', 4, '上海市浦东新区张江高科技园区', '郑经理', '021-62880008');

-- 用户（密码均为 BCrypt 加密的 "123456"）
INSERT INTO sys_user (id, username, password, full_name, role, org_id) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '系统管理员', 'admin', 1),
(2, 'operator1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张伟', 'operator', 2),
(3, 'finance1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李芳', 'finance', 1),
(4, 'driver1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '刘师傅', 'driver', 2),
(5, 'operator2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '王芳', 'operator', 3);

-- 客户
INSERT INTO biz_customer (id, name, phone, address, contact_person, type, monthly_account, credit_limit) VALUES
(1, '华南电子科技有限公司', '020-88881234', '广东省广州市番禺区大石镇工业园', '张经理', '发货客户', 0, 0),
(2, '深圳创新科技有限公司', '0755-26881234', '广东省深圳市南山区科技园南区', '李经理', '双向客户', 1, 50000),
(3, '上海贸易有限公司', '021-62881234', '上海市浦东新区张江高科技园区', '王经理', '发货客户', 0, 0),
(4, '北京信达商贸有限公司', '010-65881234', '北京市朝阳区望京SOHO', '赵经理', '双向客户', 1, 100000),
(5, '成都天府食品有限公司', '028-85881234', '四川省成都市高新区天府大道', '孙经理', '发货客户', 0, 0);

-- 线路
INSERT INTO biz_route (id, name, start_org_id, end_org_id, distance, estimated_hours) VALUES
(1, '广州→上海专线', 2, 4, 1462, 18),
(2, '广州→北京专线', 2, 5, 2122, 24),
(3, '深圳→北京专线', 3, 5, 2175, 25),
(4, '上海→成都专线', 4, 6, 1920, 22),
(5, '北京→广州专线', 5, 2, 2122, 24),
(6, '成都→深圳专线', 6, 3, 1690, 20);

-- 车辆
INSERT INTO biz_vehicle (id, plate_no, type, max_weight, max_volume, driver_name, driver_phone, status, current_org_id) VALUES
(1, '粤A12345', '9.6米', 10000, 55, '刘师傅', '13800001001', '运输中', 2),
(2, '粤B67890', '13米', 15000, 75, '王师傅', '13800001002', '空闲', 3),
(3, '沪A11111', '9.6米', 10000, 55, '赵师傅', '13800001003', '空闲', 4),
(4, '京B22222', '6.8米', 5000, 35, '孙师傅', '13800001004', '空闲', 5),
(5, '川A33333', '13米', 15000, 75, '钱师傅', '13800001005', '空闲', 6);

-- 运单种子数据（含新增字段）
INSERT INTO biz_waybill (id, waybill_no, sender_customer_id, sender_name, sender_phone, sender_address,
    receiver_name, receiver_phone, receiver_address,
    origin_org_id, origin_org_name, dest_org_id, dest_org_name,
    goods_name, packing_type, quantity, weight, volume,
    payment_method, freight_fee, base_freight, insurance_fee, pickup_fee, delivery_fee,
    cod_amount, cod_status, receipt_required, delivery_method,
    status, receipt_status, current_org_id, current_org_name, creator_id, creator_name) VALUES
(1, 'YT20260210001', 1, '华南电子科技有限公司', '020-88881234', '广东省广州市番禺区大石镇工业园',
   '张三', '13700137001', '上海市浦东新区张江高科技园区',
   2, '广州分拨中心', 4, '上海分拨中心',
   '电子元器件', '纸箱', 20, 150.50, 2.30,
   '现付', 1280.00, 1100.00, 80.00, 50.00, 50.00,
   0, '无', 1, '送货上门',
   '运输中', '待签收', 2, '广州分拨中心', 2, '张伟'),
(2, 'YT20260210002', 2, '深圳创新科技有限公司', '0755-26881234', '广东省深圳市南山区科技园南区',
   '李四', '13700137002', '北京市朝阳区望京SOHO',
   3, '深圳分拨中心', 5, '北京分拨中心',
   '精密仪器', '木箱', 5, 45.00, 0.80,
   '提付', 960.00, 860.00, 100.00, 0, 0,
   5000.00, '待收', 1, '自提',
   '待调度', '待签收', 3, '深圳分拨中心', 2, '张伟'),
(3, 'YT20260210003', 3, '上海贸易有限公司', '021-62881234', '上海市浦东新区张江高科技园区',
   '王五', '13700137003', '四川省成都市高新区天府大道100号',
   4, '上海分拨中心', 6, '成都分拨中心',
   '办公用品', '纸箱', 50, 80.00, 1.50,
   '现付', 650.00, 600.00, 0, 50.00, 0,
   0, '无', 1, '自提',
   '已到货', '待签收', 6, '成都分拨中心', 1, '系统管理员'),
(4, 'YT20260209001', 4, '北京信达商贸有限公司', '010-65881234', '北京市朝阳区望京SOHO',
   '赵六', '13600136004', '广东省广州市天河区体育西路',
   5, '北京分拨中心', 2, '广州分拨中心',
   '服装鞋帽', '编织袋', 100, 200.00, 6.00,
   '月结', 1500.00, 1400.00, 0, 0, 100.00,
   0, '无', 1, '送货上门',
   '已签收', '已寄出', 2, '广州分拨中心', 1, '系统管理员'),
(5, 'YT20260210004', 5, '成都天府食品有限公司', '028-85881234', '四川省成都市高新区天府大道',
   '钱七', '13500135005', '广东省深圳市宝安区福永街道',
   6, '成都分拨中心', 3, '深圳分拨中心',
   '食品原料', '纸箱', 30, 120.00, 3.20,
   '现付', 880.00, 800.00, 30.00, 50.00, 0,
   0, '无', 0, '自提',
   '已调度', '无需回单', 6, '成都分拨中心', 1, '系统管理员'),
(6, 'YT20260210005', 1, '华南电子科技有限公司', '020-88881234', '广东省广州市番禺区大石镇工业园',
   '孙八', '13400134006', '北京市大兴区亦庄经济开发区',
   2, '广州分拨中心', 5, '北京分拨中心',
   '电路板', '纸箱', 40, 95.00, 1.80,
   '回单付', 720.00, 680.00, 0, 40.00, 0,
   0, '无', 1, '自提',
   '待调度', '待签收', 2, '广州分拨中心', 2, '张伟'),
(7, 'YT20260210006', 2, '深圳创新科技有限公司', '0755-26881234', '广东省深圳市南山区科技园南区',
   '周九', '13300133007', '上海市嘉定区安亭镇物流园B区',
   3, '深圳分拨中心', 4, '上海分拨中心',
   '电子配件', '纸箱', 15, 35.00, 0.60,
   '货款扣', 450.00, 400.00, 0, 50.00, 0,
   3000.00, '待收', 1, '送货上门',
   '待调度', '待签收', 3, '深圳分拨中心', 5, '王芳');

-- 运单状态日志
INSERT INTO biz_waybill_status_log (waybill_id, status, description, operator_id, operator_name) VALUES
(1, '待调度', '运单创建成功', 2, '张伟'),
(1, '已调度', '已分配至广州→上海专线', 1, '系统管理员'),
(1, '运输中', '车辆已发出，车牌号：粤A12345', 2, '张伟'),
(2, '待调度', '运单创建成功', 2, '张伟'),
(3, '待调度', '运单创建成功', 1, '系统管理员'),
(3, '已调度', '已分配至上海→成都专线', 1, '系统管理员'),
(3, '运输中', '车辆已发出，车牌号：沪A11111', 2, '张伟'),
(3, '已到货', '车辆到达成都分拨中心，一键入库完成', 2, '张伟'),
(4, '待调度', '运单创建成功', 1, '系统管理员'),
(4, '运输中', '车辆已发出', 2, '张伟'),
(4, '已到货', '车辆到达广州分拨中心', 2, '张伟'),
(4, '派送中', '安排送货上门', 2, '张伟'),
(4, '已签收', '客户赵六已签收，本人签收', 2, '张伟'),
(5, '待调度', '运单创建成功', 1, '系统管理员'),
(5, '已调度', '已分配至成都→深圳专线', 1, '系统管理员'),
(6, '待调度', '运单创建成功', 2, '张伟'),
(7, '待调度', '运单创建成功', 5, '王芳');

-- 运输任务种子数据
INSERT INTO biz_transport_task (id, task_no, route_id, vehicle_id, start_org_id, end_org_id,
    waybill_count, total_weight, total_volume, total_quantity, load_rate, status, creator_id, creator_name, departed_at, arrived_at, seal_no) VALUES
(1, 'TK20260210001', 1, 1, 2, 4, 1, 150.50, 2.30, 20, 27.4, '运输中', 1, '系统管理员', '2026-02-10 09:15:00', NULL, 'SN20260210001'),
(2, 'TK20260209001', 4, 3, 4, 6, 1, 80.00, 1.50, 50, 14.5, '已到达', 1, '系统管理员', '2026-02-09 16:00:00', '2026-02-10 06:30:00', 'SN20260209001'),
(3, 'TK20260210002', 6, 5, 6, 3, 1, 120.00, 3.20, 30, 16.0, '待装车', 1, '系统管理员', NULL, NULL, '');

-- 运输任务-运单关联
INSERT INTO biz_transport_waybill (transport_task_id, waybill_id) VALUES
(1, 1), (2, 3), (3, 5);

-- 库存种子数据（区分发货库存和到货库存）
INSERT INTO biz_inventory (id, waybill_id, inventory_type, goods_name, quantity, weight, volume, org_id,
    receiver_name, receiver_phone, receiver_address, status, transport_task_id, inbound_at, outbound_at) VALUES
(1, 3, '到货库存', '办公用品', 50, 80.00, 1.50, 6, '王五', '13700137003', '四川省成都市高新区天府大道100号', '待出库', 2, '2026-02-10 06:30:00', NULL),
(2, 4, '到货库存', '服装鞋帽', 100, 200.00, 6.00, 2, '赵六', '13600136004', '广东省广州市天河区体育西路', '已出库', 0, '2026-02-09 22:00:00', '2026-02-10 08:00:00'),
(3, 2, '发货库存', '精密仪器', 5, 45.00, 0.80, 3, '李四', '13700137002', '北京市朝阳区望京SOHO', '待出库', NULL, '2026-02-10 10:00:00', NULL),
(4, 7, '发货库存', '电子配件', 15, 35.00, 0.60, 3, '周九', '13300133007', '上海市嘉定区安亭镇物流园B区', '待出库', NULL, '2026-02-10 11:00:00', NULL);

-- 签收记录种子数据
INSERT INTO biz_sign_record (waybill_id, waybill_no, sign_type, signer_name, signer_phone, sign_quantity, damage_quantity, shortage_quantity, sign_remark, delivery_method, org_id, org_name, operator_id, operator_name) VALUES
(4, 'YT20260209001', '本人签收', '赵六', '13600136004', 100, 0, 0, '货物完好', '送货上门', 2, '广州分拨中心', 2, '张伟');

-- 回单记录种子数据
INSERT INTO biz_receipt_record (waybill_id, waybill_no, action, receipt_count, express_no, remark, operator_id, operator_name, org_id) VALUES
(4, 'YT20260209001', '签收', 1, '', '收货方已签收回单', 2, '张伟', 2),
(4, 'YT20260209001', '寄出', 1, 'SF1234567890', '已通过顺丰寄出回单', 2, '张伟', 2);

-- 异常登记种子数据
INSERT INTO biz_exception_record (waybill_id, waybill_no, exception_type, severity, description, handle_status, org_id, org_name, reporter_id, reporter_name) VALUES
(1, 'YT20260210001', '延误', '一般', '因天气原因，广州→上海专线预计延误4小时', '处理中', 2, '广州分拨中心', 2, '张伟');

-- 财务流水种子数据
INSERT INTO biz_finance_record (waybill_id, waybill_no, type, amount, payment_method, status, customer_name, org_id, org_name, creator_id, creator_name) VALUES
(1, 'YT20260210001', '应收', 1280.00, '现付', '已结算', '华南电子科技有限公司', 2, '广州分拨中心', 2, '张伟'),
(2, 'YT20260210002', '应收', 960.00, '提付', '待结算', '深圳创新科技有限公司', 3, '深圳分拨中心', 2, '张伟'),
(2, 'YT20260210002', '代收货款', 5000.00, '提付', '待结算', '深圳创新科技有限公司', 3, '深圳分拨中心', 2, '张伟'),
(3, 'YT20260210003', '应收', 650.00, '现付', '已结算', '上海贸易有限公司', 6, '成都分拨中心', 1, '系统管理员'),
(4, 'YT20260209001', '应收', 1500.00, '月结', '已核销', '北京信达商贸有限公司', 2, '广州分拨中心', 1, '系统管理员'),
(5, 'YT20260210004', '应收', 880.00, '现付', '待结算', '成都天府食品有限公司', 6, '成都分拨中心', 1, '系统管理员'),
(6, 'YT20260210005', '应收', 720.00, '回单付', '待结算', '华南电子科技有限公司', 2, '广州分拨中心', 2, '张伟'),
(7, 'YT20260210006', '应收', 450.00, '货款扣', '待结算', '深圳创新科技有限公司', 3, '深圳分拨中心', 5, '王芳'),
(7, 'YT20260210006', '代收货款', 3000.00, '货款扣', '待结算', '深圳创新科技有限公司', 3, '深圳分拨中心', 5, '王芳');

-- 预警种子数据
INSERT INTO biz_alert (type, level, title, content, target_id, target_type, org_id, status) VALUES
('库存超期预警', '中', '库存超期：办公用品', '运单YT20260210003关联货物在成都分拨中心库存超过48小时', 1, 'inventory', 6, '未处理'),
('运输延误预警', '高', '运输延误：YT20260210001', '广州→上海专线运输任务TK20260210001因天气延误', 1, 'waybill', 2, '未处理'),
('代收货款预警', '高', '代收货款待收：YT20260210002', '运单YT20260210002代收货款¥5000.00待收取', 2, 'finance', 3, '未处理'),
('回单超期预警', '中', '回单超期：YT20260210001', '运单YT20260210001已运输但回单未签收', 1, 'waybill', 2, '未处理');

-- 操作日志种子数据
INSERT INTO sys_operation_log (module, action, description, target_id, target_type, operator_id, operator_name) VALUES
('运单管理', '创建', '创建运单 YT20260210001', 1, 'waybill', 2, '张伟'),
('运单管理', '创建', '创建运单 YT20260210002', 2, 'waybill', 2, '张伟'),
('运输任务', '创建', '创建运输任务 TK20260210001', 1, 'transport_task', 1, '系统管理员'),
('运输任务', '发车', '运输任务 TK20260210001 发车确认', 1, 'transport_task', 2, '张伟'),
('运输任务', '到达', '运输任务 TK20260209001 到达入库', 2, 'transport_task', 2, '张伟'),
('签收管理', '签收', '运单 YT20260209001 客户赵六签收', 4, 'waybill', 2, '张伟'),
('回单管理', '寄出', '运单 YT20260209001 回单已寄出', 4, 'waybill', 2, '张伟'),
('异常管理', '登记', '运单 YT20260210001 登记延误异常', 1, 'exception', 2, '张伟'),
('库存管理', '出库', '库存 ID:2 确认出库', 2, 'inventory', 2, '张伟'),
('财务管理', '结算', '财务记录 ID:1 确认结算', 1, 'finance', 3, '李芳'),
('财务管理', '核销', '财务记录 ID:5 确认核销', 5, 'finance', 3, '李芳'),
('用户管理', '登录', '用户 admin 登录系统', 1, 'user', 1, '系统管理员');
