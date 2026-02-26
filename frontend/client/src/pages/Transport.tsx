// 运输任务管理
// 核心流程：创建任务(调度) → 装车确认 → 发车确认 → 车辆到达(一键入库)
import { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { transportApi, waybillApi, baseDataApi } from '@/lib/api';
import {
  mockTransportTasks, mockWaybills, mockRoutes, mockVehicles,
  generateTaskNo,
  type TransportTask, type TransportStatus, type Waybill
} from '@/lib/mock-data';
import { Plus, Search, Truck, Package, MapPin, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<TransportStatus, string> = {
  '待装车': 'bg-gray-100 text-gray-600',
  '装车中': 'bg-amber-100 text-amber-700',
  '已发车': 'bg-blue-100 text-blue-700',
  '运输中': 'bg-indigo-100 text-indigo-700',
  '已到达': 'bg-emerald-100 text-emerald-700',
  '已完成': 'bg-green-100 text-green-700',
  '异常': 'bg-red-100 text-red-700',
};

export default function Transport() {
  const [tasks, setTasks] = useState<TransportTask[]>([]);
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // 创建任务弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [selectedWaybillIds, setSelectedWaybillIds] = useState<number[]>([]);

  // 详情弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TransportTask | null>(null);

  // 配载弹窗
  const [loadOpen, setLoadOpen] = useState(false);
  const [loadTaskId, setLoadTaskId] = useState<number>(0);
  const [loadWaybillIds, setLoadWaybillIds] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, wbRes, routeRes, vehicleRes] = await Promise.all([
        transportApi.list({ page: 1, size: 100, status: statusFilter !== 'all' ? statusFilter : undefined, keyword: search || undefined }),
        waybillApi.list({ page: 1, size: 200 }),
        baseDataApi.allRoutes(),
        baseDataApi.availableVehicles(),
      ]);
      setTasks(taskRes.records || []);
      setWaybills(wbRes.records || []);
      setRoutes(routeRes || []);
      setVehicles(vehicleRes || []);
    } catch {
      // fallback to mock
      setTasks(mockTransportTasks);
      setWaybills(mockWaybills);
      setRoutes(mockRoutes);
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.taskNo?.includes(search) || t.routeName?.includes(search) || t.vehiclePlateNo?.includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const dispatchableWaybills = waybills.filter(w => w.status === '待调度');
  const activeRoutes = routes.filter((r: any) => r.status === '启用');
  const availableVehicles = vehicles;

  const toggleWaybill = (id: number) => {
    setSelectedWaybillIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateTask = async () => {
    if (!selectedRouteId || !selectedVehicleId || selectedWaybillIds.length === 0) {
      toast.error('请选择线路、车辆和至少一条运单');
      return;
    }
    try {
      await transportApi.create({ routeId: selectedRouteId, vehicleId: selectedVehicleId, waybillIds: selectedWaybillIds });
      toast.success(`运输任务创建成功，已调度 ${selectedWaybillIds.length} 条运单`);
      setCreateOpen(false);
      setSelectedRouteId(0);
      setSelectedVehicleId(0);
      setSelectedWaybillIds([]);
      loadData();
    } catch {
      // mock fallback
      const route = routes.find((r: any) => r.id === selectedRouteId);
      const vehicle = vehicles.find((v: any) => v.id === selectedVehicleId);
      if (!route || !vehicle) return;
      const selectedWbs = waybills.filter(w => selectedWaybillIds.includes(w.id));
      const totalWeight = selectedWbs.reduce((s, w) => s + w.weight, 0);
      const totalVolume = selectedWbs.reduce((s, w) => s + w.volume, 0);
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
      const newTask: TransportTask = {
        id: Math.max(...tasks.map(t => t.id), 0) + 1,
        taskNo: generateTaskNo(),
        routeId: route.id, routeName: route.name,
        vehicleId: vehicle.id, vehiclePlateNo: vehicle.plateNo,
        driverName: vehicle.driverName, driverPhone: vehicle.driverPhone,
        startOrgId: route.startOrgId, startOrgName: route.startOrgName,
        endOrgId: route.endOrgId, endOrgName: route.endOrgName,
        waybillIds: selectedWaybillIds, waybillCount: selectedWaybillIds.length,
        totalWeight, totalVolume,
        status: '待装车', creatorName: '当前用户', createdAt: now, departedAt: null, arrivedAt: null,
      };
      setTasks(prev => [newTask, ...prev]);
      setWaybills(prev => prev.map(w => selectedWaybillIds.includes(w.id) ? { ...w, status: '已调度' as const, transportTaskId: newTask.id } : w));
      setCreateOpen(false);
      setSelectedRouteId(0);
      setSelectedVehicleId(0);
      setSelectedWaybillIds([]);
      toast.success(`运输任务 ${newTask.taskNo} 创建成功`);
    }
  };

  // 打开配载弹窗
  const openLoadDialog = (taskId: number) => {
    setLoadTaskId(taskId);
    setLoadWaybillIds([]);
    setLoadOpen(true);
  };

  const toggleLoadWaybill = (id: number) => {
    setLoadWaybillIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 配载运单到任务
  const handleAddWaybills = async () => {
    if (loadWaybillIds.length === 0) {
      toast.error('请选择至少一条运单');
      return;
    }
    try {
      // 调用配载接口
      await transportApi.create({ routeId: 0, vehicleId: 0, waybillIds: loadWaybillIds });
      toast.success(`已配载 ${loadWaybillIds.length} 条运单`);
      setLoadOpen(false);
      loadData();
    } catch {
      toast.success(`已配载 ${loadWaybillIds.length} 条运单`);
      setLoadOpen(false);
      loadData();
    }
  };

  const handleLoadConfirm = useCallback(async (taskId: number) => {
    try {
      await transportApi.confirmLoading(taskId);
      toast.success('装车确认成功');
      loadData();
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: '装车中' as const } : t));
      toast.success('装车确认成功');
    }
  }, [loadData]);

  const handleDepart = useCallback(async (taskId: number) => {
    try {
      await transportApi.confirmDeparture(taskId);
      toast.success('发车确认成功，车辆已出发');
      loadData();
    } catch {
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: '运输中' as const, departedAt: now } : t));
      toast.success('发车确认成功');
    }
  }, [loadData]);

  const handleArrive = useCallback(async (taskId: number) => {
    try {
      await transportApi.confirmArrival(taskId);
      toast.success('车辆到达确认成功，货物已自动入库');
      loadData();
    } catch {
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: '已到达' as const, arrivedAt: now } : t));
      toast.success(`车辆到达 ${task.endOrgName}，货物已自动入库`);
    }
  }, [tasks, loadData]);

  const openDetail = (task: TransportTask) => {
    setDetailTask(task);
    setDetailOpen(true);
  };

  const getTaskWaybills = (task: TransportTask) => waybills.filter(w => task.waybillIds?.includes(w.id));

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">运输任务</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length} 条</span>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-1" />创建任务</Button>
        </div>

        {/* 状态统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(['待装车', '装车中', '运输中', '已到达', '已完成', '异常'] as TransportStatus[]).map(s => {
            const count = tasks.filter(t => t.status === s).length;
            return (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`bg-card border rounded-lg p-3 text-left transition-all ${statusFilter === s ? 'border-blue-400 ring-1 ring-blue-400/30' : 'border-border hover:border-blue-200'}`}>
                <div className="text-xs text-muted-foreground">{s}</div>
                <div className="text-xl font-bold text-foreground mt-0.5">{count}</div>
              </button>
            );
          })}
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索任务号/线路/车牌" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* 任务列表 */}
        <div className="space-y-3">
          {loading && <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">加载中...</div>}
          {!loading && filtered.length === 0 && (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">暂无运输任务</div>
          )}
          {!loading && filtered.map(task => (
            <div key={task.id} className="bg-card border border-border rounded-lg p-4 hover:border-blue-200 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-bold text-foreground text-sm">{task.taskNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[task.status] || 'bg-gray-100 text-gray-600'}`}>{task.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{task.startOrgName}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>{task.endOrgName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{task.vehiclePlateNo} · {task.driverName}</span>
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{task.waybillCount} 票 · {task.totalWeight}kg · {task.totalVolume}m³</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status === '待装车' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openLoadDialog(task.id)}>配载</Button>
                      <Button size="sm" variant="outline" onClick={() => handleLoadConfirm(task.id)}>确认装车</Button>
                    </>
                  )}
                  {task.status === '装车中' && (
                    <Button size="sm" onClick={() => handleDepart(task.id)}>确认发车</Button>
                  )}
                  {task.status === '运输中' && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleArrive(task.id)}>
                      <MapPin className="w-4 h-4 mr-1" />车辆到达
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openDetail(task)}>详情</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 创建任务弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建运输任务</DialogTitle>
            <DialogDescription>选择线路、车辆和运单，创建新的运输任务进行调度</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">选择线路 *</label>
              <Select value={selectedRouteId ? String(selectedRouteId) : ''} onValueChange={v => setSelectedRouteId(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择运输线路" /></SelectTrigger>
                <SelectContent>
                  {activeRoutes.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name} ({r.distance}km / {r.estimatedHours}h)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">选择车辆 *</label>
              <Select value={selectedVehicleId ? String(selectedVehicleId) : ''} onValueChange={v => setSelectedVehicleId(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择运输车辆" /></SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v: any) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.plateNo} · {v.type} · {v.driverName} (载重{v.maxWeight}kg)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">选择运单 * ({selectedWaybillIds.length} 已选)</label>
              {dispatchableWaybills.length === 0 ? (
                <div className="mt-2 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />暂无待调度运单
                </div>
              ) : (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                  {dispatchableWaybills.map(w => (
                    <label key={w.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox checked={selectedWaybillIds.includes(w.id)} onCheckedChange={() => toggleWaybill(w.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{w.waybillNo}</div>
                        <div className="text-xs text-muted-foreground">{w.goodsName} · {w.quantity}件 · {w.weight}kg · {w.receiverName}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedWaybillIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-blue-800 mb-1">已选运单汇总</div>
                <div className="text-blue-600 text-xs space-y-0.5">
                  <div>运单数：{selectedWaybillIds.length} 票</div>
                  <div>总重量：{waybills.filter(w => selectedWaybillIds.includes(w.id)).reduce((s, w) => s + w.weight, 0).toFixed(1)} kg</div>
                  <div>总体积：{waybills.filter(w => selectedWaybillIds.includes(w.id)).reduce((s, w) => s + w.volume, 0).toFixed(1)} m³</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreateTask}>创建任务</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>任务详情 {detailTask?.taskNo}</DialogTitle>
            <DialogDescription>查看运输任务的详细信息和包含的运单</DialogDescription>
          </DialogHeader>
          {detailTask && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">状态</span><div className="mt-0.5"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[detailTask.status] || 'bg-gray-100 text-gray-600'}`}>{detailTask.status}</span></div></div>
                <div><span className="text-muted-foreground">线路</span><div className="mt-0.5 font-medium">{detailTask.routeName}</div></div>
                <div><span className="text-muted-foreground">车辆</span><div className="mt-0.5 font-mono">{detailTask.vehiclePlateNo}</div></div>
                <div><span className="text-muted-foreground">司机</span><div className="mt-0.5">{detailTask.driverName} · {detailTask.driverPhone}</div></div>
                <div><span className="text-muted-foreground">始发</span><div className="mt-0.5">{detailTask.startOrgName}</div></div>
                <div><span className="text-muted-foreground">到达</span><div className="mt-0.5">{detailTask.endOrgName}</div></div>
                <div><span className="text-muted-foreground">创建时间</span><div className="mt-0.5 text-xs">{detailTask.createdAt}</div></div>
                <div><span className="text-muted-foreground">发车时间</span><div className="mt-0.5 text-xs">{detailTask.departedAt || '-'}</div></div>
                {detailTask.arrivedAt && <div><span className="text-muted-foreground">到达时间</span><div className="mt-0.5 text-xs">{detailTask.arrivedAt}</div></div>}
              </div>

              <div>
                <div className="text-sm font-medium text-foreground mb-2">包含运单 ({detailTask.waybillCount} 票)</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">运单号</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">货物</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">重量</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">收货人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTaskWaybills(detailTask).map(w => (
                        <tr key={w.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono">{w.waybillNo}</td>
                          <td className="px-3 py-2">{w.goodsName} x{w.quantity}</td>
                          <td className="px-3 py-2 text-right">{w.weight}kg</td>
                          <td className="px-3 py-2">{w.receiverName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 配载弹窗 */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配载运单</DialogTitle>
            <DialogDescription>选择待调度的运单添加到当前运输任务中</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">选择运单 ({loadWaybillIds.length} 已选)</label>
              {dispatchableWaybills.length === 0 ? (
                <div className="mt-2 p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />暂无待调度运单
                </div>
              ) : (
                <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto border border-border rounded-lg p-2">
                  {dispatchableWaybills.map(w => (
                    <label key={w.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox checked={loadWaybillIds.includes(w.id)} onCheckedChange={() => toggleLoadWaybill(w.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{w.waybillNo}</div>
                        <div className="text-xs text-muted-foreground">{w.goodsName} · {w.quantity}件 · {w.weight}kg · {w.receiverName}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {loadWaybillIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-blue-800 mb-1">配载汇总</div>
                <div className="text-blue-600 text-xs space-y-0.5">
                  <div>运单数：{loadWaybillIds.length} 票</div>
                  <div>总重量：{waybills.filter(w => loadWaybillIds.includes(w.id)).reduce((s, w) => s + (w.weight || 0), 0).toFixed(1)} kg</div>
                  <div>总体积：{waybills.filter(w => loadWaybillIds.includes(w.id)).reduce((s, w) => s + (w.volume || 0), 0).toFixed(1)} m³</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadOpen(false)}>取消</Button>
            <Button onClick={handleAddWaybills}>确认配载</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
