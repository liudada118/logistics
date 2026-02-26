// ============================================================
// 设计风格：工业极简主义 (Industrial Minimalism)
// 数据层：模拟后端 API 数据，后续可替换为真实 API 调用
// ============================================================

// ==================== 用户与组织 ====================
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'admin' | 'operator' | 'finance';
  orgId: number;
  orgName: string;
}

export interface Organization {
  id: number;
  name: string;
  type: '总部' | '分拨中心' | '落点' | '营业部';
  parentId: number | null;
  address: string;
  contactName: string;
  contactPhone: string;
  status: '启用' | '停用';
}

// ==================== 客户 ====================
export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  type: '发货客户' | '收货客户' | '双向客户';
  status: '正常' | '停用';
  createdAt: string;
}

// ==================== 线路 ====================
export interface Route {
  id: number;
  name: string;
  startOrgId: number;
  startOrgName: string;
  endOrgId: number;
  endOrgName: string;
  distance: number;
  estimatedHours: number;
  status: '启用' | '停用';
}

// ==================== 车辆 ====================
export type VehicleStatus = '空闲' | '运输中' | '维修中' | '停用';
export interface Vehicle {
  id: number;
  plateNo: string;
  type: '4.2米' | '6.8米' | '9.6米' | '13米' | '17.5米';
  maxWeight: number;
  maxVolume: number;
  driverName: string;
  driverPhone: string;
  status: VehicleStatus;
  currentOrgId: number;
  currentOrgName: string;
}

// ==================== 运单 ====================
export type WaybillStatus = '待调度' | '已调度' | '运输中' | '已到货' | '派送中' | '已签收' | '异常';
export type ReceiptStatus = '待寄出' | '已寄出' | '已签收' | '无需回单';
export type PaymentMethod = '现付' | '到付' | '月结' | '回付' | '提付' | '回单付' | '货款扣';

export interface Waybill {
  id: number;
  waybillNo: string;
  senderCustomerId: number;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  goodsName: string;
  quantity: number;
  weight: number;
  volume: number;
  freightFee: number;
  paymentMethod: PaymentMethod;
  status: WaybillStatus;
  receiptStatus: ReceiptStatus;
  currentOrgName: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  remark: string;
  transportTaskId?: number;
  // T9业务逻辑扩展字段
  originOrgId?: number;
  originOrgName?: string;
  transitOrgId?: number;
  transitOrgName?: string;
  destOrgId?: number;
  destOrgName?: string;
  packingType?: string;
  baseFreight?: number;
  insuranceFee?: number;
  pickupFee?: number;
  deliveryFee?: number;
  packingFee?: number;
  otherFee?: number;
  codAmount?: number;
  receiptRequired?: number;
  receiptCount?: number;
  deliveryMethod?: string;
}

export interface WaybillStatusLog {
  id: number;
  waybillId: number;
  status: string;
  description: string;
  operatorName: string;
  createdAt: string;
}

// ==================== 运输任务 ====================
export type TransportStatus = '待装车' | '装车中' | '已发车' | '运输中' | '已到达' | '已完成' | '异常';

export interface TransportTask {
  id: number;
  taskNo: string;
  routeId: number;
  routeName: string;
  vehicleId: number;
  vehiclePlateNo: string;
  driverName: string;
  driverPhone: string;
  startOrgId: number;
  startOrgName: string;
  endOrgId: number;
  endOrgName: string;
  waybillIds: number[];
  waybillCount: number;
  totalWeight: number;
  totalVolume: number;
  status: TransportStatus;
  creatorName: string;
  createdAt: string;
  departedAt: string | null;
  arrivedAt: string | null;
}

// ==================== 库存 ====================
export type InventoryStatus = '待出库' | '已出库' | '异常';

export interface InventoryItem {
  id: number;
  waybillId: number;
  waybillNo: string;
  goodsName: string;
  quantity: number;
  weight: number;
  volume: number;
  orgId: number;
  orgName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: InventoryStatus;
  inboundAt: string;
  outboundAt: string | null;
  transportTaskId: number;
}

