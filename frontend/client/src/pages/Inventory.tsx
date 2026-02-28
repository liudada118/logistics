import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import { inventoryApi } from '@/lib/api';
import { useLocation } from 'wouter';
import { Package, ArrowUpFromLine } from 'lucide-react';

export default function Inventory() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const inventoryType = urlParams.get('type') || '';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, [inventoryType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.list({
        page: 1, size: 50,
        keyword: filterValues.keyword,
        status: filterValues.status,
        inventoryType: inventoryType || undefined,
      });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleOutbound = async (id: number) => {
    if (!confirm('确认出库？')) return;
    try { await inventoryApi.outbound(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const handleBatchOutbound = async () => {
    if (selectedRows.size === 0) { alert('请先选择记录'); return; }
    if (!confirm(`确认批量出库 ${selectedRows.size} 条记录？`)) return;
    try { await inventoryApi.batchOutbound(Array.from(selectedRows)); setSelectedRows(new Set()); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = { '在库': 'text-green-600', '已出库': 'text-gray-500', '异常': 'text-red-600' };
    return map[status] || 'text-gray-600';
  };

  const columns: Column[] = [
    { key: 'status', title: '状态', width: '70px', render: (v) => <span className={`font-medium ${statusColor(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '130px', render: (v) => <span className="text-blue-600 font-mono">{v || '-'}</span> },
    { key: 'goodsName', title: '品名', width: '100px' },
    { key: 'quantity', title: '件数', width: '60px', align: 'right' },
    { key: 'weight', title: '重量(kg)', width: '80px', align: 'right' },
    { key: 'volume', title: '体积(m³)', width: '80px', align: 'right' },
    { key: 'orgName', title: '所在网点', width: '100px' },
    { key: 'location', title: '库位', width: '80px' },
    { key: 'senderName', title: '发货人', width: '80px' },
    { key: 'receiverName', title: '收货人', width: '80px' },
    { key: 'inboundTime', title: '入库时间', width: '140px', render: (v) => v || '-' },
    { key: 'outboundTime', title: '出库时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '80px', align: 'center', render: (_, row) => (
      row.status === '在库' ? (
        <button onClick={() => handleOutbound(row.id)} className="text-xs text-orange-600 hover:underline">出库</button>
      ) : <span className="text-xs text-gray-400">-</span>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/品名/收发货人' },
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '在库', value: '在库' }, { label: '已出库', value: '已出库' }, { label: '异常', value: '异常' },
    ]},
  ];

  const title = inventoryType === 'send' ? '发货库存' : inventoryType === 'arrive' ? '到货库存' : '库存管理';

  return (
    <T9TablePage
      title={title}
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
        { label: '批量出库', icon: ArrowUpFromLine, onClick: handleBatchOutbound, variant: 'primary' },
      ]}
    />
  );
}
