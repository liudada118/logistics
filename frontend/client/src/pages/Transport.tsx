import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Select, T9Button } from '@/components/T9Modal';
import { transportApi, baseDataApi, waybillApi } from '@/lib/api';
import { Truck, CheckCircle, Play, MapPin, Plus } from 'lucide-react';

export default function Transport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ routeId: '', vehicleId: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await transportApi.list({ page: 1, size: 50, status: filterValues.status, keyword: filterValues.keyword });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const openCreate = async () => {
    try {
      const [r, v] = await Promise.all([baseDataApi.allRoutes(), baseDataApi.availableVehicles()]);
      setRoutes(r || []); setVehicles(v || []);
    } catch {}
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.routeId || !createForm.vehicleId) { alert('请选择线路和车辆'); return; }
    try {
      await transportApi.create({ routeId: Number(createForm.routeId), vehicleId: Number(createForm.vehicleId), waybillIds: [] });
      setShowCreate(false);
      setCreateForm({ routeId: '', vehicleId: '' });
      loadData();
    } catch (e: any) { alert(e.message || '创建失败'); }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'loading') await transportApi.confirmLoading(id);
      else if (action === 'depart') await transportApi.confirmDeparture(id);
      else if (action === 'arrive') await transportApi.confirmArrival(id);
      loadData();
    } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = { '待装车': 'text-yellow-600', '已装车': 'text-blue-600', '运输中': 'text-orange-600', '已到达': 'text-green-600' };
    return map[status] || 'text-gray-600';
  };

  const columns: Column[] = [
    { key: 'status', title: '状态', width: '80px', render: (v) => <span className={`font-medium ${statusColor(v)}`}>{v || '-'}</span> },
    { key: 'taskNo', title: '任务编号', width: '140px', render: (v) => <span className="font-mono text-blue-600">{v || '-'}</span> },
    { key: 'routeName', title: '线路', width: '150px' },
    { key: 'vehiclePlate', title: '车牌号', width: '100px' },
    { key: 'driverName', title: '司机', width: '80px' },
    { key: 'waybillCount', title: '运单数', width: '70px', align: 'right' },
    { key: 'totalWeight', title: '总重量(kg)', width: '90px', align: 'right' },
    { key: 'departureTime', title: '发车时间', width: '140px', render: (v) => v || '-' },
    { key: 'arrivalTime', title: '到达时间', width: '140px', render: (v) => v || '-' },
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '160px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        {row.status === '待装车' && <button onClick={() => handleAction(row.id, 'loading')} className="text-xs text-blue-600 hover:underline">确认装车</button>}
        {row.status === '已装车' && <button onClick={() => handleAction(row.id, 'depart')} className="text-xs text-orange-600 hover:underline">确认发车</button>}
        {row.status === '运输中' && <button onClick={() => handleAction(row.id, 'arrive')} className="text-xs text-green-600 hover:underline">确认到达</button>}
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '任务编号/车牌号' },
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '待装车', value: '待装车' }, { label: '已装车', value: '已装车' },
      { label: '运输中', value: '运输中' }, { label: '已到达', value: '已到达' },
    ]},
  ];

  return (
    <>
      <T9TablePage
        title="到货确认"
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData}
        onRefresh={loadData}
        onAdd={openCreate}
        addLabel="创建任务"
        selectedRows={selectedRows}
        onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
        onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      />
      <T9Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建运输任务" width="450px"
        footer={<><T9Button onClick={() => setShowCreate(false)}>取消</T9Button><T9Button variant="primary" onClick={handleCreate}>确定</T9Button></>}>
        <T9FormRow label="选择线路" required>
          <T9Select value={createForm.routeId} onChange={v => setCreateForm(p => ({ ...p, routeId: v }))}
            options={routes.map(r => ({ label: r.name, value: String(r.id) }))} placeholder="请选择线路" />
        </T9FormRow>
        <T9FormRow label="选择车辆" required>
          <T9Select value={createForm.vehicleId} onChange={v => setCreateForm(p => ({ ...p, vehicleId: v }))}
            options={vehicles.map(v => ({ label: `${v.plateNumber} - ${v.driverName || ''}`, value: String(v.id) }))} placeholder="请选择车辆" />
        </T9FormRow>
      </T9Modal>
    </>
  );
}
