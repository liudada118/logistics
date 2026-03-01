import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { waybillApi } from '@/lib/api';
import { useLocation } from 'wouter';
import { Eye, Edit, Trash2, Printer, BarChart3, Settings, Upload, Plus, Search, RefreshCw, Download, Filter } from 'lucide-react';

export default function WaybillList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [, navigate] = useLocation();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await waybillApi.list({ page: 1, size: 100, keyword, status: statusFilter });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      '待调度': 'text-gray-600', '已发货': 'text-yellow-600', '运输中': 'text-orange-600',
      '已到货': 'text-cyan-600', '已签收': 'text-green-600', '异常': 'text-red-600',
    };
    return map[status] || 'text-gray-600';
  };

  const payCol = (row: any, method: string) => {
    if (row.paymentMethod === method && row.freightFee) {
      return `¥${Number(row.freightFee).toFixed(2)}`;
    }
    return '-';
  };

  const toggleRow = (id: number) => {
    setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelectedRows(selectedRows.size === data.length ? new Set() : new Set(data.map(d => d.id)));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该运单吗？')) return;
    try { await waybillApi.delete(id); loadData(); } catch (e) { console.error(e); }
  };

  const TH = ({ children, align = 'left' }: { children: React.ReactNode; align?: string }) => (
    <th className={`px-2 py-2 border-b border-r border-gray-200 font-medium text-gray-600 whitespace-nowrap text-${align}`}>{children}</th>
  );
  const TD = ({ children, align = 'left', className = '' }: { children: React.ReactNode; align?: string; className?: string }) => (
    <td className={`px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap text-${align} ${className}`}>{children}</td>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        {/* 顶部筛选栏 */}
        <div className="px-3 py-1.5 bg-white mx-3 mt-3 rounded-t border border-gray-200 border-b-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">状态:</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500">
                <option value="">全部</option>
                <option value="待调度">待调度</option>
                <option value="已发货">已发货</option>
                <option value="运输中">运输中</option>
                <option value="已到货">已到货</option>
                <option value="已签收">已签收</option>
                <option value="异常">异常</option>
              </select>
            </div>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadData()}
              placeholder="运单号/货号/发货人/收货人"
              className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 w-52" />
            <div className="flex items-center gap-1 ml-auto">
              <button onClick={loadData} className="h-7 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                <Search className="w-3 h-3" />提取
              </button>
              <button className="h-7 px-3 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <Filter className="w-3 h-3" />更多
              </button>
              <button onClick={() => navigate('/waybills/create')} className="h-7 px-3 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
                <Plus className="w-3 h-3" />受理开单
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

        {/* 数据表格 */}
        <div className="flex-1 mx-3 bg-white border border-gray-200 overflow-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: '2400px' }}>
            <thead className="bg-[#f7f8fa] sticky top-0 z-10">
              <tr>
                <th className="w-8 px-2 py-2 border-b border-r border-gray-200">
                  <input type="checkbox" checked={selectedRows.size === data.length && data.length > 0} onChange={toggleAll} className="w-3.5 h-3.5" />
                </th>
                <TH>状态</TH>
                <TH>运单号</TH>
                <TH>货号</TH>
                <TH>托运日期</TH>
                <TH>发站</TH>
                <TH>中转地</TH>
                <TH>到站</TH>
                <TH>发货人</TH>
                <TH>发货人手机</TH>
                <TH>收货人</TH>
                <TH>收货人手机</TH>
                <TH>收货地址</TH>
                <TH>品名</TH>
                <TH>包装</TH>
                <TH align="right">件数</TH>
                <TH align="right">立方</TH>
                <TH align="right">重量</TH>
                <TH align="right">现付</TH>
                <TH align="right">提付</TH>
                <TH align="right">回单付</TH>
                <TH align="right">月结</TH>
                <TH align="right">货款扣</TH>
                <TH>发货地址</TH>
                <TH align="right">基本运费</TH>
                <TH align="right">保险费</TH>
                <TH align="right">接货费</TH>
                <TH align="right">运费合计</TH>
                <TH align="right">代收货款</TH>
                <TH>回单</TH>
                <TH>备注</TH>
                <TH align="center">操作</TH>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={32} className="text-center py-20 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />加载中...
                  </div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={32} className="text-center py-20 text-gray-400">
                  暂无运单数据，点击「受理开单」创建第一张运单
                </td></tr>
              ) : data.map((w, i) => (
                <tr key={w.id} className={`hover:bg-blue-50/50 ${selectedRows.has(w.id) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100">
                    <input type="checkbox" checked={selectedRows.has(w.id)} onChange={() => toggleRow(w.id)} className="w-3.5 h-3.5" />
                  </td>
                  <TD className={statusColor(w.status)}>{w.status || '-'}</TD>
                  <TD className="text-blue-600 font-mono cursor-pointer hover:underline" onClick={() => navigate(`/waybills/${w.id}`)}>{w.waybillNo}</TD>
                  <TD>{w.goodsNo || '-'}</TD>
                  <TD>{(w.createdAt || w.createTime)?.slice(0, 10) || '-'}</TD>
                  <TD>{w.originOrgName || w.originName || '-'}</TD>
                  <TD>{w.transitOrgName || '-'}</TD>
                  <TD>{w.destOrgName || w.destName || '-'}</TD>
                  <TD>{w.senderName || '-'}</TD>
                  <TD>{w.senderPhone || '-'}</TD>
                  <TD>{w.receiverName || '-'}</TD>
                  <TD>{w.receiverPhone || '-'}</TD>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 max-w-[180px] truncate" title={w.receiverAddress}>{w.receiverAddress || '-'}</td>
                  <TD>{w.goodsName || '-'}</TD>
                  <TD>{w.packingType || '-'}</TD>
                  <TD align="right">{w.quantity ?? '-'}</TD>
                  <TD align="right">{w.volume ? Number(w.volume).toFixed(2) : '-'}</TD>
                  <TD align="right">{w.weight ? `${w.weight}kg` : '-'}</TD>
                  <TD align="right" className={w.paymentMethod === '现付' ? 'text-blue-600 font-medium' : 'text-gray-400'}>{payCol(w, '现付')}</TD>
                  <TD align="right" className={w.paymentMethod === '提付' ? 'text-blue-600 font-medium' : 'text-gray-400'}>{payCol(w, '提付')}</TD>
                  <TD align="right" className={w.paymentMethod === '回单付' ? 'text-blue-600 font-medium' : 'text-gray-400'}>{payCol(w, '回单付')}</TD>
                  <TD align="right" className={w.paymentMethod === '月结' ? 'text-blue-600 font-medium' : 'text-gray-400'}>{payCol(w, '月结')}</TD>
                  <TD align="right" className={w.paymentMethod === '货款扣' ? 'text-blue-600 font-medium' : 'text-gray-400'}>{payCol(w, '货款扣')}</TD>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 max-w-[180px] truncate" title={w.senderAddress}>{w.senderAddress || '-'}</td>
                  <TD align="right">{w.baseFreight ? `¥${Number(w.baseFreight).toFixed(2)}` : '-'}</TD>
                  <TD align="right">{w.insuranceFee ? `¥${Number(w.insuranceFee).toFixed(2)}` : '-'}</TD>
                  <TD align="right">{w.pickupFee ? `¥${Number(w.pickupFee).toFixed(2)}` : '-'}</TD>
                  <TD align="right" className="font-medium text-red-600">{w.freightFee ? `¥${Number(w.freightFee).toFixed(2)}` : '-'}</TD>
                  <TD align="right" className={w.codAmount && Number(w.codAmount) > 0 ? 'text-orange-600' : 'text-gray-400'}>{w.codAmount && Number(w.codAmount) > 0 ? `¥${Number(w.codAmount).toFixed(2)}` : '-'}</TD>
                  <TD>{w.receiptRequired === 1 || w.receiptRequired === '1' ? `需要(${w.receiptCount || 1}份)` : '无需'}</TD>
                  <td className="px-2 py-1.5 border-b border-r border-gray-100 max-w-[120px] truncate" title={w.remark}>{w.remark || '-'}</td>
                  <td className="px-2 py-1.5 border-b border-gray-100 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => navigate(`/waybills/${w.id}`)} className="text-blue-500 hover:text-blue-700 p-0.5" title="查看"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => navigate(`/waybills/${w.id}/edit`)} className="text-green-500 hover:text-green-700 p-0.5" title="编辑"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(w.id)} className="text-red-500 hover:text-red-700 p-0.5" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 底部工具栏 */}
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
            共 <span className="text-blue-600 font-medium">{total || data.length}</span> 条记录
            {selectedRows.size > 0 && <span className="ml-2">已选 <span className="text-blue-600 font-medium">{selectedRows.size}</span> 条</span>}
          </span>
        </div>

        <div className="h-2" />
      </div>
    </DashboardLayout>
  );
}
