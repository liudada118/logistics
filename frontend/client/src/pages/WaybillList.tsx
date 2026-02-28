import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import { waybillApi } from '@/lib/api';
import { useLocation } from 'wouter';
import { Eye, Edit, Trash2, Printer, BarChart3, Settings, Upload } from 'lucide-react';

export default function WaybillList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [, navigate] = useLocation();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await waybillApi.list({ page: 1, size: 50, keyword: filterValues.keyword, status: filterValues.status });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = { '已开单': 'text-blue-600', '已发货': 'text-yellow-600', '运输中': 'text-orange-600', '已到货': 'text-cyan-600', '已签收': 'text-green-600', '异常': 'text-red-600' };
    return map[status] || 'text-gray-600';
  };

  const columns: Column[] = [
    { key: 'status', title: '状态', width: '70px', render: (v) => <span className={`font-medium ${statusColor(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '130px', render: (v, row) => <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/waybills/${row.id}`)}>{v}</span> },
    { key: 'goodsNo', title: '货号', width: '100px' },
    { key: 'createTime', title: '托运日期', width: '100px', render: (v) => v?.slice(0, 10) || '-' },
    { key: 'originName', title: '发站', width: '80px', render: (_, row) => row.senderOrgName || row.originName || '-' },
    { key: 'destName', title: '到站', width: '80px', render: (_, row) => row.receiverOrgName || row.destName || '-' },
    { key: 'senderName', title: '发货人', width: '80px' },
    { key: 'senderPhone', title: '发货人电话', width: '110px' },
    { key: 'receiverName', title: '收货人', width: '80px' },
    { key: 'receiverPhone', title: '收货人电话', width: '110px' },
    { key: 'receiverAddress', title: '收货地址', width: '180px', render: (v) => <span className="max-w-[180px] truncate block">{v || '-'}</span> },
    { key: 'goodsName', title: '品名', width: '100px' },
    { key: 'quantity', title: '件数', width: '60px', align: 'right' },
    { key: 'weight', title: '重量(kg)', width: '80px', align: 'right' },
    { key: 'volume', title: '体积(m³)', width: '80px', align: 'right' },
    { key: 'freight', title: '运费', width: '80px', align: 'right', render: (v) => v ? `¥${v}` : '-' },
    { key: 'deliveryFee', title: '送货费', width: '80px', align: 'right', render: (v) => v ? `¥${v}` : '-' },
    { key: 'totalFee', title: '费用合计', width: '90px', align: 'right', render: (v, row) => <span className="font-medium text-red-600">{v ? `¥${v}` : row.freight ? `¥${row.freight}` : '-'}</span> },
    { key: 'remark', title: '备注', width: '120px' },
    { key: '_action', title: '操作', width: '120px', align: 'center', render: (_, row) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => navigate(`/waybills/${row.id}`)} className="text-blue-500 hover:text-blue-700 p-0.5" title="查看"><Eye className="w-3.5 h-3.5" /></button>
        <button onClick={() => navigate(`/waybills/${row.id}/edit`)} className="text-green-500 hover:text-green-700 p-0.5" title="编辑"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700 p-0.5" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/发货人/收货人' },
    { key: 'status', label: '状态', type: 'select', options: [
      { label: '已开单', value: '已开单' }, { label: '已发货', value: '已发货' },
      { label: '运输中', value: '运输中' }, { label: '已到货', value: '已到货' },
      { label: '已签收', value: '已签收' }, { label: '异常', value: '异常' },
    ]},
    { key: 'dateFrom', label: '开始日期', type: 'date' },
    { key: 'dateTo', label: '结束日期', type: 'date' },
  ];

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该运单吗？')) return;
    try { await waybillApi.delete(id); loadData(); } catch (e) { console.error(e); }
  };

  return (
    <T9TablePage
      title="运单查询"
      columns={columns}
      data={data}
      loading={loading}
      total={total}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
      onSearch={loadData}
      onRefresh={loadData}
      onAdd={() => navigate('/waybills/create')}
      addLabel="受理开单"
      selectedRows={selectedRows}
      onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
      onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      toolbarButtons={[
        { label: '统计', icon: BarChart3 },
        { label: '表格设置', icon: Settings },
        { label: '上传图片', icon: Upload },
        { label: '打印运单', icon: Printer },
        { label: '批量打印', icon: Printer },
      ]}
    />
  );
}