// ==================== Mock Data ====================

export const mockUsers: User[] = [
  { id: 1, username: 'admin', fullName: '系统管理员', role: 'admin', orgId: 1, orgName: '云途物流总部' },
  { id: 2, username: 'operator1', fullName: '张伟', role: 'operator', orgId: 2, orgName: '广州分拨中心' },
  { id: 3, username: 'finance1', fullName: '李芳', role: 'finance', orgId: 1, orgName: '云途物流总部' },
];

export const mockOrganizations: Organization[] = [
  { id: 1, name: '云途物流总部', type: '总部', parentId: null, address: '广东省广州市天河区天河路385号', contactName: '王总', contactPhone: '020-88880001', status: '启用' },
  { id: 2, name: '广州分拨中心', type: '分拨中心', parentId: 1, address: '广东省广州市白云区太和镇物流园A区', contactName: '陈经理', contactPhone: '020-88880002', status: '启用' },
  { id: 3, name: '深圳分拨中心', type: '分拨中心', parentId: 1, address: '广东省深圳市宝安区福永街道物流园', contactName: '刘经理', contactPhone: '0755-26880003', status: '启用' },
  { id: 4, name: '上海分拨中心', type: '分拨中心', parentId: 1, address: '上海市嘉定区安亭镇物流园B区', contactName: '赵经理', contactPhone: '021-62880004', status: '启用' },
  { id: 5, name: '北京分拨中心', type: '分拨中心', parentId: 1, address: '北京市大兴区亦庄经济开发区物流园', contactName: '孙经理', contactPhone: '010-65880005', status: '启用' },
  { id: 6, name: '成都分拨中心', type: '分拨中心', parentId: 1, address: '四川省成都市龙泉驿区物流大道88号', contactName: '周经理', contactPhone: '028-85880006', status: '启用' },
  { id: 7, name: '广州白云营业部', type: '营业部', parentId: 2, address: '广东省广州市白云区机场路188号', contactName: '吴主管', contactPhone: '020-88880007', status: '启用' },
  { id: 8, name: '深圳南山落点', type: '落点', parentId: 3, address: '广东省深圳市南山区科技园南区', contactName: '郑主管', contactPhone: '0755-26880008', status: '启用' },
  { id: 9, name: '上海浦东落点', type: '落点', parentId: 4, address: '上海市浦东新区张江高科技园区', contactName: '钱主管', contactPhone: '021-62880009', status: '启用' },
  { id: 10, name: '武汉分拨中心', type: '分拨中心', parentId: 1, address: '湖北省武汉市东西湖区物流园', contactName: '冯经理', contactPhone: '027-85880010', status: '停用' },
];

export const mockCustomers: Customer[] = [
  { id: 1, name: '华南电子科技有限公司', phone: '020-88881234', address: '广东省广州市番禺区大石镇工业园', contactPerson: '张经理', type: '发货客户', status: '正常', createdAt: '2025-06-15' },
  { id: 2, name: '深圳创新科技有限公司', phone: '0755-26881234', address: '广东省深圳市南山区科技园南区', contactPerson: '李经理', type: '双向客户', status: '正常', createdAt: '2025-07-20' },
  { id: 3, name: '上海贸易有限公司', phone: '021-62881234', address: '上海市浦东新区张江高科技园区', contactPerson: '王经理', type: '发货客户', status: '正常', createdAt: '2025-08-10' },
  { id: 4, name: '北京信达商贸有限公司', phone: '010-65881234', address: '北京市朝阳区望京SOHO', contactPerson: '赵经理', type: '双向客户', status: '正常', createdAt: '2025-09-05' },
  { id: 5, name: '成都天府食品有限公司', phone: '028-85881234', address: '四川省成都市高新区天府大道', contactPerson: '孙经理', type: '发货客户', status: '正常', createdAt: '2025-10-12' },
  { id: 6, name: '杭州网络科技有限公司', phone: '0571-88881234', address: '浙江省杭州市西湖区文三路', contactPerson: '周经理', type: '收货客户', status: '停用', createdAt: '2025-11-01' },
];

