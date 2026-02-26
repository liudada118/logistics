// 系统管理 - 用户管理
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { userApi, baseDataApi } from '@/lib/api';
import { Plus, Search, Pencil, Trash2, KeyRound, Users, Shield, ShieldCheck, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const roleOptions = [
  { value: 'admin', label: '管理员', icon: ShieldCheck },
  { value: 'operator', label: '操作员', icon: Briefcase },
  { value: 'finance', label: '财务', icon: Shield },
];

const roleColor: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  operator: 'bg-blue-100 text-blue-700',
  finance: 'bg-emerald-100 text-emerald-700',
};

const roleLabel: Record<string, string> = {
  admin: '管理员',
  operator: '操作员',
  finance: '财务',
};

export default function UserManage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [form, setForm] = useState({ username: '', fullName: '', phone: '', role: 'operator', orgId: 0, password: '' });
  const [resetDialog, setResetDialog] = useState<{ open: boolean; userId: number; username: string }>({ open: false, userId: 0, username: '' });
  const [newPassword, setNewPassword] = useState('123456');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userApi.list({
        page,
        size: 20,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        keyword: search || undefined,
      });
      setUsers(result.records);
      setTotal(result.total);
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    baseDataApi.allOrgs().then(setOrgs).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', fullName: '', phone: '', role: 'operator', orgId: 0, password: '123456' });
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({ username: user.username, fullName: user.fullName || '', phone: user.phone || '', role: user.role, orgId: user.orgId || 0, password: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.fullName.trim()) {
      toast.error('用户名和姓名不能为空');
      return;
    }
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, {
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          orgId: form.orgId || null,
        });
        toast.success('更新成功');
      } else {
        await userApi.create({
          username: form.username,
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          orgId: form.orgId || null,
          password: form.password || '123456',
        });
        toast.success('创建成功');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await userApi.resetPassword(resetDialog.userId, newPassword);
      toast.success('密码重置成功');
      setResetDialog({ open: false, userId: 0, username: '' });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await userApi.delete(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">用户管理</h1>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />新增用户
          </Button>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索用户名/姓名/手机号..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
          </div>
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="角色" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 表格 */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">用户名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">手机号</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">所属网点</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{u.username}</td>
                    <td className="px-4 py-2.5">{u.fullName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{u.phone || '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{u.orgName || '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.status === 1 ? '正常' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="编辑">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setResetDialog({ open: true, userId: u.id, username: u.username })} className="p-1.5 rounded hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors" title="重置密码">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">{loading ? '加载中...' : '暂无用户数据'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">共 {total} 条</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">用户名</label>
              <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editingUser} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">姓名</label>
              <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">手机号</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">角色</label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">所属网点</label>
              <Select value={String(form.orgId)} onValueChange={v => setForm({ ...form, orgId: Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择网点" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">无</SelectItem>
                  {orgs.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editingUser && (
              <div>
                <label className="text-sm font-medium text-foreground">初始密码</label>
                <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="默认 123456" className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingUser ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={resetDialog.open} onOpenChange={() => setResetDialog({ open: false, userId: 0, username: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码 - {resetDialog.username}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground">新密码</label>
            <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog({ open: false, userId: 0, username: '' })}>取消</Button>
            <Button onClick={handleResetPassword}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">此操作不可撤销，确定要删除该用户吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
