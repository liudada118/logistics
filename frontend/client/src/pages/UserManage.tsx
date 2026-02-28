import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Button } from '@/components/T9Modal';
import { userApi } from '@/lib/api';
import { Edit, Trash2, Lock } from 'lucide-react';

export default function UserManage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'operator', phone: '', email: '', status: '正常' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await userApi.list({ page: 1, size: 50, keyword: filterValues.keyword, role: filterValues.role });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm({ username: '', password: '', fullName: '', role: 'operator', phone: '', email: '', status: '正常' }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ username: item.username || '', password: '', fullName: item.fullName || '', role: item.role || 'operator', phone: item.phone || '', email: item.email || '', status: item.status || '正常' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.fullName) { alert('请填写用户名和姓名'); return; }
    if (!editItem && !form.password) { alert('请填写密码'); return; }
    try {
      if (editItem) { await userApi.update(editItem.id, form); }
      else { await userApi.create(form); }
      setShowModal(false); loadData();
    } catch (e: any) { alert(e.message || '保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该用户吗？')) return;
    try { await userApi.delete(id); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const handleResetPwd = async (id: number) => {
    if (!confirm('确定要重置密码为123456吗？')) return;
    try { await userApi.resetPassword(id, '123456'); alert('密码已重置为123456'); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { admin: '系统管理员', operator: '操作员', finance: '财务', driver: '司机', customer: '客户' };
    return map[role] || role;
  };

  const columns: Column[] = [
    { key: 'username', title: '用户名', width: '100px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'fullName', title: '姓名', width: '80px' },
    { key: 'role', title: '角色', width: '100px', render: (v) => {
      const c = v === 'admin' ? 'text-red-600' : v === 'finance' ? 'text-purple-600' : 'text-blue-600';
      return <span className={c}>{roleLabel(v)}</span>;
    }},
    { key: 'phone', title: '电话', width: '120px' },
    { key: 'email', title: '邮箱', width: '160px' },
    { key: 'orgName', title: '所属网点', width: '100px' },
    { key: 'status', title: '状态', width: '70px', render: (v) => <span className={v === '正常' ? 'text-green-600' : 'text-red-600'}>{v || '-'}</span> },
    { key: 'lastLoginTime', title: '最后登录', width: '140px', render: (v) => v || '-' },
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '130px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 p-0.5" title="编辑"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleResetPwd(row.id)} className="text-orange-500 hover:text-orange-700 p-0.5" title="重置密码"><Lock className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 p-0.5" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '用户名/姓名/电话' },
    { key: 'role', label: '角色', type: 'select', options: [
      { label: '管理员', value: 'admin' }, { label: '操作员', value: 'operator' },
      { label: '财务', value: 'finance' }, { label: '司机', value: 'driver' },
    ]},
  ];

  return (
    <>
      <T9TablePage title="用户管理" columns={columns} data={data} loading={loading} total={total}
        filters={filters} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData} onRefresh={loadData} onAdd={openCreate} addLabel="新增用户" />
      <T9Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? '编辑用户' : '新增用户'} width="500px"
        footer={<><T9Button onClick={() => setShowModal(false)}>取消</T9Button><T9Button variant="primary" onClick={handleSave}>保存</T9Button></>}>
        <T9FormRow label="用户名" required><T9Input value={form.username} onChange={(e: any) => setForm(p => ({ ...p, username: e.target.value }))} placeholder="用户名" disabled={!!editItem} /></T9FormRow>
        {!editItem && <T9FormRow label="密码" required><T9Input type="password" value={form.password} onChange={(e: any) => setForm(p => ({ ...p, password: e.target.value }))} placeholder="密码" /></T9FormRow>}
        <T9FormRow label="姓名" required><T9Input value={form.fullName} onChange={(e: any) => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="姓名" /></T9FormRow>
        <T9FormRow label="角色"><T9Select value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} options={[{ label: '管理员', value: 'admin' }, { label: '操作员', value: 'operator' }, { label: '财务', value: 'finance' }, { label: '司机', value: 'driver' }]} /></T9FormRow>
        <T9FormRow label="电话"><T9Input value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="电话" /></T9FormRow>
        <T9FormRow label="邮箱"><T9Input value={form.email} onChange={(e: any) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="邮箱" /></T9FormRow>
        <T9FormRow label="状态"><T9Select value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={[{ label: '正常', value: '正常' }, { label: '停用', value: '停用' }]} /></T9FormRow>
      </T9Modal>
    </>
  );
}
