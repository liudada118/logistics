import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { waybillApi } from '@/lib/api';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, Printer, Edit, Truck, Package, MapPin, DollarSign, Clock, FileText } from 'lucide-react';

export default function WaybillDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/waybills/:id');
  const id = match ? Number(params?.id) : null;
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      waybillApi.get(id).catch(() => null),
      waybillApi.getLogs(id).catch(() => []),
    ]).then(([wb, lg]) => {
      setData(wb);
      setLogs(lg || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const statusColor = (status: string) => {
    const map: Record<string, string> = { '已开单': 'bg-blue-100 text-blue-700', '已发货': 'bg-yellow-100 text-yellow-700', '运输中': 'bg-orange-100 text-orange-700', '已到货': 'bg-cyan-100 text-cyan-700', '已签收': 'bg-green-100 text-green-700', '异常': 'bg-red-100 text-red-700' };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="flex items-start py-1.5 border-b border-gray-100 last:border-0">
      <span className="w-20 text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs text-gray-800 flex-1">{value ?? '-'}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/waybills')} className="h-7 px-2 text-xs bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />返回
            </button>
            <h2 className="text-sm font-bold text-gray-800">运单详情</h2>
            {data && <span className={`text-xs px-2 py-0.5 rounded ${statusColor(data.status)}`}>{data.status}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(`/waybills/${id}/edit`)} className="h-7 px-3 text-xs bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
              <Edit className="w-3 h-3" />编辑
            </button>
            <button className="h-7 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
              <Printer className="w-3 h-3" />打印运单
            </button>
          </div>
        </div>

        <div className="flex-1 mx-3 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">加载中...</div>
          ) : !data ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">运单不存在</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {/* 运单基本信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />运单信息
                </div>
                <div className="px-3 py-1">
                  <InfoRow label="运单号" value={<span className="font-mono font-medium text-blue-600">{data.waybillNo}</span>} />
                  <InfoRow label="货号" value={data.goodsNo} />
                  <InfoRow label="状态" value={<span className={`text-xs px-1.5 py-0.5 rounded ${statusColor(data.status)}`}>{data.status}</span>} />
                  <InfoRow label="开单时间" value={data.createdAt} />
                  <InfoRow label="付款方式" value={data.paymentMethod} />
                </div>
              </div>

              {/* 发货信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-500" />发货信息
                </div>
                <div className="px-3 py-1">
                  <InfoRow label="发站" value={data.originOrgName} />
                  <InfoRow label="发货人" value={data.senderName} />
                  <InfoRow label="电话" value={data.senderPhone} />
                  <InfoRow label="地址" value={data.senderAddress} />
                </div>
              </div>

              {/* 收货信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />收货信息
                </div>
                <div className="px-3 py-1">
                  <InfoRow label="到站" value={data.destOrgName} />
                  <InfoRow label="收货人" value={data.receiverName} />
                  <InfoRow label="电话" value={data.receiverPhone} />
                  <InfoRow label="地址" value={data.receiverAddress} />
                </div>
              </div>

              {/* 货物信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-500" />货物信息
                </div>
                <div className="px-3 py-1">
                  <InfoRow label="品名" value={data.goodsName} />
                  <InfoRow label="件数" value={data.quantity} />
                  <InfoRow label="重量" value={data.weight ? `${data.weight} kg` : '-'} />
                  <InfoRow label="体积" value={data.volume ? `${data.volume} m³` : '-'} />
                </div>
              </div>

              {/* 费用信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-yellow-500" />费用信息
                </div>
                <div className="px-3 py-1">
                  <InfoRow label="基本运费" value={data.baseFreight ? `¥${Number(data.baseFreight).toFixed(2)}` : '-'} />
                  <InfoRow label="送货费" value={data.deliveryFee ? `¥${Number(data.deliveryFee).toFixed(2)}` : '-'} />
                  <InfoRow label="保险费" value={data.insuranceFee ? `¥${Number(data.insuranceFee).toFixed(2)}` : '-'} />
                  <InfoRow label="接货费" value={data.pickupFee ? `¥${Number(data.pickupFee).toFixed(2)}` : '-'} />
                  <InfoRow label="运费合计" value={<span className="font-bold text-red-600">¥{data.freightFee ? Number(data.freightFee).toFixed(2) : '0.00'}</span>} />
                </div>
              </div>

              {/* 操作日志 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />操作记录
                </div>
                <div className="px-3 py-1 max-h-48 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-xs text-gray-400 py-4 text-center">暂无操作记录</div>
                  ) : logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-800">{log.action || log.description}</div>
                        <div className="text-[10px] text-gray-400">{log.operatorName} · {log.createTime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              {data.remark && (
                <div className="col-span-3 bg-white rounded border border-gray-200">
                  <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">备注</div>
                  <div className="px-3 py-2 text-xs text-gray-700">{data.remark}</div>
                </div>
              )}
            </div>
          )}
          <div className="h-3" />
        </div>
      </div>
    </DashboardLayout>
  );
}
