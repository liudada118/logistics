import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { signApi } from '@/lib/api';
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
import { ClipboardCheck, Search, RotateCcw, PackageCheck, Truck, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const signTypes = ['本人签收', '代签', '拒签', '部分签收'];
const deliveryMethods = ['自提', '送货上门', '代理中转'];

export default function SignManage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [confirmUnsign, setConfirmUnsign] = useState<any>(null);
  const [form, setForm] = useState({
    waybillId: '' as any,
    waybillNo: '',
    signType: '本人签收',
    signerName: '',
    signerPhone: '',
    signQuantity: 1,
    damageQuantity: 0,
    shortageQuantity: 0,
    deliveryMethod: '自提',
    signRemark: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await signApi.list({ page, size: 20, keyword, signType: filterType === 'all' ? '' : filterType });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSign = async () => {
    if (!form.waybillId || !form.signerName) {
      toast.error('请填写运单ID和签收人');
      return;
    }
    try {
      await signApi.sign({
        waybillId: +form.waybillId,
        signType: form.signType,
        signerName: form.signerName,
        signerPhone: form.signerPhone,
        signQuantity: form.signQuantity,
        damageQuantity: form.damageQuantity,
        shortageQuantity: form.shortageQuantity,
        deliveryMethod: form.deliveryMethod,
        signRemark: form.signRemark,
      });
      toast.success('签收登记成功');
      setShowDialog(false);
      setForm({ waybillId: '', waybillNo: '', signType: '本人签收', signerName: '', signerPhone: '', signQuantity: 1, damageQuantity: 0, shortageQuantity: 0, deliveryMethod: '自提', signRemark: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || '签收失败');
    }
  };

  const handleUnsign = async () => {
    if (!confirmUnsign) return;
    try {
      await signApi.unsign(confirmUnsign.waybillId);
      toast.success('反签收成功');
      setConfirmUnsign(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || '反签收失败');
    }
  };

  // 统计
  const stats = {
    total: total,
    signed: records.filter(r => r.signType === '本人签收' || r.signType === '代签').length,
    rejected: records.filter(r => r.signType === '拒签').length,
    partial: records.filter(r => r.signType === '部分签收').length,
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'DM Sans' }}>签收管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">共 {total} 条签收记录{loading ? ' · 加载中...' : ''}</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            <ClipboardCheck className="w-4 h-4 mr-1.5" />
            签收登记
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <PackageCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">签收总数</p>
                <p className="text-lg font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">正常签收</p>
                <p className="text-lg font-bold text-emerald-600">{stats.signed}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">拒签</p>
                <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">部分签收</p>
                <p className="text-lg font-bold text-amber-600">{stats.partial}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索运单号、签收人..."
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
              {signTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">签收类型</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">签收人</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">联系电话</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">签收件数</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">破损/短少</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">交接方式</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">签收时间</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">加载中...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">暂无签收记录</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-medium text-blue-600">{r.waybillNo}</span>
                    </td>
                    <td className="px-4 py-2.5"><SignTypeBadge type={r.signType} /></td>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{r.signerName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{r.signerPhone || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">{r.signQuantity}</td>
                    <td className="px-4 py-2.5">
                      {(r.damageQuantity > 0 || r.shortageQuantity > 0) ? (
                        <span className="text-xs text-red-600 font-medium">破损{r.damageQuantity} / 短少{r.shortageQuantity}</span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-foreground text-xs whitespace-nowrap">{r.deliveryMethod || '-'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">{r.signedAt?.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setConfirmUnsign(r)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="反签收"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
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

      {/* 签收登记对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>签收登记</DialogTitle>
            <DialogDescription>为运单登记签收信息，请填写以下内容</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>运单ID <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.waybillId} onChange={e => setForm({ ...form, waybillId: e.target.value })}
                placeholder="输入运单ID" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>签收类型</Label>
                <Select value={form.signType} onValueChange={v => setForm({ ...form, signType: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {signTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>交接方式</Label>
                <Select value={form.deliveryMethod} onValueChange={v => setForm({ ...form, deliveryMethod: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {deliveryMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>签收人 <span className="text-red-500">*</span></Label>
                <Input value={form.signerName} onChange={e => setForm({ ...form, signerName: e.target.value })}
                  className="mt-1.5" />
              </div>
              <div>
                <Label>签收人电话</Label>
                <Input value={form.signerPhone} onChange={e => setForm({ ...form, signerPhone: e.target.value })}
                  className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>签收件数</Label>
                <Input type="number" value={form.signQuantity} onChange={e => setForm({ ...form, signQuantity: +e.target.value })}
                  className="mt-1.5" />
              </div>
              <div>
                <Label>破损件数</Label>
                <Input type="number" value={form.damageQuantity} onChange={e => setForm({ ...form, damageQuantity: +e.target.value })}
                  className="mt-1.5" />
              </div>
              <div>
                <Label>短少件数</Label>
                <Input type="number" value={form.shortageQuantity} onChange={e => setForm({ ...form, shortageQuantity: +e.target.value })}
                  className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={form.signRemark} onChange={e => setForm({ ...form, signRemark: e.target.value })}
                className="mt-1.5" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSign} className="bg-emerald-600 hover:bg-emerald-700 text-white">确认签收</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 反签收确认对话框 */}
      <Dialog open={confirmUnsign !== null} onOpenChange={() => setConfirmUnsign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认反签收</DialogTitle>
            <DialogDescription>
              此操作将撤销运单 <span className="font-mono font-medium text-foreground">{confirmUnsign?.waybillNo}</span> 的签收记录，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnsign(null)}>取消</Button>
            <Button variant="destructive" onClick={handleUnsign}>确认反签收</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function SignTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    '本人签收': 'bg-emerald-50 text-emerald-600',
    '代签': 'bg-blue-50 text-blue-600',
    '拒签': 'bg-red-50 text-red-600',
    '部分签收': 'bg-amber-50 text-amber-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}
