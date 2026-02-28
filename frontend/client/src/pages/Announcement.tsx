import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Megaphone, Clock, ChevronRight } from 'lucide-react';

const mockAnnouncements = [
  { id: 1, title: '系统升级通知', content: '系统将于2026年3月1日凌晨2:00-4:00进行升级维护，届时系统将暂停服务，请提前做好准备。', type: '系统通知', createTime: '2026-02-28 10:00:00', isTop: true },
  { id: 2, title: '春节假期运营安排', content: '春节期间（2月14日-2月20日）部分线路暂停发车，请各网点提前安排货物发运。', type: '运营通知', createTime: '2026-02-25 09:00:00', isTop: true },
  { id: 3, title: '新增华东线路通知', content: '即日起新增上海-杭州、上海-南京两条专线，每日发车，欢迎各网点使用。', type: '业务通知', createTime: '2026-02-20 14:00:00', isTop: false },
  { id: 4, title: '关于规范运单填写的通知', content: '为提高运营效率，请各网点操作员在开单时务必填写完整的收发货人信息，包括姓名、电话、地址等。', type: '规范通知', createTime: '2026-02-15 11:00:00', isTop: false },
];

export default function Announcement() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        <div className="px-3 py-2">
          <h2 className="text-sm font-bold text-gray-800">公告列表</h2>
        </div>
        <div className="flex-1 mx-3 flex gap-3 overflow-hidden">
          {/* 公告列表 */}
          <div className="w-[400px] bg-white rounded border border-gray-200 overflow-y-auto shrink-0">
            {mockAnnouncements.map((item) => (
              <div key={item.id} onClick={() => setSelected(item)}
                className={`px-3 py-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50/50 transition-colors ${selected?.id === item.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start gap-2">
                  {item.isTop && <span className="text-[10px] px-1 py-0.5 bg-red-100 text-red-600 rounded shrink-0">置顶</span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{item.title}</div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                      <span className="px-1 py-0.5 bg-gray-100 rounded">{item.type}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.createTime.slice(0, 10)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>

          {/* 公告详情 */}
          <div className="flex-1 bg-white rounded border border-gray-200 overflow-y-auto">
            {selected ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {selected.isTop && <span className="text-[10px] px-1 py-0.5 bg-red-100 text-red-600 rounded">置顶</span>}
                  <span className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded">{selected.type}</span>
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{selected.title}</h3>
                <div className="text-[10px] text-gray-400 mb-4 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{selected.createTime}
                </div>
                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.content}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Megaphone className="w-12 h-12 mb-3 text-gray-300" />
                <div className="text-sm">请选择公告查看详情</div>
              </div>
            )}
          </div>
        </div>
        <div className="h-3" />
      </div>
    </DashboardLayout>
  );
}
