import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { useWaybills } from '@/contexts/WaybillContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Eye, Pencil, Trash2, MailCheck, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { WaybillStatus } from '@/lib/mock-data';

export default function WaybillList() {
  const { waybills, total, loading, page, setPage, setKeyword, setStatusFilter: ctxSetStatusFilter, deleteWaybill, updateReceiptStatus, useApi } = useWaybills();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 同步搜索和筛选到context
  useEffect(() => {
    const timer = setTimeout(() => {
      ctxSetStatusFilter(statusFilter === 'all' ? '' : statusFilter);
      setKeyword(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    if (useApi) return waybills;
    return waybills.filter(wb => {
      const matchSearch = !search ||
        wb.waybillNo.toLowerCase().includes(search.toLowerCase()) ||
        wb.receiverName.includes(search) ||
        wb.senderName.includes(search) ||
        wb.goodsName.includes(search);
      const matchStatus = statusFilter === 'all' || wb.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [waybills, search, statusFilter, useApi]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteWaybill(deleteId);
      toast.success('运单已删除');
      setDeleteId(null);
    }
  };

  const handleReceiptAction = async (id: number, action: '已寄出' | '已签收') => {
    await updateReceiptStatus(id, action);
    toast.success(`回单状态已更新为“${action}”`);
  };

  const statuses: WaybillStatus[] = ['待调度', '已调度', '运输中', '已到货', '派送中', '已签收', '异常'];

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'DM Sans' }}>运单管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">共 {useApi ? total : filtered.length} 条运单{loading ? ' · 加载中...' : ''}</p>
          </div>
          <Button onClick={() => navigate('/waybills/create')} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            新建运单
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索运单号、收发货人、货物..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-card text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-card text-sm">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">运单号</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">发货方</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">收货人</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">货物</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">件/重/体</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">运费</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">代收货款</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">付款方式</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">到站</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">状态</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">回单</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">创建时间</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wb) => (
                  <tr key={wb.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => navigate(`/waybills/${wb.id}`)}
                        className="font-mono text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {wb.waybillNo}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-foreground max-w-[140px] truncate" title={wb.senderName}>{wb.senderName}</td>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{wb.receiverName}</td>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{wb.goodsName}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                      {wb.quantity}件 / {wb.weight}kg / {wb.volume}m³
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-foreground whitespace-nowrap">
                      ¥{Number(wb.freightFee || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground whitespace-nowrap">
                      {(wb.codAmount ?? 0) > 0 ? `¥${Number(wb.codAmount).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{wb.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{wb.destOrgName || '-'}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={wb.status} /></td>
                    <td className="px-4 py-2.5"><ReceiptBadge status={wb.receiptStatus} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">{wb.createdAt}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/waybills/${wb.id}`)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/waybills/${wb.id}/edit`)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {wb.receiptStatus === '待寄出' && (
                          <button
                            onClick={() => handleReceiptAction(wb.id, '已寄出')}
                            className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                            title="回单已寄出"
                          >
                            <MailCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {wb.receiptStatus === '已寄出' && (
                          <button
                            onClick={() => handleReceiptAction(wb.id, '已签收')}
                            className="p-1.5 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
                            title="回单已签收"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(wb.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-muted-foreground">
                      {loading ? '加载中...' : '暂无运单数据'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* 分页 */}
          {useApi && total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">第 {page} 页，共 {total} 条</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>此操作不可撤销，确定要删除该运单吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '待调度': 'bg-slate-100 text-slate-600',
    '已调度': 'bg-blue-50 text-blue-600',
    '运输中': 'bg-amber-50 text-amber-600',
    '已到货': 'bg-cyan-50 text-cyan-600',
    '派送中': 'bg-indigo-50 text-indigo-600',
    '已签收': 'bg-emerald-50 text-emerald-600',
    '异常': 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function ReceiptBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '待寄出': 'bg-slate-100 text-slate-500',
    '已寄出': 'bg-blue-50 text-blue-600',
    '已签收': 'bg-emerald-50 text-emerald-600',
    '无需回单': 'bg-gray-50 text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
