import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Button } from '@/components/T9Modal';
import { baseDataApi } from '@/lib/api';
import { Edit, Trash2 } from 'lucide-react';

export default function VehicleManage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ plateNumber: '', type: '厢式货车', capacity: '', driverName: '', driverPhone: '', status: '可用' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await baseDataApi.listVehicles({ page: 1, size: 50, keyword: filterValues.keyword, status: filterValues.status });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditItem(null); setForm({ plateNumber: '', type: '厢式货车', capacity: '', driverName: '', driverPhone: '', status: '可用' }); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ plateNumber: item.plateNumber || '', type: item.type || '厢式货车', capacity: String(item.capacity || ''), driverName: item.driverName || '', driverPhone: item.driverPhone || '', status: item.status || '可用' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.plateNumber) { alert('请填写车牌号'); return; }
    try {
      const payload = { ...form, capacity: parseFloat(form.capacity) || undefined };
      if (editItem) { await baseDataApi.updateVehicle(editItem.id, payload); }
      else { await baseDataApi.createVehicle(payload); }
      setShowModal(false); loadData();
    } catch (e: any) { alert(e.message || '保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该车辆吗？')) return;
    try { await baseDataApi.deleteVehicle(id); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const columns: Column[] = [
    { key: 'plateNumber', title: '车牌号', width: '110px', render: (v) => <span className="font-mono font-medium text-blue-600">{v || '-'}</span> },
    { key: 'type', title: '车辆类型', width: '100px' },
    { key: 'capacity', title: '载重(吨)', width: '80px', align: 'right' },
    { key: 'driverName', title: '司机', width: '80px' },
    { key: 'driverPhone', title: '司机电话', width: '120px' },
    { key: 'status', title: '状态', width: '70px', render: (v) => {
      const c = v === '可用' ? 'text-green-600' : v === '运输中' ? 'text-orange-600' : 'text-red-600';
      return <span className={`font-medium ${c}`}>{v || '-'}</span>;
    }},
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '100px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(row)} className="text-blue-500 hover:text-blue-700 p-0.5"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '车牌号/司机' },
    { key: 'status', label: '状态', type: 'select', options: [{ label: '可用', value: '可用' }, { label: '运输中', value: '运输中' }, { label: '维修中', value: '维修中' }, { label: '停用', value: '停用' }] },
  ];

  return (
    <>
      <T9TablePage title="车辆管理" columns={columns} data={data} loading={loading} total={total}
        filters={filters} filterValues={filterValues} onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData} onRefresh={loadData} onAdd={openCreate} addLabel="新增车辆" />
      <T9Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? '编辑车辆' : '新增车辆'} width="500px"
        footer={<><T9Button onClick={() => setShowModal(false)}>取消</T9Button><T9Button variant="primary" onClick={handleSave}>保存</T9Button></>}>
        <T9FormRow label="车牌号" required><T9Input value={form.plateNumber} onChange={(e: any) => setForm(p => ({ ...p, plateNumber: e.target.value }))} placeholder="车牌号" /></T9FormRow>
        <T9FormRow label="车辆类型"><T9Select value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={[{ label: '厢式货车', value: '厢式货车' }, { label: '平板货车', value: '平板货车' }, { label: '冷藏车', value: '冷藏车' }, { label: '挂车', value: '挂车' }]} /></T9FormRow>
        <T9FormRow label="载重(吨)"><T9Input type="number" value={form.capacity} onChange={(e: any) => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="吨" /></T9FormRow>
        <T9FormRow label="司机姓名"><T9Input value={form.driverName} onChange={(e: any) => setForm(p => ({ ...p, driverName: e.target.value }))} placeholder="司机姓名" /></T9FormRow>
        <T9FormRow label="司机电话"><T9Input value={form.driverPhone} onChange={(e: any) => setForm(p => ({ ...p, driverPhone: e.target.value }))} placeholder="司机电话" /></T9FormRow>
        <T9FormRow label="状态"><T9Select value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={[{ label: '可用', value: '可用' }, { label: '维修中', value: '维修中' }, { label: '停用', value: '停用' }]} /></T9FormRow>
      </T9Modal>
    </>
  );
}
