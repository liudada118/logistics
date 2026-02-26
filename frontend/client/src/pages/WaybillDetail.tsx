import { useParams, useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { useWaybills } from '@/contexts/WaybillContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, MailCheck, PackageCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function WaybillDetail() {
  const params = useParams<{ id: string }>();
  const { getWaybill, getStatusLogs, updateReceiptStatus } = useWaybills();
  const [, navigate] = useLocation();

  const waybill = getWaybill(Number(params.id));
  const logs = getStatusLogs(Number(params.id));

  if (!waybill) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-muted-foreground">运单不存在</div>
      </DashboardLayout>
    );
  }

  const handleReceiptAction = (action: '已寄出' | '已签收') => {
    updateReceiptStatus(waybill.id, action);
    toast.success(`回单状态已更新为"${action}"`);
  };

  const statusStyles: Record<string, string> = {
    '待调度': 'bg-slate-100 text-slate-600',
    '已调度': 'bg-blue-50 text-blue-600',
    '运输中': 'bg-amber-50 text-amber-600',
    '已到货': 'bg-cyan-50 text-cyan-600',
    '派送中': 'bg-indigo-50 text-indigo-600',
    '已签收': 'bg-emerald-50 text-emerald-600',
    '异常': 'bg-red-50 text-red-600',
  };

  // 计算费用明细
  const baseFreight = Number(waybill.baseFreight || 0);
  const insuranceFee = Number(waybill.insuranceFee || 0);
  const pickupFee = Number(waybill.pickupFee || 0);
  const deliveryFee = Number(waybill.deliveryFee || 0);
  const packingFee = Number(waybill.packingFee || 0);
  const otherFee = Number(waybill.otherFee || 0);
  const totalFee = Number(waybill.freightFee || 0);
  const codAmount = Number(waybill.codAmount || 0);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/waybills')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground font-mono" style={{ fontFamily: 'DM Sans' }}>{waybill.waybillNo}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[waybill.status] || 'bg-gray-100 text-gray-600'}`}>
                  {waybill.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">创建于 {waybill.createdAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {waybill.receiptStatus === '待寄出' && (
              <Button variant="outline" size="sm" onClick={() => handleReceiptAction('已寄出')} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <MailCheck className="w-4 h-4 mr-1.5" />回单已寄出
              </Button>
            )}
            {waybill.receiptStatus === '已寄出' && (
              <Button variant="outline" size="sm" onClick={() => handleReceiptAction('已签收')} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <PackageCheck className="w-4 h-4 mr-1.5" />回单已签收
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/waybills/${waybill.id}/edit`)}>
              <Pencil className="w-4 h-4 mr-1.5" />编辑
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column - details */}
          <div className="lg:col-span-2 space-y-5">
            {/* 站点信息 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">站点信息</h3>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground">发站</div>
                  <div className="font-medium text-foreground mt-0.5">{waybill.originOrgName || waybill.currentOrgName || '-'}</div>
                </div>
                {waybill.transitOrgName && (
                  <>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-muted-foreground">中转</div>
                      <div className="font-medium text-amber-600 mt-0.5">{waybill.transitOrgName}</div>
                    </div>
                  </>
                )}
                <div className="text-muted-foreground">→</div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground">到站</div>
                  <div className="font-medium text-foreground mt-0.5">{waybill.destOrgName || '-'}</div>
                </div>
              </div>
            </div>

            {/* Sender & Receiver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">发货信息</h3>
                <div className="space-y-2.5">
                  <InfoRow label="发货方" value={waybill.senderName} />
                  <InfoRow label="联系电话" value={waybill.senderPhone} />
                  <InfoRow label="发货地址" value={waybill.senderAddress} />
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">收货信息</h3>
                <div className="space-y-2.5">
                  <InfoRow label="收货人" value={waybill.receiverName} />
                  <InfoRow label="联系电话" value={waybill.receiverPhone} />
                  <InfoRow label="收货地址" value={waybill.receiverAddress} />
                  <InfoRow label="交接方式" value={waybill.deliveryMethod || '自提'} />
                </div>
              </div>
            </div>

            {/* Goods info */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">货物信息</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <InfoBlock label="货物名称" value={waybill.goodsName} />
                <InfoBlock label="包装类型" value={waybill.packingType || '-'} />
                <InfoBlock label="件数" value={`${waybill.quantity} 件`} />
                <InfoBlock label="重量" value={`${waybill.weight} kg`} />
                <InfoBlock label="体积" value={`${waybill.volume} m³`} />
              </div>
            </div>

            {/* 费用明细 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">费用明细</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoBlock label="付款方式" value={waybill.paymentMethod} />
                <InfoBlock label="基本运费" value={`¥${baseFreight.toFixed(2)}`} />
                <InfoBlock label="保险费" value={`¥${insuranceFee.toFixed(2)}`} />
                <InfoBlock label="接货费" value={`¥${pickupFee.toFixed(2)}`} />
                <InfoBlock label="送货费" value={`¥${deliveryFee.toFixed(2)}`} />
                <InfoBlock label="包装费" value={`¥${packingFee.toFixed(2)}`} />
                <InfoBlock label="其他费用" value={`¥${otherFee.toFixed(2)}`} />
                <InfoBlock label="总运费" value={`¥${totalFee.toFixed(2)}`} highlight />
              </div>
              {codAmount > 0 && (
                <div className="border-t border-border mt-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoBlock label="代收货款" value={`¥${codAmount.toFixed(2)}`} highlight />
                </div>
              )}
            </div>

            {/* 回单信息 */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">回单信息</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoBlock label="回单状态" value={waybill.receiptStatus || '无需回单'} />
                <InfoBlock label="是否需要回单" value={waybill.receiptRequired ? '是' : '否'} />
                {(waybill.receiptRequired ?? 0) > 0 && (
                  <InfoBlock label="回单份数" value={`${waybill.receiptCount || 0} 份`} />
                )}
                <InfoBlock label="当前位置" value={waybill.currentOrgName || '-'} />
              </div>
            </div>

            {/* Remark */}
            {waybill.remark && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">备注</h3>
                <p className="text-sm text-foreground">{waybill.remark}</p>
              </div>
            )}
          </div>

          {/* Right column - timeline */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">状态追踪</h3>
              {logs.length > 0 ? (
                <div className="space-y-0">
                  {logs.map((log, index) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${index === logs.length - 1 ? 'bg-blue-500' : 'bg-border'}`} />
                        {index < logs.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${index === logs.length - 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/60">
                          <Clock className="w-3 h-3" />
                          <span className="tabular-nums">{log.createdAt}</span>
                          <span>·</span>
                          <span>{log.operatorName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无状态记录</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground shrink-0 w-16">{label}</span>
      <span className="text-sm text-foreground">{value || '-'}</span>
    </div>
  );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm mt-0.5 ${highlight ? 'font-semibold text-blue-600 tabular-nums' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
