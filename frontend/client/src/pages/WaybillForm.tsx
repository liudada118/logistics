import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { waybillApi, baseDataApi } from '@/lib/api';
import { useLocation, useRoute } from 'wouter';
import { Save, RotateCcw, Printer, ArrowLeft } from 'lucide-react';

export default function WaybillForm() {
  const [, navigate] = useLocation();
  const [matchEdit, paramsEdit] = useRoute('/waybills/:id/edit');
  const editId = matchEdit ? Number(paramsEdit?.id) : null;
  const isEdit = !!editId;

  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    senderName: '', senderPhone: '', senderAddress: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
    originId: '', destId: '',
    goodsName: '', goodsNo: '', quantity: '1', weight: '', volume: '',
    freight: '', deliveryFee: '', insuranceFee: '', packingFee: '', otherFee: '',
    payMethod: '现付',
    remark: '',
  });

  useEffect(() => {
    baseDataApi.allOrgs().then(setOrgs).catch(() => {});
    if (editId) {
      setLoading(true);
      waybillApi.get(editId).then(data => {
        setForm({
          senderName: data.senderName || '', senderPhone: data.senderPhone || '', senderAddress: data.senderAddress || '',
          receiverName: data.receiverName || '', receiverPhone: data.receiverPhone || '', receiverAddress: data.receiverAddress || '',
          originId: String(data.originId || ''), destId: String(data.destId || ''),
          goodsName: data.goodsName || '', goodsNo: data.goodsNo || '', quantity: String(data.quantity || 1),
          weight: String(data.weight || ''), volume: String(data.volume || ''),
          freight: String(data.freight || ''), deliveryFee: String(data.deliveryFee || ''),
          insuranceFee: String(data.insuranceFee || ''), packingFee: String(data.packingFee || ''),
          otherFee: String(data.otherFee || ''), payMethod: data.payMethod || '现付', remark: data.remark || '',
        });
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [editId]);

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const totalFee = [form.freight, form.deliveryFee, form.insuranceFee, form.packingFee, form.otherFee]
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  const handleSubmit = async () => {
    if (!form.senderName || !form.receiverName) { alert('请填写发货人和收货人信息'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        originId: form.originId ? Number(form.originId) : undefined,
        destId: form.destId ? Number(form.destId) : undefined,
        quantity: Number(form.quantity) || 1,
        weight: parseFloat(form.weight) || undefined,
        volume: parseFloat(form.volume) || undefined,
        freight: parseFloat(form.freight) || 0,
        deliveryFee: parseFloat(form.deliveryFee) || 0,
        insuranceFee: parseFloat(form.insuranceFee) || 0,
        packingFee: parseFloat(form.packingFee) || 0,
        otherFee: parseFloat(form.otherFee) || 0,
      };
      if (isEdit) {
        await waybillApi.update(editId!, payload);
      } else {
        await waybillApi.create(payload);
      }
      navigate('/waybills');
    } catch (e: any) {
      alert(e.message || '保存失败');
    } finally { setSaving(false); }
  };

  const handleReset = () => {
    if (!isEdit) {
      setForm({ senderName: '', senderPhone: '', senderAddress: '', receiverName: '', receiverPhone: '', receiverAddress: '', originId: '', destId: '', goodsName: '', goodsNo: '', quantity: '1', weight: '', volume: '', freight: '', deliveryFee: '', insuranceFee: '', packingFee: '', otherFee: '', payMethod: '现付', remark: '' });
    }
  };

  const InputField = ({ label, value, onChange, placeholder, required, type = 'text', className = '' }: any) => (
    <div className={`flex items-center gap-1 ${className}`}>
      <label className="text-xs text-gray-600 whitespace-nowrap w-16 text-right shrink-0">
        {required && <span className="text-red-500">*</span>}{label}:
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 min-w-0" />
    </div>
  );

  const SelectField = ({ label, value, onChange, options, required }: any) => (
    <div className="flex items-center gap-1">
      <label className="text-xs text-gray-600 whitespace-nowrap w-16 text-right shrink-0">
        {required && <span className="text-red-500">*</span>}{label}:
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 min-w-0">
        <option value="">请选择</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        {/* 顶部操作栏 */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/waybills')} className="h-7 px-2 text-xs bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />返回
            </button>
            <h2 className="text-sm font-bold text-gray-800">{isEdit ? '修改运单' : '受理开单'}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleReset} className="h-7 px-3 text-xs bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />重置
            </button>
            <button className="h-7 px-3 text-xs bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
              <Printer className="w-3 h-3" />打印
            </button>
            <button onClick={handleSubmit} disabled={saving} className="h-7 px-4 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-1">
              <Save className="w-3 h-3" />{saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 表单主体 */}
        <div className="flex-1 mx-3 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">加载中...</div>
          ) : (
            <div className="space-y-3">
              {/* 发货信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">发货信息</div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  <SelectField label="发站" value={form.originId} onChange={(v: string) => setField('originId', v)} required
                    options={orgs.map(o => ({ label: o.name, value: String(o.id) }))} />
                  <InputField label="发货人" value={form.senderName} onChange={(v: string) => setField('senderName', v)} placeholder="发货人姓名" required />
                  <InputField label="电话" value={form.senderPhone} onChange={(v: string) => setField('senderPhone', v)} placeholder="发货人电话" />
                  <InputField label="地址" value={form.senderAddress} onChange={(v: string) => setField('senderAddress', v)} placeholder="发货人地址" className="col-span-2" />
                </div>
              </div>

              {/* 收货信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">收货信息</div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  <SelectField label="到站" value={form.destId} onChange={(v: string) => setField('destId', v)} required
                    options={orgs.map(o => ({ label: o.name, value: String(o.id) }))} />
                  <InputField label="收货人" value={form.receiverName} onChange={(v: string) => setField('receiverName', v)} placeholder="收货人姓名" required />
                  <InputField label="电话" value={form.receiverPhone} onChange={(v: string) => setField('receiverPhone', v)} placeholder="收货人电话" />
                  <InputField label="地址" value={form.receiverAddress} onChange={(v: string) => setField('receiverAddress', v)} placeholder="收货地址" className="col-span-2" />
                </div>
              </div>

              {/* 货物信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">货物信息</div>
                <div className="p-3 grid grid-cols-4 gap-3">
                  <InputField label="品名" value={form.goodsName} onChange={(v: string) => setField('goodsName', v)} placeholder="货物品名" />
                  <InputField label="货号" value={form.goodsNo} onChange={(v: string) => setField('goodsNo', v)} placeholder="货号" />
                  <InputField label="件数" value={form.quantity} onChange={(v: string) => setField('quantity', v)} type="number" />
                  <InputField label="重量" value={form.weight} onChange={(v: string) => setField('weight', v)} placeholder="kg" type="number" />
                  <InputField label="体积" value={form.volume} onChange={(v: string) => setField('volume', v)} placeholder="m³" type="number" />
                </div>
              </div>

              {/* 费用信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">费用信息</div>
                <div className="p-3 grid grid-cols-4 gap-3">
                  <InputField label="运费" value={form.freight} onChange={(v: string) => setField('freight', v)} placeholder="0.00" type="number" />
                  <InputField label="送货费" value={form.deliveryFee} onChange={(v: string) => setField('deliveryFee', v)} placeholder="0.00" type="number" />
                  <InputField label="保价费" value={form.insuranceFee} onChange={(v: string) => setField('insuranceFee', v)} placeholder="0.00" type="number" />
                  <InputField label="包装费" value={form.packingFee} onChange={(v: string) => setField('packingFee', v)} placeholder="0.00" type="number" />
                  <InputField label="其他费" value={form.otherFee} onChange={(v: string) => setField('otherFee', v)} placeholder="0.00" type="number" />
                  <SelectField label="付款方式" value={form.payMethod} onChange={(v: string) => setField('payMethod', v)}
                    options={[{ label: '现付', value: '现付' }, { label: '提付', value: '提付' }, { label: '月结', value: '月结' }, { label: '回单付', value: '回单付' }]} />
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-600 whitespace-nowrap w-16 text-right shrink-0">费用合计:</label>
                    <span className="text-sm font-bold text-red-600">¥{totalFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-2 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">备注</div>
                <div className="p-3">
                  <textarea value={form.remark} onChange={e => setField('remark', e.target.value)} placeholder="请输入备注信息"
                    className="w-full h-16 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 resize-none" />
                </div>
              </div>

              <div className="h-3" />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
