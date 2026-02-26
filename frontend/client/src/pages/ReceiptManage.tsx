import { useState, useEffect, useCallback } from 'react';
import { receiptApi, waybillApi } from '../lib/api';

const receiptActions = ['签收', '寄出', '收到', '返厂', '反签收', '反寄出'];

export default function ReceiptManage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filterAction, setFilterAction] = useState('');
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
      const res = await receiptApi.list({ page, size: 20, keyword, action: filterAction });
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
    if (!form.waybillId) { alert('请输入运单ID'); return; }
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
      setShowDialog(false);
      fetchData();
    } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const actionColor = (a: string) => {
    if (a === '签收') return 'bg-green-100 text-green-700';
    if (a === '寄出') return 'bg-blue-100 text-blue-700';
    if (a === '收到') return 'bg-purple-100 text-purple-700';
    if (a === '返厂') return 'bg-orange-100 text-orange-700';
    if (a.startsWith('反')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">回单管理</h1>
        <div className="flex gap-2">
          {['签收', '寄出', '收到', '返厂'].map(a => (
            <button key={a} onClick={() => openAction(a)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              回单{a}
            </button>
          ))}
        </div>
      </div>

      {/* 回单状态流程说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>回单流程：</strong>待签收 → 已签收 → 已寄出 → 已收到 → 已返厂
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>反向操作：</strong>反签收、反寄出可撤销对应步骤
        </p>
      </div>

      {/* 筛选 */}
      <div className="flex gap-4 items-center">
        <input type="text" placeholder="搜索运单号/操作人..." value={keyword}
          onChange={e => setKeyword(e.target.value)} className="px-3 py-2 border rounded-lg w-64" />
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">全部操作</option>
          {receiptActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">运单号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">回单份数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">快递单号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作时间</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无回单记录</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{r.waybillNo}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${actionColor(r.action)}`}>{r.action}</span>
                </td>
                <td className="px-4 py-3 text-sm">{r.receiptCount || '-'}</td>
                <td className="px-4 py-3 text-sm">{r.expressNo || '-'}</td>
                <td className="px-4 py-3 text-sm">{r.operatorName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.remark || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.createdAt?.replace('T', ' ').slice(0, 16)}</td>
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

      {/* 操作对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">回单{dialogAction}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">运单ID *</label>
                <input type="number" value={form.waybillId} onChange={e => setForm({ ...form, waybillId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="输入运单ID" />
              </div>
              {dialogAction === '寄出' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">快递单号</label>
                  <input type="text" value={form.expressNo} onChange={e => setForm({ ...form, expressNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" placeholder="输入快递单号" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowDialog(false)} className="px-4 py-2 border rounded-lg">取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
