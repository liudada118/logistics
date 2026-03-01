import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { waybillApi, baseDataApi } from '@/lib/api';
import { useLocation, useRoute } from 'wouter';
import { Save, RotateCcw, Printer, ArrowLeft } from 'lucide-react';

const PACKING_TYPES = ['纸箱', '木箱', '编织袋', '裸装', '托盘', '其他'];
const DELIVERY_METHODS = ['自提', '送货上门', '代理中转'];

export default function WaybillForm() {
  const [, navigate] = useLocation();
  const [matchEdit, paramsEdit] = useRoute('/waybills/:id/edit');
  const editId = matchEdit ? Number(paramsEdit?.id) : null;
  const isEdit = !!editId;

  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // 发货信息
    senderName: '', senderPhone: '', senderAddress: '',
    // 收货信息
    receiverName: '', receiverPhone: '', receiverAddress: '',
    // 站点
    originOrgId: '', transitOrgId: '', destOrgId: '',
    // 货物信息
    goodsName: '', goodsNo: '', packingType: '纸箱',
    quantity: '1', weight: '', volume: '',
    // 付款方式（T9：现付/提付/回单付/月结/货款扣 各自独立金额）
    paymentMethod: '现付',
    xianfuAmount: '',   // 现付金额
    tifuAmount: '',     // 提付金额
    huidanfuAmount: '', // 回单付金额
    yuejiAmount: '',    // 月结金额
    huokuanAmount: '',  // 货款扣金额
    // 费用明细（对齐T9）
    baseFreight: '',    // 基本运费
    freightFee: '',     // 运费合计（折扣后）
    insuranceFee: '',   // 保险费
    pickupFee: '',      // 接货费
    deliveryFee: '',    // 送货费
    packingFee: '',     // 包装费
    otherFee: '',       // 其他费
    // 代收货款
    codAmount: '',
    // 回单
    receiptRequired: '1',
    receiptCount: '1',
    // 交接方式
    deliveryMethod: '送货上门',
    remark: '',
  });

  useEffect(() => {
    baseDataApi.allOrgs().then(setOrgs).catch(() => {});
    if (editId) {
      setLoading(true);
      waybillApi.get(editId).then((data: any) => {
        setForm({
          senderName: data.senderName || '', senderPhone: data.senderPhone || '', senderAddress: data.senderAddress || '',
          receiverName: data.receiverName || '', receiverPhone: data.receiverPhone || '', receiverAddress: data.receiverAddress || '',
          originOrgId: String(data.originOrgId || ''), transitOrgId: String(data.transitOrgId || ''), destOrgId: String(data.destOrgId || ''),
          goodsName: data.goodsName || '', goodsNo: data.goodsNo || '', packingType: data.packingType || '纸箱',
          quantity: String(data.quantity || 1), weight: String(data.weight || ''), volume: String(data.volume || ''),
          paymentMethod: data.paymentMethod || '现付',
          xianfuAmount: data.paymentMethod === '现付' ? String(data.freightFee || '') : '',
          tifuAmount: data.paymentMethod === '提付' ? String(data.freightFee || '') : '',
          huidanfuAmount: data.paymentMethod === '回单付' ? String(data.freightFee || '') : '',
          yuejiAmount: data.paymentMethod === '月结' ? String(data.freightFee || '') : '',
          huokuanAmount: data.paymentMethod === '货款扣' ? String(data.freightFee || '') : '',
          baseFreight: String(data.baseFreight || ''), freightFee: String(data.freightFee || ''),
          insuranceFee: String(data.insuranceFee || ''), pickupFee: String(data.pickupFee || ''),
          deliveryFee: String(data.deliveryFee || ''), packingFee: String(data.packingFee || ''),
          otherFee: String(data.otherFee || ''), codAmount: String(data.codAmount || ''),
          receiptRequired: String(data.receiptRequired ?? 1), receiptCount: String(data.receiptCount || 1),
          deliveryMethod: data.deliveryMethod || '送货上门', remark: data.remark || '',
        });
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [editId]);

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  // 根据付款方式自动同步运费合计
  const handlePayMethodChange = (method: string) => {
    setForm(prev => ({ ...prev, paymentMethod: method }));
  };

  // 计算运费合计 = 基本运费 + 保险费 + 接货费 + 送货费 + 包装费 + 其他费
  const totalFee = [form.baseFreight, form.insuranceFee, form.pickupFee, form.deliveryFee, form.packingFee, form.otherFee]
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  // 当前付款方式对应的金额字段
  const payAmountKey: Record<string, string> = {
    '现付': 'xianfuAmount', '提付': 'tifuAmount', '回单付': 'huidanfuAmount',
    '月结': 'yuejiAmount', '货款扣': 'huokuanAmount',
  };

  const handleSubmit = async () => {
    if (!form.senderName || !form.receiverName) { alert('请填写发货人和收货人信息'); return; }
    if (!form.destOrgId) { alert('请选择到站'); return; }
    setSaving(true);
    try {
      // 根据付款方式确定运费金额
      const payKey = payAmountKey[form.paymentMethod];
      const payAmount = parseFloat((form as any)[payKey] || '0') || 0;
      const payload = {
        senderName: form.senderName, senderPhone: form.senderPhone, senderAddress: form.senderAddress,
        receiverName: form.receiverName, receiverPhone: form.receiverPhone, receiverAddress: form.receiverAddress,
        originOrgId: form.originOrgId ? Number(form.originOrgId) : undefined,
        originOrgName: form.originOrgId ? (orgs.find((o: any) => String(o.id) === String(form.originOrgId))?.name || '') : undefined,
        transitOrgId: form.transitOrgId ? Number(form.transitOrgId) : undefined,
        transitOrgName: form.transitOrgId ? (orgs.find((o: any) => String(o.id) === String(form.transitOrgId))?.name || '') : undefined,
        destOrgId: form.destOrgId ? Number(form.destOrgId) : undefined,
        destOrgName: form.destOrgId ? (orgs.find((o: any) => String(o.id) === String(form.destOrgId))?.name || '') : undefined,
        goodsName: form.goodsName, goodsNo: form.goodsNo, packingType: form.packingType,
        quantity: Number(form.quantity) || 1,
        weight: parseFloat(form.weight) || undefined,
        volume: parseFloat(form.volume) || undefined,
        paymentMethod: form.paymentMethod,
        baseFreight: parseFloat(form.baseFreight) || 0,
        freightFee: payAmount || totalFee,
        insuranceFee: parseFloat(form.insuranceFee) || 0,
        pickupFee: parseFloat(form.pickupFee) || 0,
        deliveryFee: parseFloat(form.deliveryFee) || 0,
        packingFee: parseFloat(form.packingFee) || 0,
        otherFee: parseFloat(form.otherFee) || 0,
        codAmount: parseFloat(form.codAmount) || 0,
        receiptRequired: Number(form.receiptRequired),
        receiptCount: Number(form.receiptCount) || 1,
        deliveryMethod: form.deliveryMethod,
        remark: form.remark,
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
      setForm({
        senderName: '', senderPhone: '', senderAddress: '',
        receiverName: '', receiverPhone: '', receiverAddress: '',
        originOrgId: '', transitOrgId: '', destOrgId: '',
        goodsName: '', goodsNo: '', packingType: '纸箱',
        quantity: '1', weight: '', volume: '',
        paymentMethod: '现付', xianfuAmount: '', tifuAmount: '', huidanfuAmount: '', yuejiAmount: '', huokuanAmount: '',
        baseFreight: '', freightFee: '', insuranceFee: '', pickupFee: '', deliveryFee: '', packingFee: '', otherFee: '',
        codAmount: '', receiptRequired: '1', receiptCount: '1', deliveryMethod: '送货上门', remark: '',
      });
    }
  };

  const InputField = ({ label, value, onChange, placeholder, required, type = 'text', className = '', readOnly = false }: any) => (
    <div className={`flex items-center gap-1 ${className}`}>
      <label className="text-xs text-gray-600 whitespace-nowrap w-16 text-right shrink-0">
        {required && <span className="text-red-500">*</span>}{label}:
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
        className={`flex-1 h-7 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 min-w-0 ${readOnly ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} />
    </div>
  );

  const SelectField = ({ label, value, onChange, options, required, className = '' }: any) => (
    <div className={`flex items-center gap-1 ${className}`}>
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

  const orgOptions = orgs.map(o => ({ label: o.name, value: String(o.id) }));

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        {/* 顶部操作栏 */}
        <div className="px-3 py-2 flex items-center justify-between bg-white border-b border-gray-200">
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
        <div className="flex-1 mx-3 mt-3 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">加载中...</div>
          ) : (
            <div className="space-y-3">
              {/* 发货信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-1.5 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">发货信息</div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  <SelectField label="发站" value={form.originOrgId} onChange={(v: string) => setField('originOrgId', v)}
                    options={orgOptions} />
                  <InputField label="发货人" value={form.senderName} onChange={(v: string) => setField('senderName', v)} placeholder="发货人姓名" required />
                  <InputField label="手机" value={form.senderPhone} onChange={(v: string) => setField('senderPhone', v)} placeholder="发货人手机" />
                  <InputField label="发货地址" value={form.senderAddress} onChange={(v: string) => setField('senderAddress', v)} placeholder="发货人详细地址" className="col-span-3" />
                </div>
              </div>

              {/* 收货信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-1.5 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">收货信息</div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  <SelectField label="中转地" value={form.transitOrgId} onChange={(v: string) => setField('transitOrgId', v)}
                    options={orgOptions} />
                  <SelectField label="到站" value={form.destOrgId} onChange={(v: string) => setField('destOrgId', v)} required
                    options={orgOptions} />
                  <InputField label="收货人" value={form.receiverName} onChange={(v: string) => setField('receiverName', v)} placeholder="收货人姓名" required />
                  <InputField label="手机" value={form.receiverPhone} onChange={(v: string) => setField('receiverPhone', v)} placeholder="收货人手机" />
                  <InputField label="收货地址" value={form.receiverAddress} onChange={(v: string) => setField('receiverAddress', v)} placeholder="收货详细地址" className="col-span-2" />
                </div>
              </div>

              {/* 货物信息 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-1.5 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">货物信息</div>
                <div className="p-3 grid grid-cols-4 gap-3">
                  <InputField label="品名" value={form.goodsName} onChange={(v: string) => setField('goodsName', v)} placeholder="货物品名" />
                  <InputField label="货号" value={form.goodsNo} onChange={(v: string) => setField('goodsNo', v)} placeholder="货号" />
                  <SelectField label="包装" value={form.packingType} onChange={(v: string) => setField('packingType', v)}
                    options={PACKING_TYPES.map(t => ({ label: t, value: t }))} />
                  <InputField label="件数" value={form.quantity} onChange={(v: string) => setField('quantity', v)} type="number" />
                  <InputField label="重量(kg)" value={form.weight} onChange={(v: string) => setField('weight', v)} placeholder="千克" type="number" />
                  <InputField label="体积(m³)" value={form.volume} onChange={(v: string) => setField('volume', v)} placeholder="立方米" type="number" />
                  <SelectField label="交接方式" value={form.deliveryMethod} onChange={(v: string) => setField('deliveryMethod', v)}
                    options={DELIVERY_METHODS.map(t => ({ label: t, value: t }))} />
                </div>
              </div>

              {/* 费用信息 - 对齐T9：付款方式独立金额 + 费用明细 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-1.5 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">费用信息</div>
                <div className="p-3 space-y-3">
                  {/* 付款方式（T9风格：每种方式对应独立金额） */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { method: '现付', key: 'xianfuAmount' },
                      { method: '提付', key: 'tifuAmount' },
                      { method: '回单付', key: 'huidanfuAmount' },
                      { method: '月结', key: 'yuejiAmount' },
                      { method: '货款扣', key: 'huokuanAmount' },
                    ].map(({ method, key }) => (
                      <div key={method} className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input type="radio" name="payMethod" value={method}
                            checked={form.paymentMethod === method}
                            onChange={() => handlePayMethodChange(method)}
                            className="w-3 h-3" />
                          <span className={form.paymentMethod === method ? 'text-blue-600 font-medium' : 'text-gray-600'}>{method}</span>
                        </label>
                        <input type="number" value={(form as any)[key]}
                          onChange={e => { setField(key, e.target.value); if (form.paymentMethod !== method && e.target.value) handlePayMethodChange(method); }}
                          placeholder="0.00"
                          className={`h-7 px-2 text-xs border rounded focus:outline-none focus:border-blue-500 ${form.paymentMethod === method ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}`} />
                      </div>
                    ))}
                  </div>

                  {/* 费用明细 */}
                  <div className="grid grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                    <InputField label="基本运费" value={form.baseFreight} onChange={(v: string) => setField('baseFreight', v)} placeholder="0.00" type="number" />
                    <InputField label="保险费" value={form.insuranceFee} onChange={(v: string) => setField('insuranceFee', v)} placeholder="0.00" type="number" />
                    <InputField label="接货费" value={form.pickupFee} onChange={(v: string) => setField('pickupFee', v)} placeholder="0.00" type="number" />
                    <InputField label="送货费" value={form.deliveryFee} onChange={(v: string) => setField('deliveryFee', v)} placeholder="0.00" type="number" />
                    <InputField label="包装费" value={form.packingFee} onChange={(v: string) => setField('packingFee', v)} placeholder="0.00" type="number" />
                    <InputField label="其他费" value={form.otherFee} onChange={(v: string) => setField('otherFee', v)} placeholder="0.00" type="number" />
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-600 whitespace-nowrap w-16 text-right shrink-0">运费合计:</label>
                      <span className="text-sm font-bold text-red-600">¥{totalFee.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 代收货款 + 回单设置 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-1.5 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">代收货款 &amp; 回单设置</div>
                <div className="p-3 grid grid-cols-4 gap-3">
                  <InputField label="代收货款" value={form.codAmount} onChange={(v: string) => setField('codAmount', v)} placeholder="0.00" type="number" />
                  <SelectField label="是否回单" value={form.receiptRequired} onChange={(v: string) => setField('receiptRequired', v)}
                    options={[{ label: '需要回单', value: '1' }, { label: '不需要', value: '0' }]} />
                  {form.receiptRequired === '1' && (
                    <InputField label="回单份数" value={form.receiptCount} onChange={(v: string) => setField('receiptCount', v)} type="number" />
                  )}
                </div>
              </div>

              {/* 备注 */}
              <div className="bg-white rounded border border-gray-200">
                <div className="px-3 py-1.5 bg-[#f7f8fa] border-b border-gray-200 text-xs font-bold text-gray-700">备注</div>
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
