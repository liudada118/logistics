import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Select, T9Button } from '@/components/T9Modal';
import { transportApi, baseDataApi, waybillApi } from '@/lib/api';
import { Truck, CheckCircle, Package, MapPin, Clock } from 'lucide-react';

export default function Transport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // 创建派车单
  const [showCreate, setShowCreate] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ routeId: '', vehicleId: '' });

  // 分配运单
  const [showAssign, setShowAssign] = useState(false);
  const [assignTask, setAssignTask] = useState<any>(null);
  const [pendingWaybills, setPendingWaybills] = useState<any[]>([]);
  const [selectedWaybills, setSelectedWaybills] = useState<Set<number>>(new Set());
  const [waybillLoading, setWaybillLoading] = useState(false);

  // 派车单详情
  const [showDetail, setShowDetail] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);

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
    setCreateForm({ routeId: '', vehicleId: '' });
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

  const openAssign = async (task: any) => {
    setAssignTask(task);
    setSelectedWaybills(new Set());
    setWaybillLoading(true);
    setShowAssign(true);
    try {
      const res = await waybillApi.list({ page: 1, size: 100, status: '待调度' });
      setPendingWaybills(res.records || []);
    } catch { setPendingWaybills([]); } finally { setWaybillLoading(false); }
  };

  const handleAssign = async () => {
    if (selectedWaybills.size === 0) { alert('请选择要分配的运单'); return; }
    try {
      await transportApi.assignWaybills(assignTask.id, Array.from(selectedWaybills));
      setShowAssign(false);
      loadData();
      alert(`成功分配 ${selectedWaybills.size} 票运单到派车单 ${assignTask.taskNo}`);
    } catch (e: any) { alert(e.message || '分配失败'); }
  };

  const handleAction = async (id: number, action: string) => {
    const labels: Record<string, string> = { loading: '装车', depart: '发车', arrive: '到达' };
    if (!confirm(`确认${labels[action]}？`)) return;
    try {
      if (action === 'loading') await transportApi.confirmLoading(id);
      else if (action === 'depart') await transportApi.confirmDeparture(id);
      else if (action === 'arrive') await transportApi.confirmArrival(id);
      loadData();
    } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const statusConfig: Record<string, { color: string; bg: string }> = {
    '待装车': { color: 'text-orange-600', bg: 'bg-orange-50' },
    '已装车': { color: 'text-blue-600', bg: 'bg-blue-50' },
    '运输中': { color: 'text-purple-600', bg: 'bg-purple-50' },
    '已到达': { color: 'text-green-600', bg: 'bg-green-50' },
  };

  const columns: Column[] = [
    { key: 'status', title: '状态', width: '80px', render: (v) => {
      const cfg = statusConfig[v] || { color: 'text-gray-600', bg: 'bg-gray-50' };
      return <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>{v || '-'}</span>;
    }},
    { key: 'taskNo', title: '任务编号', width: '150px', render: (v, row) => (
      <button onClick={() => { setDetailTask(row); setShowDetail(true); }} className="font-mono text-blue-600 hover:underline text-xs">{v || '-'}</button>
    )},
    { key: 'routeName', title: '线路', width: '160px', render: (v) => (
      <span className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3 text-gray-400 shrink-0" />{v || '-'}</span>
    )},
    { key: 'vehiclePlate', title: '车牌号', width: '100px', render: (v) => (
      <span className="flex items-center gap-1 text-xs"><Truck className="w-3 h-3 text-gray-400 shrink-0" />{v || '-'}</span>
    )},
    { key: 'driverName', title: '司机', width: '80px' },
    { key: 'waybillCount', title: '运单数', width: '70px', align: 'right', render: (v) => (
      <span className="font-medium text-blue-600">{v || 0}</span>
    )},
    { key: 'totalWeight', title: '总重(kg)', width: '80px', align: 'right', render: (v) => v ? Number(v).toFixed(1) : '-' },
    { key: 'departureTime', title: '发车时间', width: '140px', render: (v) => v ? (
      <span className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3 text-gray-400" />{v}</span>
    ) : '-' },
    { key: 'arrivedAt', title: '到达时间', width: '140px', render: (v) => v || '-' },
    { key: 'createdAt', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '200px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {row.status === '待装车' && (
          <>
            <button onClick={() => openAssign(row)} className="text-xs text-purple-600 hover:underline">分配运单</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => handleAction(row.id, 'loading')} className="text-xs text-blue-600 hover:underline">确认装车</button>
          </>
        )}
        {row.status === '已装车' && (
          <button onClick={() => handleAction(row.id, 'depart')} className="text-xs text-orange-600 hover:underline">确认发车</button>
        )}
        {row.status === '运输中' && (
          <button onClick={() => handleAction(row.id, 'arrive')} className="text-xs text-green-600 hover:underline">确认到达</button>
        )}
        {row.status !== '待装车' && row.status !== '已装车' && row.status !== '运输中' && (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '任务编号/车牌号/司机' },
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '待装车', value: '待装车' }, { label: '已装车', value: '已装车' },
      { label: '运输中', value: '运输中' }, { label: '已到达', value: '已到达' },
    ]},
  ];

  const stats = [
    { label: '待装车', value: data.filter(d => d.status === '待装车').length, color: 'text-orange-600', bg: 'bg-orange-50', icon: Package },
    { label: '已装车', value: data.filter(d => d.status === '已装车').length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Truck },
    { label: '运输中', value: data.filter(d => d.status === '运输中').length, color: 'text-purple-600', bg: 'bg-purple-50', icon: MapPin },
    { label: '已到达', value: data.filter(d => d.status === '已到达').length, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  ];

  return (
    <>
      <T9TablePage
        title="运输任务管理（到货确认）"
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
        addLabel="创建派车单"
        selectedRows={selectedRows}
        onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
        onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      >
        <div className="mx-3 mb-0">
          <div className="bg-white border border-gray-200 border-b-0 px-3 py-2 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className={`${s.bg} rounded px-3 py-2 flex items-center gap-2`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </T9TablePage>

      {/* 创建派车单弹窗 */}
      <T9Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建派车单" width="450px"
        footer={<><T9Button onClick={() => setShowCreate(false)}>取消</T9Button><T9Button variant="primary" onClick={handleCreate}>确定创建</T9Button></>}>
        <T9FormRow label="选择线路" required>
          <T9Select value={createForm.routeId} onChange={v => setCreateForm(p => ({ ...p, routeId: v }))}
            options={routes.map(r => ({ label: r.name, value: String(r.id) }))} placeholder="请选择线路" />
        </T9FormRow>
        <T9FormRow label="选择车辆" required>
          <T9Select value={createForm.vehicleId} onChange={v => setCreateForm(p => ({ ...p, vehicleId: v }))}
            options={vehicles.map(v => ({ label: `${v.plateNumber} - ${v.driverName || '无司机'}`, value: String(v.id) }))} placeholder="请选择车辆" />
        </T9FormRow>
        <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
          创建派车单后，可在列表中点击"分配运单"将待调度运单加入此派车单。
        </div>
      </T9Modal>

      {/* 分配运单弹窗 */}
      <T9Modal open={showAssign} onClose={() => setShowAssign(false)} title={`分配运单 → ${assignTask?.taskNo || ''}`} width="820px"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-500">已选 <strong className="text-blue-600">{selectedWaybills.size}</strong> 票运单</span>
            <div className="flex gap-2">
              <T9Button onClick={() => setShowAssign(false)}>取消</T9Button>
              <T9Button variant="primary" onClick={handleAssign}>确认分配</T9Button>
            </div>
          </div>
        }>
        <div className="text-xs text-gray-500 mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          以下为"待调度"状态的运单，勾选后点击确认分配，运单状态将变为"运输中"。
        </div>
        {waybillLoading ? (
          <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
        ) : pendingWaybills.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">暂无待调度运单</div>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 px-2 py-2 text-center">
                    <input type="checkbox"
                      checked={selectedWaybills.size === pendingWaybills.length && pendingWaybills.length > 0}
                      onChange={() => setSelectedWaybills(prev =>
                        prev.size === pendingWaybills.length ? new Set() : new Set(pendingWaybills.map((w: any) => w.id))
                      )} />
                  </th>
                  <th className="px-2 py-2 text-left text-gray-600 font-medium">运单号</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-medium">发站</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-medium">到站</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-medium">发货人</th>
                  <th className="px-2 py-2 text-left text-gray-600 font-medium">收货人</th>
                  <th className="px-2 py-2 text-right text-gray-600 font-medium">件数</th>
                  <th className="px-2 py-2 text-right text-gray-600 font-medium">重量(kg)</th>
                  <th className="px-2 py-2 text-right text-gray-600 font-medium">运费</th>
                </tr>
              </thead>
              <tbody>
                {pendingWaybills.map((w: any) => (
                  <tr key={w.id}
                    className={`border-t border-gray-100 hover:bg-blue-50 cursor-pointer ${selectedWaybills.has(w.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedWaybills(prev => {
                      const n = new Set(prev);
                      if (n.has(w.id)) n.delete(w.id); else n.add(w.id);
                      return n;
                    })}>
                    <td className="px-2 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedWaybills.has(w.id)}
                        onChange={() => setSelectedWaybills(prev => {
                          const n = new Set(prev);
                          if (n.has(w.id)) n.delete(w.id); else n.add(w.id);
                          return n;
                        })} />
                    </td>
                    <td className="px-2 py-1.5 font-mono text-blue-600">{w.waybillNo}</td>
                    <td className="px-2 py-1.5">{w.originOrgName || '-'}</td>
                    <td className="px-2 py-1.5">{w.destOrgName || '-'}</td>
                    <td className="px-2 py-1.5">{w.senderName}</td>
                    <td className="px-2 py-1.5">{w.receiverName}</td>
                    <td className="px-2 py-1.5 text-right">{w.quantity}</td>
                    <td className="px-2 py-1.5 text-right">{w.weight}</td>
                    <td className="px-2 py-1.5 text-right text-red-600 font-medium">¥{Number(w.freightFee || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </T9Modal>

      {/* 派车单详情弹窗 */}
      <T9Modal open={showDetail} onClose={() => setShowDetail(false)} title={`派车单详情 - ${detailTask?.taskNo || ''}`} width="580px"
        footer={<T9Button onClick={() => setShowDetail(false)}>关闭</T9Button>}>
        {detailTask && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '任务编号', value: <span className="font-mono font-medium text-blue-600">{detailTask.taskNo}</span> },
                { label: '当前状态', value: <span className={`font-medium ${statusConfig[detailTask.status]?.color || 'text-gray-600'}`}>{detailTask.status}</span> },
                { label: '运输线路', value: detailTask.routeName || '-' },
                { label: '车辆/司机', value: `${detailTask.vehiclePlate || '-'} / ${detailTask.driverName || '-'}` },
                { label: '运单数量', value: <span className="font-medium text-blue-600">{detailTask.waybillCount || 0} 票</span> },
                { label: '总重量', value: detailTask.totalWeight ? `${Number(detailTask.totalWeight).toFixed(1)} kg` : '-' },
                { label: '发车时间', value: detailTask.departureTime || '未发车' },
                { label: '到达时间', value: detailTask.arrivedAt || '未到达' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="font-medium">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">创建时间</div>
              <div className="font-medium">{detailTask.createdAt || '-'}</div>
            </div>
          </div>
        )}
      </T9Modal>
    </>
  );
}
