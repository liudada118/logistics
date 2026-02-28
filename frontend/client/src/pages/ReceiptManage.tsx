import { useState, useEffect } from 'react';
import T9TablePage, { type Column, type FilterItem } from '@/components/T9TablePage';
import T9Modal, { T9FormRow, T9Input, T9Textarea, T9Button } from '@/components/T9Modal';
import { receiptApi } from '@/lib/api';
import { useLocation } from 'wouter';
import { CheckCircle, Send, ArrowDownToLine, RotateCcw, BookOpen } from 'lucide-react';

const tabs = [
  { key: '', label: '回单总账', icon: BookOpen },
  { key: 'sign', label: '回单签收', icon: CheckCircle },
  { key: 'send', label: '回单寄出', icon: Send },
  { key: 'receive', label: '回单收到', icon: ArrowDownToLine },
  { key: 'return', label: '回单返厂', icon: RotateCcw },
];

export default function ReceiptManage() {
  const [location, navigate] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const activeTab = urlParams.get('action') || '';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({ waybillNo: '', expressNo: '', remark: '' });

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await receiptApi.list({ page: 1, size: 50, keyword: filterValues.keyword, action: activeTab || undefined });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleAction = async (action: string) => {
    if (!modalForm.waybillNo) { alert('请输入运单号'); return; }
    try {
      const payload = { expressNo: modalForm.expressNo, remark: modalForm.remark };
      const waybillId = Number(modalForm.waybillNo);
      if (action === 'sign') await receiptApi.signReceipt(waybillId, payload);
      else if (action === 'send') await receiptApi.sendReceipt(waybillId, payload);
      else if (action === 'receive') await receiptApi.receiveReceipt(waybillId, payload);
      else if (action === 'return') await receiptApi.returnReceipt(waybillId, payload);
      setShowModal(null);
      setModalForm({ waybillNo: '', expressNo: '', remark: '' });
      loadData();
    } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      '待签收': 'bg-yellow-100 text-yellow-700', '已签收': 'bg-blue-100 text-blue-700',
      '已寄出': 'bg-purple-100 text-purple-700', '已收到': 'bg-green-100 text-green-700',
      '已返厂': 'bg-gray-100 text-gray-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const columns: Column[] = [
    { key: 'receiptStatus', title: '回单状态', width: '90px', render: (v) => <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge(v)}`}>{v || '-'}</span> },
    { key: 'waybillNo', title: '运单号', width: '130px', render: (v) => <span className="text-blue-600 font-mono">{v || '-'}</span> },
    { key: 'senderName', title: '发货人', width: '80px' },
    { key: 'receiverName', title: '收货人', width: '80px' },
    { key: 'originName', title: '发站', width: '80px' },
    { key: 'destName', title: '到站', width: '80px' },
    { key: 'goodsName', title: '品名', width: '100px' },
    { key: 'quantity', title: '件数', width: '60px', align: 'right' },
    { key: 'signTime', title: '签收时间', width: '140px', render: (v) => v || '-' },
    { key: 'sendTime', title: '寄出时间', width: '140px', render: (v) => v || '-' },
    { key: 'expressNo', title: '快递单号', width: '130px' },
    { key: 'receiveTime', title: '收到时间', width: '140px', render: (v) => v || '-' },
    { key: 'returnTime', title: '返厂时间', width: '140px', render: (v) => v || '-' },
    { key: 'operatorName', title: '操作人', width: '80px' },
    { key: 'remark', title: '备注', width: '120px' },
  ];

  const filters: FilterItem[] = [
    { key: 'keyword', label: '关键字', type: 'text', placeholder: '运单号/发货人/收货人' },
  ];

  const actionLabel = { sign: '回单签收', send: '回单寄出', receive: '回单收到', return: '回单返厂' }[activeTab] || '';

  return (
    <>
      <T9TablePage
        title="回单管理"
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
        onSearch={loadData}
        onRefresh={loadData}
        onAdd={activeTab ? () => setShowModal(activeTab) : undefined}
        addLabel={actionLabel}
        selectedRows={selectedRows}
        onToggleRow={(id) => { setSelectedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }}
        onToggleAll={() => { setSelectedRows(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id))); }}
      >
        {/* Tab切换栏 */}
        <div className="mx-3 bg-white border border-gray-200 border-b-0 px-2 pt-1 flex items-center gap-0">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => navigate(`/receipt${tab.key ? `?action=${tab.key}` : ''}`)}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <tab.icon className="w-3 h-3" />{tab.label}
            </button>
          ))}
        </div>
      </T9TablePage>

      <T9Modal open={!!showModal} onClose={() => setShowModal(null)} title={actionLabel} width="450px"
        footer={<><T9Button onClick={() => setShowModal(null)}>取消</T9Button><T9Button variant="primary" onClick={() => handleAction(showModal!)}>确认</T9Button></>}>
        <T9FormRow label="运单号" required>
          <T9Input value={modalForm.waybillNo} onChange={(e: any) => setModalForm(p => ({ ...p, waybillNo: e.target.value }))} placeholder="请输入运单号或运单ID" />
        </T9FormRow>
        {(showModal === 'send' || showModal === 'return') && (
          <T9FormRow label="快递单号">
            <T9Input value={modalForm.expressNo} onChange={(e: any) => setModalForm(p => ({ ...p, expressNo: e.target.value }))} placeholder="快递单号" />
          </T9FormRow>
        )}
        <T9FormRow label="备注">
          <T9Textarea value={modalForm.remark} onChange={(e: any) => setModalForm(p => ({ ...p, remark: e.target.value }))} placeholder="备注信息" />
        </T9FormRow>
      </T9Modal>
    </>
  );
}
