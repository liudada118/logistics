// 基础资料 - 车辆管理
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { baseDataApi } from '@/lib/api';
import { mockVehicles, type Vehicle, type VehicleStatus } from '@/lib/mock-data';
import { Plus, Search, Pencil, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';

const vehicleTypes = ['4.2米', '6.8米', '9.6米', '13米', '17.5米'] as const;
const statusOptions: VehicleStatus[] = ['空闲', '运输中', '维修中', '停用'];

const statusColor: Record<VehicleStatus, string> = {
  '空闲': 'bg-emerald-100 text-emerald-700',
  '运输中': 'bg-blue-100 text-blue-700',
  '维修中': 'bg-amber-100 text-amber-700',
  '停用': 'bg-gray-100 text-gray-500',
};

export default function VehicleManage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ plateNo: '', type: '9.6米' as Vehicle['type'], maxWeight: 10000, maxVolume: 55, driverName: '', driverPhone: '', status: '空闲' as VehicleStatus, currentOrgName: '' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listVehicles({ page: 1, size: 200, keyword: search || undefined });
      setVehicles(res.records || []);
    } catch {
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = vehicles.filter(v => {
    const matchSearch = !search || v.plateNo?.includes(search) || v.driverName?.includes(search);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditingVehicle(null);
    setForm({ plateNo: '', type: '9.6米', maxWeight: 10000, maxVolume: 55, driverName: '', driverPhone: '', status: '空闲', currentOrgName: '' });
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({ plateNo: v.plateNo, type: v.type, maxWeight: v.maxWeight, maxVolume: v.maxVolume, driverName: v.driverName, driverPhone: v.driverPhone, status: v.status, currentOrgName: v.currentOrgName });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.plateNo || !form.driverName) { toast.error('请填写必要信息'); return; }
    try {
      if (editingVehicle) {
        await baseDataApi.updateVehicle(editingVehicle.id, form);
        toast.success('车辆信息已更新');
      } else {
        await baseDataApi.createVehicle({ ...form, currentOrgId: 2 });
        toast.success('车辆创建成功');
      }
      setDialogOpen(false);
      loadData();
    } catch {
      if (editingVehicle) {
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...form } : v));
        toast.success('车辆信息已更新');
      } else {
        const newV: Vehicle = { id: Math.max(...vehicles.map(v => v.id), 0) + 1, currentOrgId: 2, ...form };
        setVehicles(prev => [...prev, newV]);
        toast.success('车辆创建成功');
      }
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await baseDataApi.deleteVehicle(id);
      toast.success('车辆已删除');
      loadData();
    } catch {
      setVehicles(prev => prev.filter(v => v.id !== id));
      toast.success('车辆已删除');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">车辆管理</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length} 辆</span>
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />新增车辆</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索车牌号/司机" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">车牌号</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">车型</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">载重(kg)</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">容积(m³)</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">司机</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">联系电话</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">当前位置</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">暂无车辆数据</td></tr>}
                {!loading && filtered.map(v => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{v.plateNo}</td>
                    <td className="px-4 py-3">{v.type}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{(v.maxWeight || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{v.maxVolume}</td>
                    <td className="px-4 py-3">{v.driverName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.driverPhone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.currentOrgName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[v.status] || 'bg-gray-100 text-gray-500'}`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingVehicle ? '编辑车辆' : '新增车辆'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium text-foreground">车牌号 *</label><Input className="mt-1" value={form.plateNo} onChange={e => setForm(f => ({ ...f, plateNo: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">车型</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Vehicle['type'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{vehicleTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium text-foreground">状态</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as VehicleStatus }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">载重(kg)</label><Input type="number" className="mt-1" value={form.maxWeight || ''} onChange={e => setForm(f => ({ ...f, maxWeight: Number(e.target.value) }))} /></div>
              <div><label className="text-sm font-medium text-foreground">容积(m³)</label><Input type="number" className="mt-1" value={form.maxVolume || ''} onChange={e => setForm(f => ({ ...f, maxVolume: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">司机姓名 *</label><Input className="mt-1" value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-foreground">联系电话</label><Input className="mt-1" value={form.driverPhone} onChange={e => setForm(f => ({ ...f, driverPhone: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
