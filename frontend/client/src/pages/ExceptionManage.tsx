import { useState, useEffect, useCallback } from 'react';
import { exceptionApi } from '../lib/api';

const exceptionTypes = ['货损', '货差', '延误', '丢失', '错发', '客户投诉', '其他'];
const severities = ['轻微', '一般', '严重'];
const handleStatuses = ['待处理', '处理中', '已处理', '已关闭'];

export default function ExceptionManage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showHandle, setShowHandle] = useState<any>(null);
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
      const res = await exceptionApi.list({ page, size: 20, keyword, exceptionType: filterType, handleStatus: filterStatus });
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
    if (!form.description) { alert('请填写异常描述'); return; }
    try {
      await exceptionApi.create(form);
      setShowCreate(false);
      setForm({ waybillId: '', exceptionType: '货损', severity: '一般', description: '' });
      fetchData();
    } catch (e: any) { alert(e.message || '登记失败'); }
  };

  const handleProcess = async () => {
    if (!handleForm.handleResult) { alert('请填写处理结果'); return; }
    try {
      await exceptionApi.handle(showHandle.id, handleForm);
      setShowHandle(null);
      fetchData();
    } catch (e: any) { alert(e.message || '处理失败'); }
  };

  const handleClose = async (id: number) => {
    if (!confirm('确认关闭此异常记录？')) return;
    try {
      await exceptionApi.close(id);
      fetchData();
    } catch (e: any) { alert(e.message || '关闭失败'); }
  };

  const severityColor = (s: string) => {
    if (s === '严重') return 'bg-red-100 text-red-700';
    if (s === '一般') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const statusColor = (s: string) => {
    if (s === '待处理') return 'bg-red-100 text-red-700';
    if (s === '处理中') return 'bg-yellow-100 text-yellow-700';
    if (s === '已处理') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">异常管理</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          异常登记
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-4 items-center flex-wrap">
        <input type="text" placeholder="搜索运单号/描述..." value={keyword}
          onChange={e => setKeyword(e.target.value)} className="px-3 py-2 border rounded-lg w-64" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">全部类型</option>
          {exceptionTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">全部状态</option>
          {handleStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">运单号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">异常类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">严重程度</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">理赔金额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">登记时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">暂无异常记录</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{r.waybillNo || '-'}</td>
                <td className="px-4 py-3 text-sm">{r.exceptionType}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${severityColor(r.severity)}`}>{r.severity}</span>
                </td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">{r.description}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${statusColor(r.handleStatus)}`}>{r.handleStatus}</span>
                </td>
                <td className="px-4 py-3 text-sm">{r.handleAmount > 0 ? `¥${r.handleAmount}` : '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  {r.handleStatus === '待处理' && (
                    <button onClick={() => { setShowHandle(r); setHandleForm({ handleResult: '', handleAmount: 0 }); }}
                      className="text-blue-600 hover:text-blue-800">处理</button>
                  )}
                  {(r.handleStatus === '已处理') && (
                    <button onClick={() => handleClose(r.id)} className="text-gray-600 hover:text-gray-800">关闭</button>
                  )}
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

      {/* 异常登记对话框 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">异常登记</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联运单ID（可选）</label>
                <input type="number" value={form.waybillId} onChange={e => setForm({ ...form, waybillId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="输入运单ID" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                  <select value={form.exceptionType} onChange={e => setForm({ ...form, exceptionType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {exceptionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                  <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {severities.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常描述 *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">确认登记</button>
            </div>
          </div>
        </div>
      )}

      {/* 处理对话框 */}
      {showHandle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">处理异常 - {showHandle.waybillNo}</h3>
            <div className="mb-3 p-3 bg-gray-50 rounded">
              <p className="text-sm"><strong>类型：</strong>{showHandle.exceptionType} | <strong>严重程度：</strong>{showHandle.severity}</p>
              <p className="text-sm mt-1"><strong>描述：</strong>{showHandle.description}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理结果 *</label>
                <textarea value={handleForm.handleResult} onChange={e => setHandleForm({ ...handleForm, handleResult: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">理赔金额</label>
                <input type="number" step="0.01" value={handleForm.handleAmount}
                  onChange={e => setHandleForm({ ...handleForm, handleAmount: +e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowHandle(null)} className="px-4 py-2 border rounded-lg">取消</button>
              <button onClick={handleProcess} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确认处理</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
