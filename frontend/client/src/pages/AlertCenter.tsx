import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import { alertApi } from '@/lib/api';
import { CheckCircle, Eye } from 'lucide-react';

export default function AlertCenter() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await alertApi.list({ page: 1, size: 50, keyword: filterValues.keyword, type: filterValues.type, status: filterValues.status });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleRead = async (id: number) => {
    try { await alertApi.read(id); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const handleBatchRead = async () => {
    if (selectedRows.size === 0) { alert('请先选择记录'); return; }
    try { await alertApi.batchRead(Array.from(selectedRows)); setSelectedRows(new Set()); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const levelColor = (level: string) => {
    const map: Record<string, string> = { '紧急': 'bg-red-100 text-red-700', '重要': 'bg-orange-100 text-orange-700', '一般': 'bg-blue-100 text-blue-700', '提示': 'bg-gray-100 text-gray-700' };
    return map[level] || 'bg-gray-100 text-gray-600';
  };

  const columns: Column[] = [
    { key: 'status', title: '状态', width: '70px', render: (v) => v === '未读' ? <span className="text-red-600 font-medium">●未读</span> : <span className="text-gray-400">已读</span> },
    { key: 'level', title: '级别', width: '70px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded ${levelColor(v)}`}>{v || '-'}</span> },
    { key: 'type', title: '预警类型', width: '100px' },
    { key: 'title', title: '预警标题', width: '200px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'content', title: '预警内容', width: '300px', render: (v) => <span className="max-w-[300px] truncate block">{v || '-'}</span> },
    { key: 'waybillNo', title: '关联运单', width: '130px', render: (v) => v ? <span className="text-blue-600 font-mono">{v}</span> : '-' },
    { key: 'createTime', title: '预警时间', width: '140px', render: (v) => v || '-' },
    { key: 'readTime', title: '阅读时间', width: '140px', render: (v) => v || '-' },
    { key: '_action', title: '操作', width: '80px', align: 'center', render: (_, row) => (
      row.status === '未读' ? <button onClick={() => handleRead(row.id)} className="text-xs text-blue-600 hover:underline">标为已读</button> : <span className="text-xs text-gray-400">-</span>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '标题/内容/运单号' },
    { key: 'type', label: '类型', type: 'select', options: [{ label: '超时预警', value: '超时预警' }, { label: '异常预警', value: '异常预警' }, { label: '库存预警', value: '库存预警' }] },
    { key: 'status', label: '状态', type: 'select', options: [{ label: '未读', value: '未读' }, { label: '已读', value: '已读' }] },
  ];

  return (
    <T9TablePage
      title="预警中心"
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
      actionButtons={[{ label: '批量已读', icon: CheckCircle, onClick: handleBatchRead, variant: 'primary' }]}
    />
  );
}
