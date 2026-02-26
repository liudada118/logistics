// 基础资料 - 线路管理
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { baseDataApi } from '@/lib/api';
import { mockRoutes, mockOrganizations, type Route } from '@/lib/mock-data';
import { Plus, Search, Pencil, Trash2, Route as RouteIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function RouteManage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [form, setForm] = useState({ name: '', startOrgId: 0, endOrgId: 0, distance: 0, estimatedHours: 0, status: '启用' as Route['status'] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [routeRes, orgRes] = await Promise.all([
        baseDataApi.listRoutes({ page: 1, size: 200, keyword: search || undefined }),
        baseDataApi.allOrgs(),
      ]);
      setRoutes(routeRes.records || []);
      setOrgs(orgRes || []);
    } catch {
      setRoutes(mockRoutes);
      setOrgs(mockOrganizations);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const orgOptions = orgs.filter((o: any) => o.type !== '总部');
  const filtered = routes.filter(r => !search || r.name?.includes(search) || r.startOrgName?.includes(search) || r.endOrgName?.includes(search));

  const openCreate = () => {
    setEditingRoute(null);
    setForm({ name: '', startOrgId: 0, endOrgId: 0, distance: 0, estimatedHours: 0, status: '启用' });
    setDialogOpen(true);
  };

  const openEdit = (route: Route) => {
    setEditingRoute(route);
    setForm({ name: route.name, startOrgId: route.startOrgId, endOrgId: route.endOrgId, distance: route.distance, estimatedHours: route.estimatedHours, status: route.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.startOrgId || !form.endOrgId) { toast.error('请填写必要信息'); return; }
    try {
      if (editingRoute) {
        await baseDataApi.updateRoute(editingRoute.id, form);
        toast.success('线路信息已更新');
      } else {
        await baseDataApi.createRoute(form);
        toast.success('线路创建成功');
      }
      setDialogOpen(false);
      loadData();
    } catch {
      const startOrg = orgs.find((o: any) => o.id === form.startOrgId);
      const endOrg = orgs.find((o: any) => o.id === form.endOrgId);
      if (editingRoute) {
        setRoutes(prev => prev.map(r => r.id === editingRoute.id ? { ...r, ...form, startOrgName: startOrg?.name || '', endOrgName: endOrg?.name || '' } : r));
        toast.success('线路信息已更新');
      } else {
        const newRoute: Route = { id: Math.max(...routes.map(r => r.id), 0) + 1, ...form, startOrgName: startOrg?.name || '', endOrgName: endOrg?.name || '' };
        setRoutes(prev => [...prev, newRoute]);
        toast.success('线路创建成功');
      }
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await baseDataApi.deleteRoute(id);
      toast.success('线路已删除');
      loadData();
    } catch {
      setRoutes(prev => prev.filter(r => r.id !== id));
      toast.success('线路已删除');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">线路管理</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length} 条</span>
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />新增线路</Button>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索线路名称/网点" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">线路名称</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">始发网点</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">到达网点</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">里程(km)</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">预计时效(h)</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">暂无线路数据</td></tr>}
                {!loading && filtered.map(route => (
                  <tr key={route.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{route.name}</td>
                    <td className="px-4 py-3">{route.startOrgName}</td>
                    <td className="px-4 py-3">{route.endOrgName}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{(route.distance || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{route.estimatedHours}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${route.status === '启用' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{route.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(route)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(route.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editingRoute ? '编辑线路' : '新增线路'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium text-foreground">线路名称 *</label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">始发网点 *</label>
                <Select value={form.startOrgId ? String(form.startOrgId) : ''} onValueChange={v => setForm(f => ({ ...f, startOrgId: Number(v) }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="选择网点" /></SelectTrigger>
                  <SelectContent>{orgOptions.map((o: any) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium text-foreground">到达网点 *</label>
                <Select value={form.endOrgId ? String(form.endOrgId) : ''} onValueChange={v => setForm(f => ({ ...f, endOrgId: Number(v) }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="选择网点" /></SelectTrigger>
                  <SelectContent>{orgOptions.map((o: any) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">里程(km)</label><Input type="number" className="mt-1" value={form.distance || ''} onChange={e => setForm(f => ({ ...f, distance: Number(e.target.value) }))} /></div>
              <div><label className="text-sm font-medium text-foreground">预计时效(h)</label><Input type="number" className="mt-1" value={form.estimatedHours || ''} onChange={e => setForm(f => ({ ...f, estimatedHours: Number(e.target.value) }))} /></div>
            </div>
            <div><label className="text-sm font-medium text-foreground">状态</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Route['status'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="启用">启用</SelectItem><SelectItem value="停用">停用</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
