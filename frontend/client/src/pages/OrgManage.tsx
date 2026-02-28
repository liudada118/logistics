import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Textarea, T9Button } from '@/components/T9Modal';
import { baseDataApi } from '@/lib/api';
import { Edit, Trash2 } from 'lucide-react';

export default function OrgManage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', type: '网点', address: '', contact: '', phone: '', status: '正常' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listOrgs({ page: 1, size: 50, keyword: filterValues.keyword });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm({ name: '', code: '', type: '网点', address: '', contact: '', phone: '', status: '正常' }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name || '', code: item.code || '', type: item.type || '网点', address: item.address || '', contact: item.contact || '', phone: item.phone || '', status: item.status || '正常' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { alert('请填写网点名称'); return; }
    try {
      if (editItem) { await baseDataApi.updateOrg(editItem.id, form); }
      else { await baseDataApi.createOrg(form); }
      setShowModal(false); loadData();
    } catch (e: any) { alert(e.message || '保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该网点吗？')) return;
    try { await baseDataApi.deleteOrg(id); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const columns: Column[] = [
    { key: 'code', title: '网点编码', width: '100px', render: (v) => <span className="font-mono text-blue-600">{v || '-'}</span> },
    { key: 'name', title: '网点名称', width: '150px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'type', title: '类型', width: '80px' },
    { key: 'address', title: '地址', width: '200px', render: (v) => <span className="max-w-[200px] truncate block">{v || '-'}</span> },
    { key: 'contact', title: '联系人', width: '80px' },
    { key: 'phone', title: '联系电话', width: '120px' },
    { key: 'status', title: '状态', width: '70px', render: (v) => <span className={v === '正常' ? 'text-green-600' : 'text-red-600'}>{v || '-'}</span> },
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '100px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 p-0.5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '网点名称/编码/联系人' },
  ];

  return (
    <>
      <T9TablePage title="网点管理" columns={columns} data={data} loading={loading} total={total}
        filters={filters} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData} onRefresh={loadData} onAdd={openCreate} addLabel="新增网点" />
      <T9Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? '编辑网点' : '新增网点'} width="500px"
        footer={<><T9Button onClick={() => setShowModal(false)}>取消</T9Button><T9Button variant="primary" onClick={handleSave}>保存</T9Button></>}>
        <T9FormRow label="网点名称" required><T9Input value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="网点名称" /></T9FormRow>
        <T9FormRow label="网点编码"><T9Input value={form.code} onChange={(e: any) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="网点编码" /></T9FormRow>
        <T9FormRow label="类型"><T9Select value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={[{ label: '总部', value: '总部' }, { label: '分公司', value: '分公司' }, { label: '网点', value: '网点' }, { label: '代理', value: '代理' }]} /></T9FormRow>
        <T9FormRow label="地址"><T9Input value={form.address} onChange={(e: any) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="详细地址" /></T9FormRow>
        <T9FormRow label="联系人"><T9Input value={form.contact} onChange={(e: any) => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="联系人" /></T9FormRow>
        <T9FormRow label="联系电话"><T9Input value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="联系电话" /></T9FormRow>
        <T9FormRow label="状态"><T9Select value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={[{ label: '正常', value: '正常' }, { label: '停用', value: '停用' }]} /></T9FormRow>
      </T9Modal>
    </>
  );
}
