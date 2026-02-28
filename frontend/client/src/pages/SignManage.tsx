import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Select, T9Textarea, T9Button } from '@/components/T9Modal';
import { signApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardCheck, RotateCcw } from 'lucide-react';

export default function SignManage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showSign, setShowSign] = useState(false);
  const [signForm, setSignForm] = useState({ waybillNo: '', signType: '本人签收', signName: '', remark: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await signApi.list({ page: 1, size: 50, keyword: filterValues.keyword, signType: filterValues.signType });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleSign = async () => {
    if (!signForm.waybillNo) { alert('请输入运单号'); return; }
    try {
      await signApi.sign({
        waybillNo: signForm.waybillNo,
        signType: signForm.signType,
        signName: signForm.signName || user?.fullName,
        remark: signForm.remark,
      });
      setShowSign(false);
      setSignForm({ waybillNo: '', signType: '本人签收', signName: '', remark: '' });
      loadData();
    } catch (e: any) { alert(e.message || '签收失败'); }
  };

  const handleUnsign = async (waybillId: number) => {
    if (!confirm('确定要反签收吗？')) return;
    try { await signApi.unsign(waybillId); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const columns: Column[] = [
    { key: 'waybillNo', title: '运单号', width: '130px', render: (v) => <span className="text-blue-600 font-mono">{v || '-'}</span> },
    { key: 'signType', title: '签收类型', width: '90px', render: (v) => {
      const color = v === '本人签收' ? 'text-green-600' : v === '代签' ? 'text-blue-600' : 'text-orange-600';
      return <span className={`font-medium ${color}`}>{v || '-'}</span>;
    }},
    { key: 'signName', title: '签收人', width: '80px' },
    { key: 'senderName', title: '发货人', width: '80px' },
    { key: 'receiverName', title: '收货人', width: '80px' },
    { key: 'goodsName', title: '品名', width: '100px' },
    { key: 'quantity', title: '件数', width: '60px', align: 'right' },
    { key: 'originName', title: '发站', width: '80px' },
    { key: 'destName', title: '到站', width: '80px' },
    { key: 'signTime', title: '签收时间', width: '140px', render: (v) => v || '-' },
    { key: 'operatorName', title: '操作人', width: '80px' },
    { key: 'remark', title: '备注', width: '120px' },
    { key: '_action', title: '操作', width: '80px', align: 'center', render: (_, row) => (
      <button onClick={() => handleUnsign(row.waybillId || row.id)} className="text-xs text-red-600 hover:underline flex items-center gap-0.5">
        <RotateCcw className="w-3 h-3" />反签收
      </button>
    )},
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/签收人/收货人' },
    { key: 'signType', label: '签收类型', type: 'select', options: [
      { label: '本人签收', value: '本人签收' }, { label: '代签', value: '代签' }, { label: '他人签收', value: '他人签收' },
    ]},
  ];

  return (
    <>
      <T9TablePage
        title="签收登记"
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData}
        onRefresh={loadData}
        onAdd={() => setShowSign(true)}
        addLabel="签收登记"
        selectedRows={selectedRows}
        onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
        onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      />
      <T9Modal open={showSign} onClose={() => setShowSign(false)} title="签收登记" width="450px"
        footer={<><T9Button onClick={() => setShowSign(false)}>取消</T9Button><T9Button variant="primary" onClick={handleSign}>确认签收</T9Button></>}>
        <T9FormRow label="运单号" required>
          <T9Input value={signForm.waybillNo} onChange={(e: any) => setSignForm(p => ({ ...p, waybillNo: e.target.value }))} placeholder="请输入运单号" />
        </T9FormRow>
        <T9FormRow label="签收类型" required>
          <T9Select value={signForm.signType} onChange={v => setSignForm(p => ({ ...p, signType: v }))}
            options={[{ label: '本人签收', value: '本人签收' }, { label: '代签', value: '代签' }, { label: '他人签收', value: '他人签收' }]} />
        </T9FormRow>
        <T9FormRow label="签收人">
          <T9Input value={signForm.signName} onChange={(e: any) => setSignForm(p => ({ ...p, signName: e.target.value }))} placeholder="签收人姓名" />
        </T9FormRow>
        <T9FormRow label="备注">
          <T9Textarea value={signForm.remark} onChange={(e: any) => setSignForm(p => ({ ...p, remark: e.target.value }))} placeholder="备注信息" />
        </T9FormRow>
      </T9Modal>
    </>
  );
}
