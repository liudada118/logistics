// 财务管理 - 应收/应付/代收货款/结算
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { financeApi } from '@/lib/api';
import { Search, DollarSign, CheckCircle, XCircle, TrendingUp, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';

const typeOptions = ['应收', '应付', '代收货款'] as const;
const statusOptions = ['待结算', '已结算', '已核销', '已取消'] as const;

const statusColor: Record<string, string> = {
  '待结算': 'bg-amber-100 text-amber-700',
  '已结算': 'bg-emerald-100 text-emerald-700',
  '已核销': 'bg-blue-100 text-blue-700',
  '已取消': 'bg-gray-100 text-gray-500',
};

const typeColor: Record<string, string> = {
  '应收': 'bg-blue-100 text-blue-700',
  '应付': 'bg-orange-100 text-orange-700',
  '代收货款': 'bg-purple-100 text-purple-700',
};

export default function Finance() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: number; action: 'settle' | 'cancel' | 'verify' }>({ open: false, id: 0, action: 'settle' });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financeApi.list({
        page,
        size: 20,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        keyword: search || undefined,
      });
      setRecords(result.records);
      setTotal(result.total);
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await financeApi.summary();
      setSummary(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSettle = async (id: number) => {
    try {
      await financeApi.settle(id);
      toast.success('结算成功');
      fetchRecords();
      fetchSummary();
    } catch (e: any) {
      toast.error(e.message);
    }
    setConfirmDialog({ open: false, id: 0, action: 'settle' });
  };

  const handleCancel = async (id: number) => {
    try {
      await financeApi.cancel(id);
      toast.success('已取消');
      fetchRecords();
      fetchSummary();
    } catch (e: any) {
      toast.error(e.message);
    }
    setConfirmDialog({ open: false, id: 0, action: 'cancel' });
  };

  const handleVerify = async (id: number) => {
    try {
      await financeApi.verify(id);
      toast.success('核销成功');
      fetchRecords();
      fetchSummary();
    } catch (e: any) {
      toast.error(e.message);
    }
    setConfirmDialog({ open: false, id: 0, action: 'settle' });
  };

  const handleBatchSettle = async () => {
    if (selectedIds.length === 0) { toast.error('请选择要结算的记录'); return; }
    try {
      await financeApi.batchSettle(selectedIds);
      toast.success(`批量结算成功，共 ${selectedIds.length} 条`);
      setSelectedIds([]);
      fetchRecords();
      fetchSummary();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBatchVerify = async () => {
    if (selectedIds.length === 0) { toast.error('请选择要核销的记录'); return; }
    try {
      await financeApi.batchVerify(selectedIds);
      toast.success(`批量核销成功，共 ${selectedIds.length} 条`);
      setSelectedIds([]);
      fetchRecords();
      fetchSummary();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const pendingIds = records.filter(r => r.status === '待结算').map(r => r.id);
    if (pendingIds.every(id => selectedIds.includes(id))) {
      setSelectedIds(prev => prev.filter(id => !pendingIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pendingIds])));
    }
  };

  // 从summary中提取统计数据
  const getPendingTotal = (type: string) => {
    if (!summary?.pending) return 0;
    const item = summary.pending.find((p: any) => p.type === type);
    return item ? Number(item.total) : 0;
  };

  const getPendingCount = (type: string) => {
    if (!summary?.pending) return 0;
    const item = summary.pending.find((p: any) => p.type === type);
    return item ? Number(item.count) : 0;
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">财务管理</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBatchSettle} disabled={selectedIds.length === 0}>
              <CheckCircle className="w-4 h-4 mr-1" />批量结算 ({selectedIds.length})
            </Button>
            <Button size="sm" variant="outline" onClick={handleBatchVerify} disabled={selectedIds.length === 0}>
              批量核销 ({selectedIds.length})
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">待结算应收</div>
            <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">¥{getPendingTotal('应收').toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{getPendingCount('应收')} 笔</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">待结算应付</div>
            <div className="text-2xl font-bold text-orange-600 mt-1 tabular-nums">¥{getPendingTotal('应付').toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{getPendingCount('应付')} 笔</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">待结算代收</div>
            <div className="text-2xl font-bold text-purple-600 mt-1 tabular-nums">¥{getPendingTotal('代收货款').toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{getPendingCount('代收货款')} 笔</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground">总记录数</div>
            <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">{total}</div>
            <div className="text-xs text-muted-foreground mt-0.5">笔</div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索运单号/客户名称..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 表格 */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" onChange={toggleSelectAll}
                      checked={records.filter(r => r.status === '待结算').length > 0 &&
                        records.filter(r => r.status === '待结算').every(r => selectedIds.includes(r.id))}
                      className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">运单号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">类型</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">付款方式</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">客户</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">网点</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">创建时间</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      {r.status === '待结算' && (
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs tabular-nums">{r.waybillNo}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[r.type] || 'bg-gray-100 text-gray-600'}`}>{r.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">¥{Number(r.amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-foreground">{r.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-foreground truncate max-w-[150px]">{r.customerName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.orgName}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {r.status === '待结算' && (
                          <>
                            <button
                              onClick={() => setConfirmDialog({ open: true, id: r.id, action: 'settle' })}
                              className="p-1.5 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
                              title="确认结算"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDialog({ open: true, id: r.id, action: 'cancel' })}
                              className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                              title="取消"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {r.status === '已结算' && (
                          <button
                            onClick={() => setConfirmDialog({ open: true, id: r.id, action: 'verify' })}
                            className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                            title="核销"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      {loading ? '加载中...' : '暂无财务数据'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* 分页 */}
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">共 {total} 条</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 确认对话框 */}
      <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, id: 0, action: 'settle' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.action === 'settle' ? '确认结算' : '确认取消'}</DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'settle' ? '确定要结算该财务记录吗？' : confirmDialog.action === 'verify' ? '确定要核销该财务记录吗？核销后将标记为已完成。' : '确定要取消该财务记录吗？此操作不可撤销。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, id: 0, action: 'settle' })}>取消</Button>
            <Button
              variant={confirmDialog.action === 'cancel' ? 'destructive' : 'default'}
              onClick={() => confirmDialog.action === 'settle' ? handleSettle(confirmDialog.id) : confirmDialog.action === 'verify' ? handleVerify(confirmDialog.id) : handleCancel(confirmDialog.id)}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
