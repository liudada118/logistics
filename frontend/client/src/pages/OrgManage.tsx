// 基础资料 - 网点/落点管理
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { baseDataApi } from '@/lib/api';
import { mockOrganizations, type Organization } from '@/lib/mock-data';
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const orgTypes = ['总部', '分拨中心', '落点', '营业部'] as const;

export default function OrgManage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState({ name: '', type: '分拨中心' as Organization['type'], address: '', contactName: '', contactPhone: '', status: '启用' as Organization['status'] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listOrgs({ page: 1, size: 200, keyword: search || undefined });
      setOrgs(res.records || []);
    } catch {
      setOrgs(mockOrganizations);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name?.includes(search) || o.address?.includes(search);
    const matchType = typeFilter === 'all' || o.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditingOrg(null);
    setForm({ name: '', type: '分拨中心', address: '', contactName: '', contactPhone: '', status: '启用' });
    setDialogOpen(true);
  };

  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setForm({ name: org.name, type: org.type, address: org.address, contactName: org.contactName, contactPhone: org.contactPhone, status: org.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.address) { toast.error('请填写必要信息'); return; }
    try {
      if (editingOrg) {
        await baseDataApi.updateOrg(editingOrg.id, form);
        toast.success('网点信息已更新');
      } else {
        await baseDataApi.createOrg({ ...form, parentId: 1 });
        toast.success('网点创建成功');
      }
      setDialogOpen(false);
      loadData();
    } catch {
      // mock fallback
      if (editingOrg) {
        setOrgs(prev => prev.map(o => o.id === editingOrg.id ? { ...o, ...form } : o));
        toast.success('网点信息已更新');
      } else {
        const newOrg: Organization = { id: Math.max(...orgs.map(o => o.id), 0) + 1, parentId: 1, ...form };
        setOrgs(prev => [...prev, newOrg]);
        toast.success('网点创建成功');
      }
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await baseDataApi.deleteOrg(id);
      toast.success('网点已删除');
      loadData();
    } catch {
      setOrgs(prev => prev.filter(o => o.id !== id));
      toast.success('网点已删除');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">网点管理</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length} 条</span>
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />新增网点</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索网点名称/地址" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {orgTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">网点名称</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">地址</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">联系人</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">联系电话</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">暂无网点数据</td></tr>}
                {!loading && filtered.map(org => (
                  <tr key={org.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{org.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        org.type === '总部' ? 'bg-purple-100 text-purple-700' :
                        org.type === '分拨中心' ? 'bg-blue-100 text-blue-700' :
                        org.type === '落点' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>{org.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{org.address}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{org.contactName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{org.contactPhone}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${org.status === '启用' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{org.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(org)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(org.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editingOrg ? '编辑网点' : '新增网点'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium text-foreground">网点名称 *</label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="text-sm font-medium text-foreground">类型</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Organization['type'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{orgTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium text-foreground">地址 *</label><Input className="mt-1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">联系人</label><Input className="mt-1" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-foreground">联系电话</label><Input className="mt-1" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
            </div>
            <div><label className="text-sm font-medium text-foreground">状态</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Organization['status'] }))}>
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
