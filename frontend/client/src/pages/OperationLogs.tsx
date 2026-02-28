import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import { operationLogApi } from '@/lib/api';

export default function OperationLogs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await operationLogApi.list({ page: 1, size: 50, keyword: filterValues.keyword, module: filterValues.module });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const columns: Column[] = [
    { key: 'module', title: '模块', width: '100px', render: (v) => <span className="font-medium">{v || '-'}</span> },
    { key: 'action', title: '操作类型', width: '100px', render: (v) => {
      const c = v === '新增' ? 'text-green-600' : v === '修改' ? 'text-blue-600' : v === '删除' ? 'text-red-600' : 'text-gray-600';
      return <span className={c}>{v || '-'}</span>;
    }},
    { key: 'description', title: '操作描述', width: '300px', render: (v) => <span className="max-w-[300px] truncate block">{v || '-'}</span> },
    { key: 'operatorName', title: '操作人', width: '80px' },
    { key: 'ip', title: 'IP地址', width: '120px' },
    { key: 'createTime', title: '操作时间', width: '160px', render: (v) => v || '-' },
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '操作描述/操作人' },
    { key: 'module', label: '模块', type: 'select', options: [
      { label: '运单', value: '运单' }, { label: '运输', value: '运输' }, { label: '库存', value: '库存' },
      { label: '签收', value: '签收' }, { label: '异常', value: '异常' }, { label: '回单', value: '回单' },
      { label: '财务', value: '财务' }, { label: '用户', value: '用户' }, { label: '系统', value: '系统' },
    ]},
  ];

  return (
    <T9TablePage
      title="操作日志"
      columns={columns}
      data={data}
      loading={loading}
      total={total}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
      onSearch={loadData}
      onRefresh={loadData}
    />
  );
}
