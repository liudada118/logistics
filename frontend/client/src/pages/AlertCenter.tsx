// 预警中心
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { alertApi } from '@/lib/api';
import { AlertTriangle, CheckCircle, EyeOff, Bell, BellOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const typeOptions = ['库存超期预警', '回单超期预警', '应收款超期预警'];
const levelColor: Record<string, string> = {
  '低': 'bg-blue-100 text-blue-700',
  '中': 'bg-amber-100 text-amber-700',
  '高': 'bg-red-100 text-red-700',
};
const statusColor: Record<string, string> = {
  '未处理': 'bg-red-100 text-red-700',
  '已处理': 'bg-emerald-100 text-emerald-700',
  '已忽略': 'bg-gray-100 text-gray-500',
};

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ unhandled: number; total: number }>({ unhandled: 0, total: 0 });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await alertApi.list({
        page,
        size: 20,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        level: levelFilter !== 'all' ? levelFilter : undefined,
      });
      setAlerts(result.records);
      setTotal(result.total);
    } catch (e: any) {
      toast.error('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, levelFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await alertApi.stats();
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleAction = async (id: number, action: 'handle' | 'ignore') => {
    try {
      if (action === 'handle') {
        await alertApi.handle(id);
        toast.success('已处理');
      } else {
        await alertApi.ignore(id);
        toast.success('已忽略');
      }
      fetchAlerts();
      fetchStats();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h1 className="text-lg font-bold text-foreground">预警中心</h1>
            {stats.unhandled > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {stats.unhandled} 未处理
              </span>
            )}
          </div>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" />
              <div className="text-xs text-muted-foreground">未处理</div>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.unhandled}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <BellOff className="w-4 h-4 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">总预警</div>
            </div>
            <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <div className="text-xs text-muted-foreground">已处理</div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.total - stats.unhandled}</div>
          </div>
        </div>

        {/* 筛选 */}
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="预警类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="未处理">未处理</SelectItem>
              <SelectItem value="已处理">已处理</SelectItem>
              <SelectItem value="已忽略">已忽略</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={v => { setLevelFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="级别" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部级别</SelectItem>
              <SelectItem value="高">高</SelectItem>
              <SelectItem value="中">中</SelectItem>
              <SelectItem value="低">低</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 预警列表 */}
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`bg-card border rounded-lg p-4 ${alert.status === '未处理' ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.level === '高' ? 'text-red-500' : alert.level === '中' ? 'text-amber-500' : 'text-blue-500'}`} />
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor[alert.level] || 'bg-gray-100'}`}>{alert.level}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[alert.status] || 'bg-gray-100'}`}>{alert.status}</span>
                    <span className="text-xs text-muted-foreground">{alert.type}</span>
                  </div>
                  <h3 className="font-medium text-foreground">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{alert.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{alert.createdAt ? new Date(alert.createdAt).toLocaleString('zh-CN') : '-'}</span>
                    {alert.handlerName && <span>处理人: {alert.handlerName}</span>}
                  </div>
                </div>
                {alert.status === '未处理' && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleAction(alert.id, 'handle')}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />处理
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleAction(alert.id, 'ignore')}>
                      <EyeOff className="w-3.5 h-3.5 mr-1" />忽略
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {loading ? '加载中...' : '暂无预警记录'}
            </div>
          )}
        </div>

        {/* 分页 */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">共 {total} 条</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
              <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