export const mockRoutes: Route[] = [
  { id: 1, name: '广州→上海专线', startOrgId: 2, startOrgName: '广州分拨中心', endOrgId: 4, endOrgName: '上海分拨中心', distance: 1462, estimatedHours: 18, status: '启用' },
  { id: 2, name: '广州→北京专线', startOrgId: 2, startOrgName: '广州分拨中心', endOrgId: 5, endOrgName: '北京分拨中心', distance: 2122, estimatedHours: 24, status: '启用' },
  { id: 3, name: '深圳→北京专线', startOrgId: 3, startOrgName: '深圳分拨中心', endOrgId: 5, endOrgName: '北京分拨中心', distance: 2175, estimatedHours: 25, status: '启用' },
  { id: 4, name: '上海→成都专线', startOrgId: 4, startOrgName: '上海分拨中心', endOrgId: 6, endOrgName: '成都分拨中心', distance: 1920, estimatedHours: 22, status: '启用' },
  { id: 5, name: '北京→广州专线', startOrgId: 5, startOrgName: '北京分拨中心', endOrgId: 2, endOrgName: '广州分拨中心', distance: 2122, estimatedHours: 24, status: '启用' },
  { id: 6, name: '成都→深圳专线', startOrgId: 6, startOrgName: '成都分拨中心', endOrgId: 3, endOrgName: '深圳分拨中心', distance: 1690, estimatedHours: 20, status: '启用' },
  { id: 7, name: '广州→武汉专线', startOrgId: 2, startOrgName: '广州分拨中心', endOrgId: 10, endOrgName: '武汉分拨中心', distance: 968, estimatedHours: 12, status: '停用' },
];

export const mockVehicles: Vehicle[] = [
  { id: 1, plateNo: '粤A12345', type: '9.6米', maxWeight: 10000, maxVolume: 55, driverName: '刘师傅', driverPhone: '13800001001', status: '运输中', currentOrgId: 2, currentOrgName: '广州分拨中心' },
  { id: 2, plateNo: '粤B67890', type: '13米', maxWeight: 15000, maxVolume: 75, driverName: '王师傅', driverPhone: '13800001002', status: '空闲', currentOrgId: 3, currentOrgName: '深圳分拨中心' },
  { id: 3, plateNo: '沪A11111', type: '9.6米', maxWeight: 10000, maxVolume: 55, driverName: '赵师傅', driverPhone: '13800001003', status: '空闲', currentOrgId: 4, currentOrgName: '上海分拨中心' },
  { id: 4, plateNo: '京B22222', type: '6.8米', maxWeight: 5000, maxVolume: 35, driverName: '孙师傅', driverPhone: '13800001004', status: '空闲', currentOrgId: 5, currentOrgName: '北京分拨中心' },
  { id: 5, plateNo: '川A33333', type: '13米', maxWeight: 15000, maxVolume: 75, driverName: '钱师傅', driverPhone: '13800001005', status: '运输中', currentOrgId: 6, currentOrgName: '成都分拨中心' },
  { id: 6, plateNo: '粤A44444', type: '4.2米', maxWeight: 2000, maxVolume: 18, driverName: '冯师傅', driverPhone: '13800001006', status: '维修中', currentOrgId: 2, currentOrgName: '广州分拨中心' },
  { id: 7, plateNo: '粤A55555', type: '17.5米', maxWeight: 25000, maxVolume: 110, driverName: '陈师傅', driverPhone: '13800001007', status: '空闲', currentOrgId: 2, currentOrgName: '广州分拨中心' },
  { id: 8, plateNo: '沪B66666', type: '6.8米', maxWeight: 5000, maxVolume: 35, driverName: '吴师傅', driverPhone: '13800001008', status: '停用', currentOrgId: 4, currentOrgName: '上海分拨中心' },
];

