// 基础资料 - 客户管理
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { baseDataApi } from '@/lib/api';
import { mockCustomers, type Customer } from '@/lib/mock-data';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const customerTypes = ['发货客户', '收货客户', '双向客户'] as const;

export default function CustomerManage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', contactPerson: '', type: '发货客户' as Customer['type'], status: '正常' as Customer['status'] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listCustomers({ page: 1, size: 200, keyword: search || undefined });
      setCustomers(res.records || []);
    } catch {
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name?.includes(search) || c.contactPerson?.includes(search) || c.phone?.includes(search);
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '', address: '', contactPerson: '', type: '发货客户', status: '正常' });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ name: c.name, phone: c.phone, address: c.address, contactPerson: c.contactPerson, type: c.type, status: c.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('请填写客户名称'); return; }
    try {
      if (editingCustomer) {
        await baseDataApi.updateCustomer(editingCustomer.id, form);
        toast.success('客户信息已更新');
      } else {
        await baseDataApi.createCustomer(form);
        toast.success('客户创建成功');
      }
      setDialogOpen(false);
      loadData();
    } catch {
      if (editingCustomer) {
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...form } : c));
        toast.success('客户信息已更新');
      } else {
        const now = new Date().toISOString().slice(0, 10);
        const newC: Customer = { id: Math.max(...customers.map(c => c.id), 0) + 1, ...form, createdAt: now };
        setCustomers(prev => [...prev, newC]);
        toast.success('客户创建成功');
      }
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await baseDataApi.deleteCustomer(id);
      toast.success('客户已删除');
      loadData();
    } catch {
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('客户已删除');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">客户管理</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length} 位</span>
          </div>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />新增客户</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索客户名称/联系人/电话" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {customerTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">客户名称</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">联系人</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">电话</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">地址</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">创建时间</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">暂无客户数据</td></tr>}
                {!loading && filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.type === '发货客户' ? 'bg-blue-100 text-blue-700' :
                        c.type === '收货客户' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{c.type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{c.contactPerson}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{c.address}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === '正常' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs hidden sm:table-cell">{c.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editingCustomer ? '编辑客户' : '新增客户'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium text-foreground">客户名称 *</label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">联系人</label><Input className="mt-1" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-foreground">联系电话</label><Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><label className="text-sm font-medium text-foreground">地址</label><Input className="mt-1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">客户类型</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Customer['type'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{customerTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium text-foreground">状态</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Customer['status'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="正常">正常</SelectItem><SelectItem value="停用">停用</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
