import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Button } from '@/components/T9Modal';
import { baseDataApi } from '@/lib/api';
import { Edit, Trash2 } from 'lucide-react';

export default function RouteManage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', originId: '', destId: '', distance: '', estimatedHours: '', status: '正常' });

  useEffect(() => { loadData(); baseDataApi.allOrgs().then(setOrgs).catch(() => {}); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listRoutes({ page: 1, size: 50, keyword: filterValues.keyword });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm({ name: '', originId: '', destId: '', distance: '', estimatedHours: '', status: '正常' }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name || '', originId: String(item.originId || ''), destId: String(item.destId || ''), distance: String(item.distance || ''), estimatedHours: String(item.estimatedHours || ''), status: item.status || '正常' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { alert('请填写线路名称'); return; }
    try {
      const payload = { ...form, originId: Number(form.originId) || undefined, destId: Number(form.destId) || undefined, distance: parseFloat(form.distance) || undefined, estimatedHours: parseFloat(form.estimatedHours) || undefined };
      if (editItem) { await baseDataApi.updateRoute(editItem.id, payload); }
      else { await baseDataApi.createRoute(payload); }
      setShowModal(false); loadData();
    } catch (e: any) { alert(e.message || '保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该线路吗？')) return;
    try { await baseDataApi.deleteRoute(id); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const columns: Column[] = [
    { key: 'name', title: '线路名称', width: '180px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'originName', title: '始发站', width: '100px' },
    { key: 'destName', title: '终到站', width: '100px' },
    { key: 'distance', title: '距离(km)', width: '90px', align: 'right' },
    { key: 'estimatedHours', title: '预计时长(h)', width: '100px', align: 'right' },
    { key: 'status', title: '状态', width: '70px', render: (v) => <span className={v === '正常' ? 'text-green-600' : 'text-red-600'}>{v || '-'}</span> },
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '100px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 p-0.5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const filters: FilterItem[] = [{ key: 'keyword', label: '关键字', type: 'text', placeholder: '线路名称/站点' }];

  return (
    <>
      <T9TablePage title="线路管理" columns={columns} data={data} loading={loading} total={total}
        filters={filters} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData} onRefresh={loadData} onAdd={openCreate} addLabel="新增线路" />
      <T9Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? '编辑线路' : '新增线路'} width="500px"
        footer={<><T9Button onClick={() => setShowModal(false)}>取消</T9Button><T9Button variant="primary" onClick={handleSave}>保存</T9Button></>}>
        <T9FormRow label="线路名称" required><T9Input value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="线路名称" /></T9FormRow>
        <T9FormRow label="始发站"><T9Select value={form.originId} onChange={v => setForm(p => ({ ...p, originId: v }))} options={orgs.map(o => ({ label: o.name, value: String(o.id) }))} placeholder="选择始发站" /></T9FormRow>
        <T9FormRow label="终到站"><T9Select value={form.destId} onChange={v => setForm(p => ({ ...p, destId: v }))} options={orgs.map(o => ({ label: o.name, value: String(o.id) }))} placeholder="选择终到站" /></T9FormRow>
        <T9FormRow label="距离(km)"><T9Input type="number" value={form.distance} onChange={(e: any) => setForm(p => ({ ...p, distance: e.target.value }))} placeholder="公里数" /></T9FormRow>
        <T9FormRow label="预计时长(h)"><T9Input type="number" value={form.estimatedHours} onChange={(e: any) => setForm(p => ({ ...p, estimatedHours: e.target.value }))} placeholder="小时" /></T9FormRow>
        <T9FormRow label="状态"><T9Select value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={[{ label: '正常', value: '正常' }, { label: '停用', value: '停用' }]} /></T9FormRow>
      </T9Modal>
    </>
  );
}
