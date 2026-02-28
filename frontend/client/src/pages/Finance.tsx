import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import { financeApi } from '@/lib/api';
import { useLocation } from 'wouter';
import { Calculator, Receipt, Wrench, FileBarChart, DollarSign, TrendingUp, Wallet, CreditCard } from 'lucide-react';

const tabs = [
  { key: '', label: '财务做账', icon: Calculator },
  { key: 'reconcile', label: '财务对账', icon: Receipt },
  { key: 'tools', label: '财务工具', icon: Wrench },
  { key: 'reports', label: '报表中心', icon: FileBarChart },
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

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, sum] = await Promise.all([
        financeApi.list({ page: 1, size: 50, keyword: filterValues.keyword, type: filterValues.type, status: filterValues.status }),
        financeApi.summary().catch(() => null),
      ]);
      setData(res.records || []);
      setTotal(res.total || 0);
      setSummary(sum);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleSettle = async (id: number) => {
    try { await financeApi.settle(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const handleVerify = async (id: number) => {
    try { await financeApi.verify(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const handleBatchSettle = async () => {
    if (selectedRows.size === 0) { alert('请先选择记录'); return; }
    try { await financeApi.batchSettle(Array.from(selectedRows)); setSelectedRows(new Set()); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const handleBatchVerify = async () => {
    if (selectedRows.size === 0) { alert('请先选择记录'); return; }
    try { await financeApi.batchVerify(Array.from(selectedRows)); setSelectedRows(new Set()); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { '待结算': 'bg-yellow-100 text-yellow-700', '已结算': 'bg-green-100 text-green-700', '已审核': 'bg-blue-100 text-blue-700', '已取消': 'bg-gray-100 text-gray-600' };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const typeColor = (type: string) => {
    const map: Record<string, string> = { '运费': 'text-blue-600', '送货费': 'text-green-600', '代收货款': 'text-orange-600', '保价费': 'text-purple-600', '包装费': 'text-cyan-600' };
    return map[type] || 'text-gray-600';
  };

  const columns: Column[] = [
    { key: 'status', title: '状态', width: '80px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge(v)}`}>{v || '-'}</span> },
    { key: 'type', title: '费用类型', width: '90px', render: (v) => <span className={`font-medium ${typeColor(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '130px', render: (v) => <span className="text-blue-600 font-mono">{v || '-'}</span> },
    { key: 'customerName', title: '客户', width: '100px' },
    { key: 'amount', title: '金额', width: '90px', align: 'right', render: (v) => v ? <span className="font-medium text-red-600">¥{Number(v).toFixed(2)}</span> : '-' },
    { key: 'payMethod', title: '付款方式', width: '80px' },
    { key: 'originName', title: '发站', width: '80px' },
    { key: 'destName', title: '到站', width: '80px' },
    { key: 'settleTime', title: '结算时间', width: '140px', render: (v) => v || '-' },
    { key: 'verifyTime', title: '审核时间', width: '140px', render: (v) => v || '-' },
    { key: 'operatorName', title: '操作人', width: '80px' },
    { key: 'createTime', title: '创建时间', width: '140px', render: (v) => v || '-' },
    { key: 'remark', title: '备注', width: '120px' },
    { key: '_action', title: '操作', width: '120px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-2">
        {row.status === '待结算' && <button onClick={() => handleSettle(row.id)} className="text-xs text-green-600 hover:underline">结算</button>}
        {row.status === '已结算' && <button onClick={() => handleVerify(row.id)} className="text-xs text-blue-600 hover:underline">审核</button>}
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/客户名' },
    { key: 'type', label: '费用类型', type: 'select', options: [
      { label: '运费', value: '运费' }, { label: '送货费', value: '送货费' },
      { label: '代收货款', value: '代收货款' }, { label: '保价费', value: '保价费' },
    ]},
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '待结算', value: '待结算' }, { label: '已结算', value: '已结算' },
      { label: '已审核', value: '已审核' }, { label: '已取消', value: '已取消' },
    ]},
  ];

  const summaryCards = summary ? [
    { label: '应收总额', value: `¥${(summary.totalReceivable || 0).toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已收总额', value: `¥${(summary.totalReceived || 0).toLocaleString()}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '应付总额', value: `¥${(summary.totalPayable || 0).toLocaleString()}`, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '利润', value: `¥${(summary.profit || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : [];

  return (
    <T9TablePage
      title="财务中心"
      columns={columns}
      data={data}
      loading={loading}
      total={total}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
      onSearch={loadData}
      onRefresh={loadData}
      selectedRows={selectedRows}
      onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
      onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      actionButtons={[
        { label: '批量结算', onClick: handleBatchSettle, variant: 'primary' },
        { label: '批量审核', onClick: handleBatchVerify },
      ]}
    >
      {/* Tab切换 + 汇总卡片 */}
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
      </div>
    </T9TablePage>
  );
}
