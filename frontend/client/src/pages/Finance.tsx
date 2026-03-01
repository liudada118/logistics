import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Select, T9Button, T9Input } from '@/components/T9Modal';
import { financeApi } from '@/lib/api';
import { useLocation } from 'wouter';
import { Calculator, Receipt, FileBarChart, DollarSign, TrendingUp, Wallet, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const tabs = [
  { key: '', label: '财务做账', icon: Calculator },
  { key: 'cod', label: '代收货款', icon: Receipt },
  { key: 'monthly', label: '月结对账', icon: FileBarChart },
];

export default function Finance() {
  const [location, navigate] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const activeTab = urlParams.get('tab') || '';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<any>(null);

  const [showCodVerify, setShowCodVerify] = useState(false);
  const [codItem, setCodItem] = useState<any>(null);
  const [codRemark, setCodRemark] = useState('');
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [monthlyItem, setMonthlyItem] = useState<any>(null);

  useEffect(() => {
    setSelectedRows(new Set());
    setFilterValues({});
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let type = filterValues.type;
      if (activeTab === 'cod') type = '代收货款';
      else if (activeTab === 'monthly') type = '月结';
      const [res, sum] = await Promise.all([
        financeApi.list({ page: 1, size: 50, keyword: filterValues.keyword, type, status: filterValues.status }),
        financeApi.summary().catch(() => null),
      ]);
      setData(res.records || []);
      setTotal(res.total || 0);
      setSummary(sum);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleSettle = async (id: number) => {
    if (!confirm('确认结算该笔费用？')) return;
    try { await financeApi.settle(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };
  const handleVerify = async (id: number) => {
    if (!confirm('确认审核通过？')) return;
    try { await financeApi.verify(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };
  const handleBatchSettle = async () => {
    if (selectedRows.size === 0) { alert('请先选择记录'); return; }
    if (!confirm(`确认批量结算 ${selectedRows.size} 条记录？`)) return;
    try { await financeApi.batchSettle(Array.from(selectedRows)); setSelectedRows(new Set()); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };
  const handleBatchVerify = async () => {
    if (selectedRows.size === 0) { alert('请先选择记录'); return; }
    if (!confirm(`确认批量审核 ${selectedRows.size} 条记录？`)) return;
    try { await financeApi.batchVerify(Array.from(selectedRows)); setSelectedRows(new Set()); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };
  const handleCodVerify = async () => {
    try { await financeApi.verify(codItem.id); setShowCodVerify(false); setCodItem(null); setCodRemark(''); loadData(); }
    catch (e: any) { alert(e.message || '核销失败'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      '待结算': 'bg-yellow-100 text-yellow-700', '已结算': 'bg-green-100 text-green-700',
      '已审核': 'bg-blue-100 text-blue-700', '已取消': 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };
  const typeColor = (type: string) => {
    const map: Record<string, string> = {
      '运费': 'text-blue-600', '送货费': 'text-green-600', '代收货款': 'text-orange-600',
      '保价费': 'text-purple-600', '包装费': 'text-cyan-600', '月结': 'text-indigo-600',
    };
    return map[type] || 'text-gray-600';
  };

  const accountColumns: Column[] = [
    { key: 'status', title: '状态', width: '80px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusBadge(v)}`}>{v || '-'}</span> },
    { key: 'type', title: '费用类型', width: '90px', render: (v) => <span className={`font-medium ${typeColor(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '140px', render: (v) => <span className="text-blue-600 font-mono text-xs">{v || '-'}</span> },
    { key: 'customerName', title: '客户', width: '100px' },
    { key: 'amount', title: '金额', width: '90px', align: 'right', render: (v) => v ? <span className="font-bold text-red-600">¥{Number(v).toFixed(2)}</span> : '-' },
    { key: 'paymentMethod', title: '付款方式', width: '80px', render: (v) => v || '-' },
    { key: 'originOrgName', title: '发站', width: '100px', render: (v) => v || '-' },
    { key: 'destOrgName', title: '到站', width: '100px', render: (v) => v || '-' },
    { key: 'settledAt', title: '结算时间', width: '140px', render: (v) => v || '-' },
    { key: 'verifiedAt', title: '审核时间', width: '140px', render: (v) => v || '-' },
    { key: 'operatorName', title: '操作人', width: '80px' },
    { key: 'createdAt', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: 'remark', title: '备注', width: '120px', render: (v) => <span className="text-gray-500 text-xs">{v || '-'}</span> },
    { key: '_action', title: '操作', width: '120px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        {row.status === '待结算' && <button onClick={() => handleSettle(row.id)} className="text-xs text-green-600 hover:underline">结算</button>}
        {row.status === '已结算' && <button onClick={() => handleVerify(row.id)} className="text-xs text-blue-600 hover:underline">审核</button>}
        {row.status === '已审核' && <span className="text-xs text-gray-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />完成</span>}
      </div>
    )},
  ];

  const codColumns: Column[] = [
    { key: 'status', title: '状态', width: '80px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusBadge(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '140px', render: (v) => <span className="text-blue-600 font-mono text-xs">{v || '-'}</span> },
    { key: 'customerName', title: '发货客户', width: '110px' },
    { key: 'amount', title: '代收金额', width: '100px', align: 'right', render: (v) => v ? <span className="font-bold text-orange-600">¥{Number(v).toFixed(2)}</span> : '-' },
    { key: 'originOrgName', title: '发站', width: '100px', render: (v) => v || '-' },
    { key: 'destOrgName', title: '到站', width: '100px', render: (v) => v || '-' },
    { key: 'createdAt', title: '开单时间', width: '140px', render: (v) => v || '-' },
    { key: 'settledAt', title: '收款时间', width: '140px', render: (v) => v || '-' },
    { key: 'verifiedAt', title: '核销时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '140px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        {row.status === '待结算' && <button onClick={() => handleSettle(row.id)} className="text-xs text-green-600 hover:underline">收款确认</button>}
        {row.status === '已结算' && <button onClick={() => { setCodItem(row); setShowCodVerify(true); }} className="text-xs text-blue-600 hover:underline">核销</button>}
        {row.status === '已审核' && <span className="text-xs text-gray-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />已核销</span>}
      </div>
    )},
  ];

  const monthlyColumns: Column[] = [
    { key: 'status', title: '状态', width: '80px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusBadge(v)}`}>{v || '-'}</span> },
    { key: 'customerName', title: '月结客户', width: '120px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '140px', render: (v) => <span className="text-blue-600 font-mono text-xs">{v || '-'}</span> },
    { key: 'amount', title: '月结金额', width: '100px', align: 'right', render: (v) => v ? <span className="font-bold text-indigo-600">¥{Number(v).toFixed(2)}</span> : '-' },
    { key: 'originOrgName', title: '发站', width: '100px', render: (v) => v || '-' },
    { key: 'destOrgName', title: '到站', width: '100px', render: (v) => v || '-' },
    { key: 'createdAt', title: '开单时间', width: '140px', render: (v) => v || '-' },
    { key: 'settledAt', title: '对账时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '160px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => { setMonthlyItem(row); setShowMonthlyDetail(true); }} className="text-xs text-purple-600 hover:underline">对账单</button>
        {row.status === '待结算' && <button onClick={() => handleSettle(row.id)} className="text-xs text-green-600 hover:underline">确认对账</button>}
        {row.status === '已结算' && <button onClick={() => handleVerify(row.id)} className="text-xs text-blue-600 hover:underline">审核</button>}
      </div>
    )},
  ];

  const currentColumns = activeTab === 'cod' ? codColumns : activeTab === 'monthly' ? monthlyColumns : accountColumns;

  const accountFilters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/客户名' },
    { key: 'type', label: '费用类型', type: 'select', options: [
      { label: '运费', value: '运费' }, { label: '送货费', value: '送货费' },
      { label: '代收货款', value: '代收货款' }, { label: '保价费', value: '保价费' }, { label: '包装费', value: '包装费' },
    ]},
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '待结算', value: '待结算' }, { label: '已结算', value: '已结算' },
      { label: '已审核', value: '已审核' }, { label: '已取消', value: '已取消' },
    ]},
  ];
  const codFilters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/客户名' },
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '待结算', value: '待结算' }, { label: '已结算', value: '已结算' }, { label: '已审核', value: '已审核' },
    ]},
  ];
  const monthlyFilters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '客户名/运单号' },
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '待结算', value: '待结算' }, { label: '已结算', value: '已结算' }, { label: '已审核', value: '已审核' },
    ]},
  ];
  const currentFilters = activeTab === 'cod' ? codFilters : activeTab === 'monthly' ? monthlyFilters : accountFilters;

  const summaryCards = summary ? [
    { label: '应收总额', value: `¥${Number(summary.totalReceivable || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已收总额', value: `¥${Number(summary.totalReceived || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '待结算笔数', value: `${data.filter(d => d.status === '待结算').length} 笔`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '利润', value: `¥${Number(summary.profit || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : [];

  const actionButtons = activeTab === '' ? [
    { label: '批量结算', onClick: handleBatchSettle, variant: 'primary' as const },
    { label: '批量审核', onClick: handleBatchVerify },
  ] : activeTab === 'cod' ? [
    { label: '批量收款确认', onClick: handleBatchSettle, variant: 'primary' as const },
    { label: '批量核销', onClick: handleBatchVerify },
  ] : [
    { label: '批量确认对账', onClick: handleBatchSettle, variant: 'primary' as const },
  ];

  return (
    <>
      <T9TablePage
        title="财务中心"
        columns={currentColumns}
        data={data}
        loading={loading}
        total={total}
        filters={currentFilters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData}
        onRefresh={loadData}
        selectedRows={selectedRows}
        onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
        onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
        actionButtons={actionButtons}
      >
        <div className="mx-3">
          <div className="bg-white border border-gray-200 border-b-0 px-2 pt-1 flex items-center gap-0">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => navigate(`/finance${tab.key ? `?tab=${tab.key}` : ''}`)}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <tab.icon className="w-3 h-3" />{tab.label}
              </button>
            ))}
          </div>
          {summaryCards.length > 0 && (
            <div className="bg-white border-x border-gray-200 px-3 py-2 grid grid-cols-4 gap-2">
              {summaryCards.map((s) => (
                <div key={s.label} className={`${s.bg} rounded px-3 py-2 flex items-center gap-2`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                    <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'cod' && (
            <div className="bg-orange-50 border-x border-orange-200 px-3 py-2 text-xs text-orange-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              代收货款流程：货物签收后自动生成代收记录 → 收款确认（标记已收到货款）→ 核销（财务审核完成）
            </div>
          )}
          {activeTab === 'monthly' && (
            <div className="bg-indigo-50 border-x border-indigo-200 px-3 py-2 text-xs text-indigo-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              月结对账流程：月结客户运单自动汇总 → 确认对账（双方核对金额）→ 审核（财务审核完成）
            </div>
          )}
        </div>
      </T9TablePage>

      {/* 代收货款核销弹窗 */}
      <T9Modal open={showCodVerify} onClose={() => setShowCodVerify(false)} title="代收货款核销" width="480px"
        footer={<><T9Button onClick={() => setShowCodVerify(false)}>取消</T9Button><T9Button variant="primary" onClick={handleCodVerify}>确认核销</T9Button></>}>
        {codItem && (
          <div className="space-y-3">
            <div className="bg-orange-50 rounded p-3 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500 text-xs">运单号：</span><span className="font-mono font-medium text-blue-600">{codItem.waybillNo}</span></div>
              <div><span className="text-gray-500 text-xs">代收金额：</span><span className="font-bold text-orange-600">¥{Number(codItem.amount || 0).toFixed(2)}</span></div>
              <div><span className="text-gray-500 text-xs">发货客户：</span><span>{codItem.customerName || '-'}</span></div>
              <div><span className="text-gray-500 text-xs">收款时间：</span><span>{codItem.settledAt || '-'}</span></div>
            </div>
            <T9FormRow label="核销备注">
              <T9Input value={codRemark} onChange={(e: any) => setCodRemark(e.target.value)} placeholder="请输入核销备注（可选）" />
            </T9FormRow>
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
              核销后该笔代收货款将标记为"已审核"，表示货款已完成结算。
            </div>
          </div>
        )}
      </T9Modal>

      {/* 月结对账详情弹窗 */}
      <T9Modal open={showMonthlyDetail} onClose={() => setShowMonthlyDetail(false)} title="月结对账单详情" width="560px"
        footer={
          <div className="flex gap-2">
            <T9Button onClick={() => setShowMonthlyDetail(false)}>关闭</T9Button>
            {monthlyItem?.status === '待结算' && (
              <T9Button variant="primary" onClick={() => { handleSettle(monthlyItem.id); setShowMonthlyDetail(false); }}>确认对账</T9Button>
            )}
          </div>
        }>
        {monthlyItem && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '月结客户', value: <span className="font-medium">{monthlyItem.customerName || '-'}</span> },
                { label: '月结金额', value: <span className="font-bold text-indigo-600">¥{Number(monthlyItem.amount || 0).toFixed(2)}</span> },
                { label: '运单号', value: <span className="font-mono text-blue-600 text-xs">{monthlyItem.waybillNo || '-'}</span> },
                { label: '当前状态', value: <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge(monthlyItem.status)}`}>{monthlyItem.status}</span> },
                { label: '发站', value: monthlyItem.originOrgName || '-' },
                { label: '到站', value: monthlyItem.destOrgName || '-' },
                { label: '开单时间', value: monthlyItem.createdAt || '-' },
                { label: '对账时间', value: monthlyItem.settledAt || '待对账' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                  <div>{item.value}</div>
                </div>
              ))}
            </div>
            {monthlyItem.remark && (
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500 mb-0.5">备注</div>
                <div>{monthlyItem.remark}</div>
              </div>
            )}
          </div>
        )}
      </T9Modal>
    </>
  );
}
