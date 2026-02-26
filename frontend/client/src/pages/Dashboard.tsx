import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useWaybills } from '@/contexts/WaybillContext';
import { dashboardApi, alertApi } from '@/lib/api';
import { FileText, TruckIcon, PackageCheck, AlertTriangle, DollarSign, Warehouse, ShieldAlert, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { waybills } = useWaybills();
  const [overview, setOverview] = useState<any>(null);
  const [alertStats, setAlertStats] = useState<{ unhandled: number; total: number }>({ unhandled: 0, total: 0 });

  useEffect(() => {
    dashboardApi.overview().then(setOverview).catch(() => {});
    alertApi.stats().then(setAlertStats).catch(() => {});
  }, []);

  const stats = [
    {
      label: '运单总数',
      value: overview?.totalWaybills ?? waybills.length,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
      link: '/waybills',
    },
    {
      label: '运输中',
      value: overview?.inTransit ?? waybills.filter(w => w.status === '运输中').length,
      icon: TruckIcon,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
      link: '/transport',
    },
    {
      label: '库存待出库',
      value: overview?.pendingInventory ?? 0,
      icon: Warehouse,
      color: 'bg-cyan-50 text-cyan-600',
      iconBg: 'bg-cyan-100',
      link: '/inventory',
    },
    {
      label: '待结算金额',
      value: overview?.pendingFinanceAmount ? `¥${Number(overview.pendingFinanceAmount).toFixed(0)}` : '¥0',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
      link: '/finance',
    },
    {
      label: '已签收',
      value: overview?.delivered ?? waybills.filter(w => w.status === '已签收').length,
      icon: PackageCheck,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      link: '/waybills',
    },
    {
      label: '异常运单',
      value: overview?.abnormal ?? waybills.filter(w => w.status === '异常').length,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
      link: '/waybills',
    },
    {
      label: '未处理预警',
      value: alertStats.unhandled,
      icon: ShieldAlert,
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
      link: '/alerts',
    },
    {
      label: '月营收',
      value: overview?.monthRevenue ? `¥${Number(overview.monthRevenue).toFixed(0)}` : '¥0',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      link: '/finance',
    },
  ];

  const recentWaybills = waybills.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'DM Sans' }}>工作台</h1>
          <p className="text-sm text-muted-foreground mt-0.5">今日运营概览</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.link}>
              <div className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums" style={{ fontFamily: 'DM Sans' }}>{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent waybills */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">最近运单</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">运单号</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">货物名称</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">收货人</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">运费</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {recentWaybills.map((wb) => (
                  <tr key={wb.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs font-medium text-blue-600">{wb.waybillNo}</td>
                    <td className="px-4 py-2.5 text-foreground">{wb.goodsName}</td>
                    <td className="px-4 py-2.5 text-foreground">{wb.receiverName}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">¥{wb.freightFee.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={wb.status} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">{wb.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    '待调度': 'bg-slate-100 text-slate-600',
    '已调度': 'bg-blue-50 text-blue-600',
    '运输中': 'bg-amber-50 text-amber-600',
    '已到货': 'bg-cyan-50 text-cyan-600',
    '派送中': 'bg-indigo-50 text-indigo-600',
    '已签收': 'bg-emerald-50 text-emerald-600',
    '异常': 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
