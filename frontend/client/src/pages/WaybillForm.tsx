import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { useWaybills } from '@/contexts/WaybillContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { baseDataApi } from '@/lib/api';

const paymentMethods = ['现付', '提付', '回单付', '月结', '货款扣'];
const packingTypes = ['纸箱', '木箱', '编织袋', '泡沫箱', '铁架', '裸装', '其他'];
const deliveryMethods = ['自提', '送货上门', '代理中转'];

export default function WaybillForm() {
  const params = useParams<{ id: string }>();
  const isEdit = !!params.id;
  const { getWaybill, createWaybill, updateWaybill } = useWaybills();
  const [, navigate] = useLocation();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [form, setForm] = useState({
    senderCustomerId: 0,
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    originOrgId: 0,
    originOrgName: '',
    transitOrgId: 0,
    transitOrgName: '',
    destOrgId: 0,
    destOrgName: '',
    goodsName: '',
    packingType: '纸箱',
    quantity: 1,
    weight: 0,
    volume: 0,
    paymentMethod: '现付',
    freightFee: 0,
    baseFreight: 0,
    insuranceFee: 0,
    pickupFee: 0,
    deliveryFee: 0,
    packingFee: 0,
    otherFee: 0,
    codAmount: 0,
    receiptRequired: 0,
    receiptCount: 0,
    deliveryMethod: '自提',
    remark: '',
  });

  // 自动计算总运费
  const totalFee = form.baseFreight + form.insuranceFee + form.pickupFee + form.deliveryFee + form.packingFee + form.otherFee;

  useEffect(() => {
    setForm(prev => ({ ...prev, freightFee: totalFee }));
  }, [totalFee]);

  // 加载网点和客户列表
  useEffect(() => {
    baseDataApi.allOrgs().then(setOrgs).catch(() => setOrgs([]));
    baseDataApi.listCustomers({ page: 1, size: 1000 }).then(r => setCustomers(r.records || [])).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    if (isEdit && params.id) {
      const wb = getWaybill(Number(params.id));
      if (wb) {
        setForm({
          senderCustomerId: wb.senderCustomerId || 0,
          senderName: wb.senderName || '',
          senderPhone: wb.senderPhone || '',
          senderAddress: wb.senderAddress || '',
          receiverName: wb.receiverName || '',
          receiverPhone: wb.receiverPhone || '',
          receiverAddress: wb.receiverAddress || '',
          originOrgId: wb.originOrgId || 0,
          originOrgName: wb.originOrgName || '',
          transitOrgId: wb.transitOrgId || 0,
          transitOrgName: wb.transitOrgName || '',
          destOrgId: wb.destOrgId || 0,
          destOrgName: wb.destOrgName || '',
          goodsName: wb.goodsName || '',
          packingType: wb.packingType || '纸箱',
          quantity: wb.quantity || 1,
          weight: wb.weight || 0,
          volume: wb.volume || 0,
          paymentMethod: wb.paymentMethod || '现付',
          freightFee: wb.freightFee || 0,
          baseFreight: wb.baseFreight || 0,
          insuranceFee: wb.insuranceFee || 0,
          pickupFee: wb.pickupFee || 0,
          deliveryFee: wb.deliveryFee || 0,
          packingFee: wb.packingFee || 0,
          otherFee: wb.otherFee || 0,
          codAmount: wb.codAmount || 0,
          receiptRequired: wb.receiptRequired || 0,
          receiptCount: wb.receiptCount || 0,
          deliveryMethod: wb.deliveryMethod || '自提',
          remark: wb.remark || '',
        });
      }
    }
  }, [isEdit, params.id, getWaybill]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === Number(customerId));
    if (customer) {
      setForm(prev => ({
        ...prev,
        senderCustomerId: customer.id,
        senderName: customer.name,
        senderPhone: customer.phone || customer.contactPhone || '',
        senderAddress: customer.address || '',
      }));
    }
  };

  const handleOrgChange = (field: 'originOrgId' | 'transitOrgId' | 'destOrgId', orgId: string) => {
    const org = orgs.find(o => o.id === Number(orgId));
    const nameField = field.replace('Id', 'Name') as 'originOrgName' | 'transitOrgName' | 'destOrgName';
    setForm(prev => ({
      ...prev,
      [field]: Number(orgId),
      [nameField]: org?.name || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.senderName || !form.receiverName || !form.goodsName) {
      toast.error('请填写必填字段：发货方、收货人、货物名称');
      return;
    }

    try {
      if (isEdit && params.id) {
        await updateWaybill(Number(params.id), form);
        toast.success('运单已更新');
        navigate(`/waybills/${params.id}`);
      } else {
        const newWb = await createWaybill(form);
        toast.success(`运单 ${newWb?.waybillNo || ''} 创建成功`);
        navigate('/waybills');
      }
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(isEdit ? `/waybills/${params.id}` : '/waybills')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'DM Sans' }}>
              {isEdit ? '编辑运单' : '受理开单'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? '修改运单信息' : '填写运单信息，创建新运单'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 站点信息 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">站点信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">发站</Label>
                <Select value={form.originOrgId ? String(form.originOrgId) : ''} onValueChange={v => handleOrgChange('originOrgId', v)}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue placeholder="选择发站" /></SelectTrigger>
                  <SelectContent>{orgs.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">中转地</Label>
                <Select value={form.transitOrgId ? String(form.transitOrgId) : '0'} onValueChange={v => handleOrgChange('transitOrgId', v)}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue placeholder="无中转" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">无中转</SelectItem>
                    {orgs.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">到站</Label>
                <Select value={form.destOrgId ? String(form.destOrgId) : ''} onValueChange={v => handleOrgChange('destOrgId', v)}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue placeholder="选择到站" /></SelectTrigger>
                  <SelectContent>{orgs.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 发货信息 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">发货信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">选择客户</Label>
                <Select value={form.senderCustomerId ? String(form.senderCustomerId) : ''} onValueChange={handleCustomerChange}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue placeholder="选择发货客户" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">发货方名称 *</Label>
                <Input value={form.senderName} onChange={e => setForm(p => ({ ...p, senderName: e.target.value }))} className="h-9 text-sm" placeholder="发货公司/个人名称" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">联系电话</Label>
                <Input value={form.senderPhone} onChange={e => setForm(p => ({ ...p, senderPhone: e.target.value }))} className="h-9 text-sm" placeholder="联系电话" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">发货地址</Label>
                <Input value={form.senderAddress} onChange={e => setForm(p => ({ ...p, senderAddress: e.target.value }))} className="h-9 text-sm" placeholder="详细地址" />
              </div>
            </div>
          </div>

          {/* 收货信息 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">收货信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">收货人 *</Label>
                <Input value={form.receiverName} onChange={e => setForm(p => ({ ...p, receiverName: e.target.value }))} className="h-9 text-sm" placeholder="收货人姓名" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">联系电话</Label>
                <Input value={form.receiverPhone} onChange={e => setForm(p => ({ ...p, receiverPhone: e.target.value }))} className="h-9 text-sm" placeholder="收货人电话" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs text-muted-foreground">收货地址</Label>
                <Input value={form.receiverAddress} onChange={e => setForm(p => ({ ...p, receiverAddress: e.target.value }))} className="h-9 text-sm" placeholder="详细收货地址" />
              </div>
            </div>
          </div>

          {/* 货物信息 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">货物信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">货物名称 *</Label>
                <Input value={form.goodsName} onChange={e => setForm(p => ({ ...p, goodsName: e.target.value }))} className="h-9 text-sm" placeholder="货物名称" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">包装类型</Label>
                <Select value={form.packingType} onValueChange={v => setForm(p => ({ ...p, packingType: v }))}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{packingTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">件数</Label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">重量 (kg)</Label>
                <Input type="number" min={0} step={0.1} value={form.weight} onChange={e => setForm(p => ({ ...p, weight: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">体积 (m³)</Label>
                <Input type="number" min={0} step={0.01} value={form.volume} onChange={e => setForm(p => ({ ...p, volume: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">交接方式</Label>
                <Select value={form.deliveryMethod} onValueChange={v => setForm(p => ({ ...p, deliveryMethod: v }))}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{deliveryMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 费用明细 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">费用明细</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">付款方式</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">基本运费</Label>
                <Input type="number" min={0} step={0.01} value={form.baseFreight} onChange={e => setForm(p => ({ ...p, baseFreight: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">保险费</Label>
                <Input type="number" min={0} step={0.01} value={form.insuranceFee} onChange={e => setForm(p => ({ ...p, insuranceFee: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">接货费</Label>
                <Input type="number" min={0} step={0.01} value={form.pickupFee} onChange={e => setForm(p => ({ ...p, pickupFee: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">送货费</Label>
                <Input type="number" min={0} step={0.01} value={form.deliveryFee} onChange={e => setForm(p => ({ ...p, deliveryFee: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">包装费</Label>
                <Input type="number" min={0} step={0.01} value={form.packingFee} onChange={e => setForm(p => ({ ...p, packingFee: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">其他费用</Label>
                <Input type="number" min={0} step={0.01} value={form.otherFee} onChange={e => setForm(p => ({ ...p, otherFee: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-bold">总运费 (自动计算)</Label>
                <div className="h-9 flex items-center px-3 bg-blue-50 border border-blue-200 rounded-md text-sm font-bold text-blue-700 tabular-nums">
                  ¥ {totalFee.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* 代收货款与回单 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">代收货款与回单</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">代收货款 (元)</Label>
                <Input type="number" min={0} step={0.01} value={form.codAmount} onChange={e => setForm(p => ({ ...p, codAmount: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
                <p className="text-[10px] text-muted-foreground">代收货款将在签收后从收货方收取并返还给发货方</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">是否需要回单</Label>
                <Select value={String(form.receiptRequired)} onValueChange={v => setForm(p => ({ ...p, receiptRequired: Number(v) }))}>
                  <SelectTrigger className="h-9 bg-background text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不需要</SelectItem>
                    <SelectItem value="1">需要</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.receiptRequired === 1 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">回单份数</Label>
                  <Input type="number" min={1} value={form.receiptCount} onChange={e => setForm(p => ({ ...p, receiptCount: Number(e.target.value) }))} className="h-9 text-sm tabular-nums" />
                </div>
              )}
            </div>
          </div>

          {/* 备注 */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">备注</h2>
            <Textarea
              value={form.remark}
              onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
              placeholder="运单备注信息（可选）"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-1.5" />
              {isEdit ? '保存修改' : '创建运单'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/waybills/${params.id}` : '/waybills')}>
              取消
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
