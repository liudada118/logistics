import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { exceptionApi } from '@/lib/api';
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
import { AlertTriangle, Search, ShieldAlert, Clock, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const exceptionTypes = ['货损', '货差', '延误', '丢失', '错发', '客户投诉', '其他'];
const severities = ['轻微', '一般', '严重'];
const handleStatuses = ['待处理', '处理中', '已处理', '已关闭'];

export default function ExceptionManage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showHandle, setShowHandle] = useState<any>(null);
  const [confirmClose, setConfirmClose] = useState<any>(null);
  const [form, setForm] = useState({
    waybillId: '' as any,
    exceptionType: '货损',
    severity: '一般',
    description: '',
  });
  const [handleForm, setHandleForm] = useState({ handleResult: '', handleAmount: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exceptionApi.list({
        page, size: 20, keyword,
        exceptionType: filterType === 'all' ? '' : filterType,
        handleStatus: filterStatus === 'all' ? '' : filterStatus,
      });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, filterType, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.description) { toast.error('请填写异常描述'); return; }
    try {
      await exceptionApi.create(form);
      toast.success('异常登记成功');
      setShowCreate(false);
      setForm({ waybillId: '', exceptionType: '货损', severity: '一般', description: '' });
      fetchData();
    } catch (e: any) { toast.error(e.message || '登记失败'); }
  };

  const handleProcess = async () => {
    if (!handleForm.handleResult) { toast.error('请填写处理结果'); return; }
    try {
      await exceptionApi.handle(showHandle.id, handleForm);
      toast.success('异常处理成功');
      setShowHandle(null);
      fetchData();
    } catch (e: any) { toast.error(e.message || '处理失败'); }
  };

  const handleClose = async () => {
    if (!confirmClose) return;
    try {
      await exceptionApi.close(confirmClose.id);
      toast.success('异常已关闭');
      setConfirmClose(null);
      fetchData();
    } catch (e: any) { toast.error(e.message || '关闭失败'); }
  };

  // 统计
  const stats = {
    total: total,
    pending: records.filter(r => r.handleStatus === '待处理').length,
    processing: records.filter(r => r.handleStatus === '处理中').length,
    resolved: records.filter(r => r.handleStatus === '已处理' || r.handleStatus === '已关闭').length,
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'DM Sans' }}>异常管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">共 {total} 条异常记录{loading ? ' · 加载中...' : ''}</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-700 text-white shrink-0">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            异常登记
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">异常总数</p>
                <p className="text-lg font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">待处理</p>
                <p className="text-lg font-bold text-red-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">处理中</p>
                <p className="text-lg font-bold text-amber-600">{stats.processing}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已解决</p>
                <p className="text-lg font-bold text-emerald-600">{stats.resolved}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索运单号、异常描述..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-9 bg-card text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9 bg-card text-sm">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {exceptionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9 bg-card text-sm">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {handleStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">异常类型</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">严重程度</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">描述</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">处理状态</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">理赔金额</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">登记时间</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">暂无异常记录</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-medium text-blue-600">{r.waybillNo || '-'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground text-xs whitespace-nowrap">{r.exceptionType}</td>
                    <td className="px-4 py-2.5"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-4 py-2.5 text-foreground text-xs max-w-[200px] truncate" title={r.description}>{r.description}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.handleStatus} /></td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground whitespace-nowrap">
                      {r.handleAmount > 0 ? `¥${Number(r.handleAmount).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">{r.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {r.handleStatus === '待处理' && (
                          <button
                            onClick={() => { setShowHandle(r); setHandleForm({ handleResult: '', handleAmount: 0 }); }}
                            className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                            title="处理"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.handleStatus === '已处理' && (
                          <button
                            onClick={() => setConfirmClose(r)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="关闭"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
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

      {/* 异常登记对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>异常登记</DialogTitle>
            <DialogDescription>登记运输过程中的异常情况</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>关联运单ID（可选）</Label>
              <Input type="number" value={form.waybillId} onChange={e => setForm({ ...form, waybillId: e.target.value })}
                placeholder="输入运单ID" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>异常类型</Label>
                <Select value={form.exceptionType} onValueChange={v => setForm({ ...form, exceptionType: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {exceptionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>严重程度</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {severities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>异常描述 <span className="text-red-500">*</span></Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1.5" rows={3} placeholder="请详细描述异常情况..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} className="bg-red-600 hover:bg-red-700 text-white">确认登记</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 处理异常对话框 */}
      <Dialog open={showHandle !== null} onOpenChange={() => setShowHandle(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>处理异常</DialogTitle>
            <DialogDescription>运单 {showHandle?.waybillNo} 的异常处理</DialogDescription>
          </DialogHeader>
          {showHandle && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">类型：</span>{showHandle.exceptionType}
                  <span className="mx-2">|</span>
                  <span className="font-medium text-foreground">严重程度：</span>{showHandle.severity}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">描述：</span>{showHandle.description}
                </p>
              </div>
              <div>
                <Label>处理结果 <span className="text-red-500">*</span></Label>
                <Textarea value={handleForm.handleResult} onChange={e => setHandleForm({ ...handleForm, handleResult: e.target.value })}
                  className="mt-1.5" rows={3} placeholder="请填写处理结果..." />
              </div>
              <div>
                <Label>理赔金额</Label>
                <Input type="number" step="0.01" value={handleForm.handleAmount}
                  onChange={e => setHandleForm({ ...handleForm, handleAmount: +e.target.value })}
                  className="mt-1.5" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandle(null)}>取消</Button>
            <Button onClick={handleProcess} className="bg-blue-600 hover:bg-blue-700 text-white">确认处理</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关闭确认对话框 */}
      <Dialog open={confirmClose !== null} onOpenChange={() => setConfirmClose(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认关闭</DialogTitle>
            <DialogDescription>
              确定要关闭运单 <span className="font-mono font-medium text-foreground">{confirmClose?.waybillNo}</span> 的异常记录吗？关闭后将不可再修改。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(null)}>取消</Button>
            <Button variant="destructive" onClick={handleClose}>确认关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    '轻微': 'bg-slate-100 text-slate-600',
    '一般': 'bg-amber-50 text-amber-600',
    '严重': 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[severity] || 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '待处理': 'bg-red-50 text-red-600',
    '处理中': 'bg-amber-50 text-amber-600',
    '已处理': 'bg-emerald-50 text-emerald-600',
    '已关闭': 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
