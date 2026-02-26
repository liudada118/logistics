// 系统管理 - 操作日志
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operationLogApi } from '@/lib/api';
import { Search, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

const moduleOptions = ['运单管理', '运输任务', '库存管理', '财务管理', '用户管理', '基础资料'];

const moduleColor: Record<string, string> = {
  '运单管理': 'bg-blue-100 text-blue-700',
  '运输任务': 'bg-indigo-100 text-indigo-700',
  '库存管理': 'bg-amber-100 text-amber-700',
  '财务管理': 'bg-emerald-100 text-emerald-700',
  '用户管理': 'bg-red-100 text-red-700',
  '基础资料': 'bg-purple-100 text-purple-700',
};

export default function OperationLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await operationLogApi.list({
        page,
        size: 20,
        module: moduleFilter !== 'all' ? moduleFilter : undefined,
        keyword: search || undefined,
      });
      setLogs(result.records);
      setTotal(result.total);
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold text-foreground">操作日志</h1>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索操作描述/操作人..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
          </div>
          <Select value={moduleFilter} onValueChange={v => { setModuleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="模块" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部模块</SelectItem>
              {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 表格 */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">模块</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">描述</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作人</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${moduleColor[log.module] || 'bg-gray-100 text-gray-600'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{log.action}</td>
                    <td className="px-4 py-2.5 text-foreground max-w-[300px] truncate">{log.description}</td>
                    <td className="px-4 py-2.5">{log.operatorName || '-'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{loading ? '加载中...' : '暂无操作日志'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">共 {total} 条</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
