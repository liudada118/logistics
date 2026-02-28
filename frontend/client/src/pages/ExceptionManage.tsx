import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Textarea, T9Button } from '@/components/T9Modal';
import { exceptionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ExceptionManage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showHandle, setShowHandle] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ waybillNo: '', exceptionType: '问题件', description: '' });
  const [handleForm, setHandleForm] = useState({ handleResult: '', handleAmount: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await exceptionApi.list({ page: 1, size: 50, keyword: filterValues.keyword, exceptionType: filterValues.exceptionType, handleStatus: filterValues.handleStatus });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!createForm.waybillNo || !createForm.description) { alert('请填写完整信息'); return; }
    try {
      await exceptionApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ waybillNo: '', exceptionType: '问题件', description: '' });
      loadData();
    } catch (e: any) { alert(e.message || '上报失败'); }
  };

  const handleProcess = async () => {
    if (!handleForm.handleResult) { alert('请填写处理结果'); return; }
    try {
      await exceptionApi.handle(showHandle.id, {
        handleResult: handleForm.handleResult,
        handleAmount: handleForm.handleAmount ? Number(handleForm.handleAmount) : undefined,
        handlerId: user?.id,
        handlerName: user?.fullName,
      });
      setShowHandle(null);
      setHandleForm({ handleResult: '', handleAmount: '' });
      loadData();
    } catch (e: any) { alert(e.message || '处理失败'); }
  };

  const handleClose = async (id: number) => {
    if (!confirm('确定要关闭该异常吗？')) return;
    try { await exceptionApi.close(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const typeColor = (type: string) => {
    const map: Record<string, string> = { '问题件': 'text-orange-600', '无头件': 'text-purple-600', '弃货': 'text-red-600', '理赔': 'text-blue-600', '破损': 'text-yellow-600', '丢失': 'text-red-700' };
    return map[type] || 'text-gray-600';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { '待处理': 'bg-red-100 text-red-700', '处理中': 'bg-yellow-100 text-yellow-700', '已处理': 'bg-green-100 text-green-700', '已关闭': 'bg-gray-100 text-gray-600' };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const columns: Column[] = [
    { key: 'handleStatus', title: '状态', width: '80px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge(v)}`}>{v || '-'}</span> },
    { key: 'exceptionType', title: '异常类型', width: '80px', render: (v) => <span className={`font-medium ${typeColor(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '130px', render: (v) => <span className="text-blue-600 font-mono">{v || '-'}</span> },
    { key: 'description', title: '异常描述', width: '200px', render: (v) => <span className="max-w-[200px] truncate block">{v || '-'}</span> },
    { key: 'reporterName', title: '上报人', width: '80px' },
    { key: 'reportTime', title: '上报时间', width: '140px', render: (v) => v || '-' },
    { key: 'handlerName', title: '处理人', width: '80px' },
    { key: 'handleResult', title: '处理结果', width: '150px', render: (v) => <span className="max-w-[150px] truncate block">{v || '-'}</span> },
    { key: 'handleAmount', title: '赔付金额', width: '90px', align: 'right', render: (v) => v ? `¥${v}` : '-' },
    { key: 'handleTime', title: '处理时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '120px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-2">
        {(row.handleStatus === '待处理' || row.handleStatus === '处理中') && (
          <button onClick={() => { setShowHandle(row); setHandleForm({ handleResult: '', handleAmount: '' }); }} className="text-xs text-blue-600 hover:underline">处理</button>
        )}
        {row.handleStatus === '已处理' && (
          <button onClick={() => handleClose(row.id)} className="text-xs text-gray-600 hover:underline">关闭</button>
        )}
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/描述' },
    { key: 'exceptionType', label: '异常类型', type: 'select', options: [
      { label: '问题件', value: '问题件' }, { label: '无头件', value: '无头件' },
      { label: '弃货', value: '弃货' }, { label: '理赔', value: '理赔' },
      { label: '破损', value: '破损' }, { label: '丢失', value: '丢失' },
    ]},
    { key: 'handleStatus', label: '处理状态', type: 'select', options: [
      { label: '待处理', value: '待处理' }, { label: '处理中', value: '处理中' },
      { label: '已处理', value: '已处理' }, { label: '已关闭', value: '已关闭' },
    ]},
  ];

  return (
    <>
      <T9TablePage
        title="异常登记"
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData}
        onRefresh={loadData}
        onAdd={() => setShowCreate(true)}
        addLabel="异常上报"
        selectedRows={selectedRows}
        onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
        onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      />

      {/* 异常上报弹窗 */}
      <T9Modal open={showCreate} onClose={() => setShowCreate(false)} title="异常上报" width="500px"
        footer={<><T9Button onClick={() => setShowCreate(false)}>取消</T9Button><T9Button variant="primary" onClick={handleCreate}>确认上报</T9Button></>}>
        <T9FormRow label="运单号" required>
          <T9Input value={createForm.waybillNo} onChange={(e: any) => setCreateForm(p => ({ ...p, waybillNo: e.target.value }))} placeholder="请输入运单号" />
        </T9FormRow>
        <T9FormRow label="异常类型" required>
          <T9Select value={createForm.exceptionType} onChange={v => setCreateForm(p => ({ ...p, exceptionType: v }))}
            options={[{ label: '问题件', value: '问题件' }, { label: '无头件', value: '无头件' }, { label: '弃货', value: '弃货' }, { label: '理赔', value: '理赔' }, { label: '破损', value: '破损' }, { label: '丢失', value: '丢失' }]} />
        </T9FormRow>
        <T9FormRow label="异常描述" required>
          <T9Textarea value={createForm.description} onChange={(e: any) => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="请详细描述异常情况" rows={4} />
        </T9FormRow>
      </T9Modal>

      {/* 处理弹窗 */}
      <T9Modal open={!!showHandle} onClose={() => setShowHandle(null)} title="处理异常" width="500px"
        footer={<><T9Button onClick={() => setShowHandle(null)}>取消</T9Button><T9Button variant="primary" onClick={handleProcess}>确认处理</T9Button></>}>
        {showHandle && (
          <>
            <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
              <div className="text-gray-500">运单号: <span className="text-blue-600 font-mono">{showHandle.waybillNo}</span></div>
              <div className="text-gray-500 mt-1">异常类型: <span className={typeColor(showHandle.exceptionType)}>{showHandle.exceptionType}</span></div>
              <div className="text-gray-500 mt-1">描述: {showHandle.description}</div>
            </div>
            <T9FormRow label="处理结果" required>
              <T9Textarea value={handleForm.handleResult} onChange={(e: any) => setHandleForm(p => ({ ...p, handleResult: e.target.value }))} placeholder="请输入处理结果" rows={3} />
            </T9FormRow>
            <T9FormRow label="赔付金额">
              <T9Input type="number" value={handleForm.handleAmount} onChange={(e: any) => setHandleForm(p => ({ ...p, handleAmount: e.target.value }))} placeholder="如需赔付请填写金额" />
            </T9FormRow>
          </>
        )}
      </T9Modal>
    </>
  );
}
