import { useState, useEffect, useCallback } from 'react';
import { signApi, waybillApi } from '../lib/api';

const signTypes = ['本人签收', '代签', '拒签', '部分签收'];
const deliveryMethods = ['自提', '送货上门', '代理中转'];

export default function SignManage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
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
      const res = await signApi.list({ page, size: 20, keyword, signType: filterType });
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
      alert('请填写运单号和签收人');
      return;
    }
    try {
      await signApi.sign({
        waybillId: form.waybillId,
        signType: form.signType,
        signerName: form.signerName,
        signerPhone: form.signerPhone,
        signQuantity: form.signQuantity,
        damageQuantity: form.damageQuantity,
        shortageQuantity: form.shortageQuantity,
        deliveryMethod: form.deliveryMethod,
        signRemark: form.signRemark,
      });
      setShowDialog(false);
      fetchData();
    } catch (e: any) {
      alert(e.message || '签收失败');
    }
  };

  const handleUnsign = async (waybillId: number) => {
    if (!confirm('确认反签收？将撤销该运单的签收记录')) return;
    try {
      await signApi.unsign(waybillId);
      fetchData();
    } catch (e: any) {
      alert(e.message || '反签收失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">签收管理</h1>
        <button onClick={() => setShowDialog(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          签收登记
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-4 items-center">
        <input
          type="text" placeholder="搜索运单号/签收人..." value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="px-3 py-2 border rounded-lg w-64"
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">全部类型</option>
          {signTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">运单号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">签收类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">签收人</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">签收件数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">破损/短少</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">交接方式</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">签收时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">暂无签收记录</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{r.waybillNo}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${r.signType === '拒签' ? 'bg-red-100 text-red-700' : r.signType === '部分签收' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {r.signType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{r.signerName}</td>
                <td className="px-4 py-3 text-sm">{r.signQuantity}</td>
                <td className="px-4 py-3 text-sm">
                  {(r.damageQuantity > 0 || r.shortageQuantity > 0) ? (
                    <span className="text-red-600">破损{r.damageQuantity} / 短少{r.shortageQuantity}</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-sm">{r.deliveryMethod || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.signedAt?.replace('T', ' ').slice(0, 16)}</td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => handleUnsign(r.waybillId)} className="text-red-600 hover:text-red-800">反签收</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
          <span className="px-3 py-1">第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
        </div>
      )}

      {/* 签收对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">签收登记</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">运单ID *</label>
                <input type="number" value={form.waybillId} onChange={e => setForm({ ...form, waybillId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="输入运单ID" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">签收类型</label>
                  <select value={form.signType} onChange={e => setForm({ ...form, signType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {signTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">交接方式</label>
                  <select value={form.deliveryMethod} onChange={e => setForm({ ...form, deliveryMethod: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {deliveryMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">签收人 *</label>
                  <input type="text" value={form.signerName} onChange={e => setForm({ ...form, signerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">签收人电话</label>
                  <input type="text" value={form.signerPhone} onChange={e => setForm({ ...form, signerPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">签收件数</label>
                  <input type="number" value={form.signQuantity} onChange={e => setForm({ ...form, signQuantity: +e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">破损件数</label>
                  <input type="number" value={form.damageQuantity} onChange={e => setForm({ ...form, damageQuantity: +e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">短少件数</label>
                  <input type="number" value={form.shortageQuantity} onChange={e => setForm({ ...form, shortageQuantity: +e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={form.signRemark} onChange={e => setForm({ ...form, signRemark: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg">取消</button>
              <button onClick={handleSign} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确认签收</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
