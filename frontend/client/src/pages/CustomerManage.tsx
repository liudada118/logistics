import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Textarea, T9Button } from '@/components/T9Modal';
import { baseDataApi } from '@/lib/api';
import { Edit, Trash2 } from 'lucide-react';

export default function CustomerManage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: '散客', contact: '', phone: '', address: '', payMethod: '现付', creditLimit: '', remark: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listCustomers({ page: 1, size: 50, keyword: filterValues.keyword });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm({ name: '', type: '散客', contact: '', phone: '', address: '', payMethod: '现付', creditLimit: '', remark: '' }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name || '', type: item.type || '散客', contact: item.contact || '', phone: item.phone || '', address: item.address || '', payMethod: item.payMethod || '现付', creditLimit: String(item.creditLimit || ''), remark: item.remark || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { alert('请填写客户名称'); return; }
    try {
      const payload = { ...form, creditLimit: parseFloat(form.creditLimit) || undefined };
      if (editItem) { await baseDataApi.updateCustomer(editItem.id, payload); }
      else { await baseDataApi.createCustomer(payload); }
      setShowModal(false); loadData();
    } catch (e: any) { alert(e.message || '保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该客户吗？')) return;
    try { await baseDataApi.deleteCustomer(id); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const columns: Column[] = [
    { key: 'name', title: '客户名称', width: '150px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'type', title: '客户类型', width: '80px', render: (v) => {
      const c = v === '月结客户' ? 'text-blue-600' : v === 'VIP' ? 'text-purple-600' : 'text-gray-600';
      return <span className={c}>{v || '-'}</span>;
    }},
    { key: 'contact', title: '联系人', width: '80px' },
    { key: 'phone', title: '联系电话', width: '120px' },
    { key: 'address', title: '地址', width: '200px', render: (v) => <span className="max-w-[200px] truncate block">{v || '-'}</span> },
    { key: 'payMethod', title: '付款方式', width: '80px' },
    { key: 'creditLimit', title: '信用额度', width: '90px', align: 'right', render: (v) => v ? `¥${Number(v).toLocaleString()}` : '-' },
    { key: 'totalOrders', title: '总单量', width: '70px', align: 'right' },
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '100px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 p-0.5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const filters: FilterItem[] = [{ key: 'keyword', label: '关键字', type: 'text', placeholder: '客户名称/联系人/电话' }];

  return (
    <>
      <T9TablePage title="客户管理" columns={columns} data={data} loading={loading} total={total}
        filters={filters} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData} onRefresh={loadData} onAdd={openCreate} addLabel="新增客户" />
      <T9Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? '编辑客户' : '新增客户'} width="500px"
        footer={<><T9Button onClick={() => setShowModal(false)}>取消</T9Button><T9Button variant="primary" onClick={handleSave}>保存</T9Button></>}>
        <T9FormRow label="客户名称" required><T9Input value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="客户名称" /></T9FormRow>
        <T9FormRow label="客户类型"><T9Select value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={[{ label: '散客', value: '散客' }, { label: '月结客户', value: '月结客户' }, { label: 'VIP', value: 'VIP' }, { label: '代理', value: '代理' }]} /></T9FormRow>
        <T9FormRow label="联系人"><T9Input value={form.contact} onChange={(e: any) => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="联系人" /></T9FormRow>
        <T9FormRow label="联系电话"><T9Input value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="联系电话" /></T9FormRow>
        <T9FormRow label="地址"><T9Input value={form.address} onChange={(e: any) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="地址" /></T9FormRow>
        <T9FormRow label="付款方式"><T9Select value={form.payMethod} onChange={v => setForm(p => ({ ...p, payMethod: v }))} options={[{ label: '现付', value: '现付' }, { label: '提付', value: '提付' }, { label: '月结', value: '月结' }]} /></T9FormRow>
        <T9FormRow label="信用额度"><T9Input type="number" value={form.creditLimit} onChange={(e: any) => setForm(p => ({ ...p, creditLimit: e.target.value }))} placeholder="信用额度" /></T9FormRow>
        <T9FormRow label="备注"><T9Textarea value={form.remark} onChange={(e: any) => setForm(p => ({ ...p, remark: e.target.value }))} placeholder="备注" /></T9FormRow>
      </T9Modal>
    </>
  );
}
