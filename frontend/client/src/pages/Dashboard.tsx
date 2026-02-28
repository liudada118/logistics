import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { waybillApi, dashboardApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Download, RefreshCw, Plus, Printer, Upload, Settings, Filter, BarChart3, FileText, TrendingUp, Package, Truck, DollarSign, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [waybills, setWaybills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setHours(23, 59, 59, 999);
    return d.toISOString().slice(0, 10);
  });
  const [keyword, setKeyword] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wb, ov] = await Promise.all([
        waybillApi.list({ page: 1, size: 50 }).catch(() => ({ records: [], total: 0 })),
        dashboardApi.overview().catch(() => null),
      ]);
      setWaybills(wb.records || []);
      setOverview(ov);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await waybillApi.list({ page: 1, size: 50, keyword });
      setWaybills(res.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === waybills.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(waybills.map(w => w.id)));
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      '已开单': 'text-blue-400',
      '已发货': 'text-yellow-400',
      '运输中': 'text-orange-400',
      '已到货': 'text-cyan-400',
      '已签收': 'text-green-400',
      '异常': 'text-red-400',
    };
    return map[status] || 'text-gray-400';
  };

  const stats = [
    { label: '今日运单', value: overview?.todayWaybills ?? waybills.length, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: '运输中', value: overview?.inTransit ?? 0, icon: Truck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: '待签收', value: overview?.pendingSign ?? 0, icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: '今日收入', value: `¥${(overview?.todayRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: '异常件', value: overview?.exceptions ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: '总运单', value: overview?.totalWaybills ?? 0, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        {/* 统计卡片区 */}
        <div className="px-3 py-2 grid grid-cols-6 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded border border-gray-200 px-3 py-2 flex items-center gap-2">
              <div className={`w-8 h-8 rounded ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-sm font-bold text-gray-800">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 筛选条件栏 - 模拟T9 */}
        <div className="px-3 py-1.5 bg-white mx-3 rounded-t border border-gray-200 border-b-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">日期:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500" />
              <span className="text-gray-400">~</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">发站:</span>
              <select className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500">
                <option>全部</option>
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">到站:</span>
              <select className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500">
                <option>全部</option>
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">制单人:</span>
              <select className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500">
                <option>全部</option>
              </select>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={handleSearch} className="h-7 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                <Search className="w-3 h-3" />提取
              </button>
              <button className="h-7 px-3 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <Filter className="w-3 h-3" />更多
              </button>
              <button onClick={loadData} className="h-7 px-3 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />刷新
              </button>
              <button className="h-7 px-3 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <Download className="w-3 h-3" />导出
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 - 模拟T9运单列表 */}
        <div className="flex-1 mx-3 bg-white border border-gray-200 overflow-auto">
          <table className="w-full text-xs border-collapse min-w-[1400px]">
            <thead className="bg-[#f7f8fa] sticky top-0 z-10">
              <tr>
                <th className="w-8 px-2 py-2 border-b border-r border-gray-200">
                  <input type="checkbox" checked={selectedRows.size === waybills.length && waybills.length > 0} onChange={toggleAll} className="w-3.5 h-3.5" />
                </th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">状态</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">运单号</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">货号</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">托运日期</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">发站</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">到站</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">发货人</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">发货人手机</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">收货人</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">收货人手机</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">收货地址</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">品名</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">件数</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">重量</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">体积</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">现付</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">提付</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">月结</th>
                <th className="px-2 py-2 border-b border-r border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">运费合计</th>
                <th className="px-2 py-2 border-b border-gray-200 text-left font-medium text-gray-600 whitespace-nowrap">备注</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={21} className="text-center py-20 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />加载中...
                  </div>
                </td></tr>
              ) : waybills.length === 0 ? (
                <tr><td colSpan={21} className="text-center py-20 text-gray-400">暂无数据</td></tr>
              ) : waybills.map((w, i) => (
                <tr key={w.id} className={`hover:bg-blue-50/50 ${selectedRows.has(w.id) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100">
                    <input type="checkbox" checked={selectedRows.has(w.id)} onChange={() => toggleRow(w.id)} className="w-3.5 h-3.5" />
                  </td>
                  <td className={`px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap ${statusColor(w.status)}`}>{w.status}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-blue-600 cursor-pointer hover:underline">{w.waybillNo}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.goodsNo || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.createTime?.slice(0, 10)}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.senderOrgName || w.originName || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.receiverOrgName || w.destName || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.senderName || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.senderPhone || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.receiverName || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.receiverPhone || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap max-w-[200px] truncate">{w.receiverAddress || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap">{w.goodsName || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right">{w.quantity ?? '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right">{w.weight ?? '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right">{w.volume ?? '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right">{w.freight ? `¥${w.freight}` : '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right">{w.deliveryFee ? `¥${w.deliveryFee}` : '-'}</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right">-</td>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-right font-medium">{w.totalFee ? `¥${w.totalFee}` : w.freight ? `¥${w.freight}` : '-'}</td>
                  <td className="px-2 py-1.5 border-b border-gray-100 whitespace-nowrap max-w-[150px] truncate">{w.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 底部工具栏 - 模拟T9 */}
        <div className="mx-3 bg-white border border-gray-200 border-t-0 rounded-b px-3 py-1.5 flex items-center gap-1 text-xs">
          <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />统计
          </button>
          <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
            <Settings className="w-3 h-3" />表格设置
          </button>
          <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
            <Upload className="w-3 h-3" />上传图片
          </button>
          <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
            <Printer className="w-3 h-3" />打印运单
          </button>
          <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
            <Printer className="w-3 h-3" />批量打印
          </button>
          <div className="flex-1" />
          <span className="text-gray-500">
            共 <span className="text-blue-600 font-medium">{waybills.length}</span> 条记录
            {selectedRows.size > 0 && <span className="ml-2">已选 <span className="text-blue-600 font-medium">{selectedRows.size}</span> 条</span>}
          </span>
        </div>

        <div className="h-2" />
      </div>
    </DashboardLayout>
  );
}