export const mockWaybills: Waybill[] = [
  {
    id: 1, waybillNo: 'YT20260210001', senderCustomerId: 1,
    senderName: '华南电子科技有限公司', senderPhone: '020-88881234', senderAddress: '广东省广州市番禺区大石镇工业园',
    receiverName: '张三', receiverPhone: '13800138001', receiverAddress: '上海市浦东新区张江高科技园区A栋',
    goodsName: '电子配件', quantity: 20, weight: 150.5, volume: 2.3,
    freightFee: 850.00, paymentMethod: '现付', status: '运输中', receiptStatus: '待寄出',
    currentOrgName: '广州分拨中心', creatorName: '张伟', createdAt: '2026-02-10 08:30:00', updatedAt: '2026-02-10 09:15:00', remark: '易碎品，轻拿轻放', transportTaskId: 1,
  },
  {
    id: 2, waybillNo: 'YT20260210002', senderCustomerId: 2,
    senderName: '深圳创新科技有限公司', senderPhone: '0755-26881234', senderAddress: '广东省深圳市南山区科技园南区',
    receiverName: '李四', receiverPhone: '13900139002', receiverAddress: '北京市朝阳区望京SOHO T1栋',
    goodsName: '服务器设备', quantity: 5, weight: 320.0, volume: 4.8,
    freightFee: 2200.00, paymentMethod: '月结', status: '待调度', receiptStatus: '无需回单',
    currentOrgName: '深圳分拨中心', creatorName: '张伟', createdAt: '2026-02-10 09:00:00', updatedAt: '2026-02-10 09:00:00', remark: '',
  },
  {
    id: 3, waybillNo: 'YT20260210003', senderCustomerId: 3,
    senderName: '上海贸易有限公司', senderPhone: '021-62881234', senderAddress: '上海市浦东新区张江高科技园区',
    receiverName: '王五', receiverPhone: '13700137003', receiverAddress: '四川省成都市高新区天府大道100号',
    goodsName: '办公用品', quantity: 50, weight: 80.0, volume: 1.5,
    freightFee: 560.00, paymentMethod: '到付', status: '已到货', receiptStatus: '待寄出',
    currentOrgName: '成都分拨中心', creatorName: '系统管理员', createdAt: '2026-02-09 14:20:00', updatedAt: '2026-02-10 06:30:00', remark: '加急件', transportTaskId: 2,
  },
  {
    id: 4, waybillNo: 'YT20260209001', senderCustomerId: 4,
    senderName: '北京信达商贸有限公司', senderPhone: '010-65881234', senderAddress: '北京市朝阳区望京SOHO',
    receiverName: '赵六', receiverPhone: '13600136004', receiverAddress: '广东省广州市天河区体育西路',
    goodsName: '服装鞋帽', quantity: 100, weight: 200.0, volume: 6.0,
    freightFee: 1350.00, paymentMethod: '现付', status: '已签收', receiptStatus: '已签收',
    currentOrgName: '广州分拨中心', creatorName: '系统管理员', createdAt: '2026-02-09 10:00:00', updatedAt: '2026-02-10 11:00:00', remark: '',
  },
  {
    id: 5, waybillNo: 'YT20260209002', senderCustomerId: 5,
    senderName: '成都天府食品有限公司', senderPhone: '028-85881234', senderAddress: '四川省成都市高新区天府大道',
    receiverName: '孙七', receiverPhone: '13500135005', receiverAddress: '广东省深圳市福田区华强北路',
    goodsName: '食品饮料', quantity: 200, weight: 500.0, volume: 10.0,
    freightFee: 3200.00, paymentMethod: '月结', status: '派送中', receiptStatus: '待寄出',
    currentOrgName: '深圳分拨中心', creatorName: '张伟', createdAt: '2026-02-09 08:00:00', updatedAt: '2026-02-10 08:00:00', remark: '冷链运输',
  },
  {
    id: 6, waybillNo: 'YT20260208001', senderCustomerId: 1,
    senderName: '华南电子科技有限公司', senderPhone: '020-88881234', senderAddress: '广东省广州市番禺区大石镇工业园',
    receiverName: '周八', receiverPhone: '13400134006', receiverAddress: '上海市嘉定区安亭镇汽车城',
    goodsName: '汽车零配件', quantity: 30, weight: 250.0, volume: 3.5,
    freightFee: 1100.00, paymentMethod: '回付', status: '已签收', receiptStatus: '已寄出',
    currentOrgName: '上海分拨中心', creatorName: '张伟', createdAt: '2026-02-08 11:00:00', updatedAt: '2026-02-09 16:00:00', remark: '',
  },
  {
    id: 7, waybillNo: 'YT20260208002', senderCustomerId: 2,
    senderName: '深圳创新科技有限公司', senderPhone: '0755-26881234', senderAddress: '广东省深圳市南山区科技园南区',
    receiverName: '吴九', receiverPhone: '13300133007', receiverAddress: '北京市海淀区中关村大街',
    goodsName: '显示器', quantity: 15, weight: 120.0, volume: 2.0,
    freightFee: 980.00, paymentMethod: '现付', status: '异常', receiptStatus: '待寄出',
    currentOrgName: '北京分拨中心', creatorName: '系统管理员', createdAt: '2026-02-08 09:00:00', updatedAt: '2026-02-09 14:00:00', remark: '货物破损',
  },
  {
    id: 8, waybillNo: 'YT20260210004', senderCustomerId: 3,
    senderName: '上海贸易有限公司', senderPhone: '021-62881234', senderAddress: '上海市浦东新区张江高科技园区',
    receiverName: '郑十', receiverPhone: '13200132008', receiverAddress: '广东省广州市白云区机场路',
    goodsName: '化妆品', quantity: 80, weight: 60.0, volume: 1.2,
    freightFee: 420.00, paymentMethod: '到付', status: '已调度', receiptStatus: '无需回单',
    currentOrgName: '上海分拨中心', creatorName: '系统管理员', createdAt: '2026-02-10 10:30:00', updatedAt: '2026-02-10 11:00:00', remark: '',
  },
  {
    id: 9, waybillNo: 'YT20260210005', senderCustomerId: 1,
    senderName: '华南电子科技有限公司', senderPhone: '020-88881234', senderAddress: '广东省广州市番禺区大石镇工业园',
    receiverName: '钱十一', receiverPhone: '13100131009', receiverAddress: '上海市徐汇区漕河泾开发区',
    goodsName: '电路板', quantity: 40, weight: 95.0, volume: 1.8,
    freightFee: 720.00, paymentMethod: '现付', status: '待调度', receiptStatus: '待寄出',
    currentOrgName: '广州分拨中心', creatorName: '张伟', createdAt: '2026-02-10 11:00:00', updatedAt: '2026-02-10 11:00:00', remark: '',
  },
];

