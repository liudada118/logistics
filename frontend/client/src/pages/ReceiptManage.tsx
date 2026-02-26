import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { receiptApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Search, Send, Package, RotateCcw, CheckCircle, ArrowRight, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

const receiptActions = ['签收', '寄出', '收到', '返厂', '反签收', '反寄出'];

export default function ReceiptManage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('签收');
  const [form, setForm] = useState({
    waybillId: '' as any,
    expressNo: '',
    remark: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await receiptApi.list({ page, size: 20, keyword, action: filterAction === 'all' ? '' : filterAction });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, filterAction]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAction = (action: string) => {
    setDialogAction(action);
    setForm({ waybillId: '', expressNo: '', remark: '' });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.waybillId) { toast.error('请输入运单ID'); return; }
    const data = { operatorId: 1, operatorName: '管理员', orgId: 1, remark: form.remark, expressNo: form.expressNo };
    try {
      switch (dialogAction) {
        case '签收': await receiptApi.signReceipt(+form.waybillId, data); break;
        case '寄出': await receiptApi.sendReceipt(+form.waybillId, data); break;
        case '收到': await receiptApi.receiveReceipt(+form.waybillId, data); break;
        case '返厂': await receiptApi.returnReceipt(+form.waybillId, data); break;
        case '反签收': await receiptApi.unsignReceipt(+form.waybillId, data); break;
        case '反寄出': await receiptApi.unsendReceipt(+form.waybillId, data); break;
      }
      toast.success(`回单${dialogAction}操作成功`);
      setShowDialog(false);
      fetchData();
    } catch (e: any) { toast.error(e.message || '操作失败'); }
  };

  // 统计
  const actionCounts = receiptActions.reduce((acc, a) => {
    acc[a] = records.filter(r => r.action === a).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'DM Sans' }}>回单管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">共 {total} 条回单记录{loading ? ' · 加载中...' : ''}</p>
          </div>
          <div className="flex gap-2">
            {['签收', '寄出', '收到', '返厂'].map(a => (
              <Button key={a} size="sm" onClick={() => openAction(a)}
                className={actionButtonStyle(a)}>
                {actionIcon(a)}
                {a}
              </Button>
            ))}
          </div>
        </div>

        {/* 流程说明 */}
        <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span><strong>回单流程：</strong></span>
            <span className="flex items-center gap-1">
              待签收 <ArrowRight className="w-3 h-3" /> 已签收 <ArrowRight className="w-3 h-3" /> 已寄出 <ArrowRight className="w-3 h-3" /> 已收到 <ArrowRight className="w-3 h-3" /> 已返厂
            </span>
            <span className="text-blue-500 mx-1">|</span>
            <span><strong>反向操作：</strong>反签收、反寄出可撤销对应步骤</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {receiptActions.map(a => (
            <div key={a} className="bg-card border border-border rounded-lg p-2.5 text-center">
              <p className="text-xs text-muted-foreground">{a}</p>
              <p className={`text-lg font-bold mt-0.5 ${actionCountColor(a)}`}>{actionCounts[a] || 0}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索运单号、操作人..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-9 bg-card text-sm"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[140px] h-9 bg-card text-sm">
              <SelectValue placeholder="全部操作" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部操作</SelectItem>
              {receiptActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">操作类型</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">回单份数</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">快递单号</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">操作人</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">备注</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">操作时间</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">暂无回单记录</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-medium text-blue-600">{r.waybillNo}</span>
                    </td>
                    <td className="px-4 py-2.5"><ActionBadge action={r.action} /></td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">{r.receiptCount || '-'}</td>
                    <td className="px-4 py-2.5 text-foreground text-xs">{r.expressNo || '-'}</td>
                    <td className="px-4 py-2.5 text-foreground text-xs whitespace-nowrap">{r.operatorName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[150px] truncate" title={r.remark}>{r.remark || '-'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">{r.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 分页 */}
          {total > 20 && (
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

      {/* 操作对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>回单{dialogAction}</DialogTitle>
            <DialogDescription>
              {dialogAction === '签收' && '登记回单签收，确认收到回单'}
              {dialogAction === '寄出' && '登记回单寄出，填写快递单号'}
              {dialogAction === '收到' && '确认收到寄回的回单'}
              {dialogAction === '返厂' && '确认回单已返回发货方'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>运单ID <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.waybillId} onChange={e => setForm({ ...form, waybillId: e.target.value })}
                placeholder="输入运单ID" className="mt-1.5" />
            </div>
            {dialogAction === '寄出' && (
              <div>
                <Label>快递单号</Label>
                <Input value={form.expressNo} onChange={e => setForm({ ...form, expressNo: e.target.value })}
                  placeholder="输入快递单号" className="mt-1.5" />
              </div>
            )}
            <div>
              <Label>备注</Label>
              <Textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })}
                className="mt-1.5" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSubmit} className={actionSubmitStyle(dialogAction)}>
              确认{dialogAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    '签收': 'bg-emerald-50 text-emerald-600',
    '寄出': 'bg-blue-50 text-blue-600',
    '收到': 'bg-purple-50 text-purple-600',
    '返厂': 'bg-amber-50 text-amber-600',
    '反签收': 'bg-red-50 text-red-600',
    '反寄出': 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[action] || 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  );
}

function actionButtonStyle(action: string): string {
  switch (action) {
    case '签收': return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    case '寄出': return 'bg-blue-600 hover:bg-blue-700 text-white';
    case '收到': return 'bg-purple-600 hover:bg-purple-700 text-white';
    case '返厂': return 'bg-amber-600 hover:bg-amber-700 text-white';
    default: return 'bg-gray-600 hover:bg-gray-700 text-white';
  }
}

function actionSubmitStyle(action: string): string {
  switch (action) {
    case '签收': return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    case '寄出': return 'bg-blue-600 hover:bg-blue-700 text-white';
    case '收到': return 'bg-purple-600 hover:bg-purple-700 text-white';
    case '返厂': return 'bg-amber-600 hover:bg-amber-700 text-white';
    default: return 'bg-blue-600 hover:bg-blue-700 text-white';
  }
}

function actionIcon(action: string) {
  const cls = "w-3.5 h-3.5 mr-1";
  switch (action) {
    case '签收': return <CheckCircle className={cls} />;
    case '寄出': return <Send className={cls} />;
    case '收到': return <Package className={cls} />;
    case '返厂': return <RotateCcw className={cls} />;
    default: return null;
  }
}

function actionCountColor(action: string): string {
  switch (action) {
    case '签收': return 'text-emerald-600';
    case '寄出': return 'text-blue-600';
    case '收到': return 'text-purple-600';
    case '返厂': return 'text-amber-600';
    case '反签收': return 'text-red-600';
    case '反寄出': return 'text-red-600';
    default: return 'text-foreground';
  }
}