export const mockStatusLogs: Record<number, WaybillStatusLog[]> = {
  1: [
    { id: 1, waybillId: 1, status: '待调度', description: '运单创建成功', operatorName: '张伟', createdAt: '2026-02-10 08:30:00' },
    { id: 2, waybillId: 1, status: '已调度', description: '已分配至广州→上海专线', operatorName: '系统管理员', createdAt: '2026-02-10 08:45:00' },
    { id: 3, waybillId: 1, status: '运输中', description: '车辆已发出，车牌号：粤A12345', operatorName: '张伟', createdAt: '2026-02-10 09:15:00' },
  ],
  3: [
    { id: 4, waybillId: 3, status: '待调度', description: '运单创建成功', operatorName: '系统管理员', createdAt: '2026-02-09 14:20:00' },
    { id: 5, waybillId: 3, status: '已调度', description: '已分配至上海→成都专线', operatorName: '系统管理员', createdAt: '2026-02-09 14:40:00' },
    { id: 6, waybillId: 3, status: '运输中', description: '车辆已发出，车牌号：沪A11111', operatorName: '张伟', createdAt: '2026-02-09 16:00:00' },
    { id: 7, waybillId: 3, status: '已到货', description: '车辆到达成都分拨中心，一键入库完成', operatorName: '张伟', createdAt: '2026-02-10 06:30:00' },
  ],
  4: [
    { id: 8, waybillId: 4, status: '待调度', description: '运单创建成功', operatorName: '系统管理员', createdAt: '2026-02-09 10:00:00' },
    { id: 9, waybillId: 4, status: '运输中', description: '车辆已发出', operatorName: '张伟', createdAt: '2026-02-09 11:00:00' },
    { id: 10, waybillId: 4, status: '已到货', description: '车辆到达广州分拨中心', operatorName: '张伟', createdAt: '2026-02-09 22:00:00' },
    { id: 11, waybillId: 4, status: '派送中', description: '安排派送', operatorName: '张伟', createdAt: '2026-02-10 08:00:00' },
    { id: 12, waybillId: 4, status: '已签收', description: '客户已签收', operatorName: '张伟', createdAt: '2026-02-10 11:00:00' },
  ],
};

export const mockTransportTasks: TransportTask[] = [
  {
    id: 1, taskNo: 'TK20260210001', routeId: 1, routeName: '广州→上海专线',
    vehicleId: 1, vehiclePlateNo: '粤A12345', driverName: '刘师傅', driverPhone: '13800001001',
    startOrgId: 2, startOrgName: '广州分拨中心', endOrgId: 4, endOrgName: '上海分拨中心',
    waybillIds: [1], waybillCount: 1, totalWeight: 150.5, totalVolume: 2.3,
    status: '运输中', creatorName: '系统管理员', createdAt: '2026-02-10 08:45:00', departedAt: '2026-02-10 09:15:00', arrivedAt: null,
  },
  {
    id: 2, taskNo: 'TK20260209001', routeId: 4, routeName: '上海→成都专线',
    vehicleId: 3, vehiclePlateNo: '沪A11111', driverName: '赵师傅', driverPhone: '13800001003',
    startOrgId: 4, startOrgName: '上海分拨中心', endOrgId: 6, endOrgName: '成都分拨中心',
    waybillIds: [3], waybillCount: 1, totalWeight: 80.0, totalVolume: 1.5,
    status: '已到达', creatorName: '系统管理员', createdAt: '2026-02-09 14:40:00', departedAt: '2026-02-09 16:00:00', arrivedAt: '2026-02-10 06:30:00',
  },
  {
    id: 3, taskNo: 'TK20260210002', routeId: 1, routeName: '广州→上海专线',
    vehicleId: 7, vehiclePlateNo: '粤A55555', driverName: '陈师傅', driverPhone: '13800001007',
    startOrgId: 2, startOrgName: '广州分拨中心', endOrgId: 4, endOrgName: '上海分拨中心',
    waybillIds: [], waybillCount: 0, totalWeight: 0, totalVolume: 0,
    status: '待装车', creatorName: '系统管理员', createdAt: '2026-02-10 11:30:00', departedAt: null, arrivedAt: null,
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 1, waybillId: 3, waybillNo: 'YT20260210003', goodsName: '办公用品', quantity: 50, weight: 80.0, volume: 1.5,
    orgId: 6, orgName: '成都分拨中心', receiverName: '王五', receiverPhone: '13700137003', receiverAddress: '四川省成都市高新区天府大道100号',
    status: '待出库', inboundAt: '2026-02-10 06:30:00', outboundAt: null, transportTaskId: 2,
  },
  {
    id: 2, waybillId: 4, waybillNo: 'YT20260209001', goodsName: '服装鞋帽', quantity: 100, weight: 200.0, volume: 6.0,
    orgId: 2, orgName: '广州分拨中心', receiverName: '赵六', receiverPhone: '13600136004', receiverAddress: '广东省广州市天河区体育西路',
    status: '已出库', inboundAt: '2026-02-09 22:00:00', outboundAt: '2026-02-10 08:00:00', transportTaskId: 0,
  },
];

// ==================== Helpers ====================
let waybillCounter = 10;
export function generateWaybillNo(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `YT${dateStr}${String(waybillCounter++).padStart(3, '0')}`;
}

let taskCounter = 4;
export function generateTaskNo(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `TK${dateStr}${String(taskCounter++).padStart(3, '0')}`;
}
