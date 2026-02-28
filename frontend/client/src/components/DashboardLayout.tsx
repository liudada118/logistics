import { type ReactNode, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronDown, ChevronRight, LogOut, User, Search, Settings, Bell,
  FileText, Truck, Warehouse, ClipboardCheck, AlertTriangle, FileCheck,
  DollarSign, MapPin, BarChart3, Building2, Route, Users, ShieldAlert,
  ScrollText, UserCog, Package, ArrowDownToLine, ArrowUpFromLine,
  Calculator, CreditCard, Megaphone, LayoutDashboard, Globe, Boxes,
  Navigation, Eye, CheckCircle, Send, RotateCcw, BookOpen, Receipt,
  Banknote, PiggyBank, TrendingUp, FileBarChart, Wrench, AlertCircle,
  Home
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon?: any;
  path?: string;
  children?: MenuItem[];
}

interface MenuGroup {
  title: string;
  icon: any;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: '营运中心',
    icon: Truck,
    items: [
      { label: '我的主页', icon: Home, path: '/dashboard' },
      { label: '受理开单', icon: FileText, path: '/waybills/create' },
      { label: '运单查询', icon: Search, path: '/waybills' },
      { label: '发货库存', icon: ArrowUpFromLine, path: '/inventory?type=send' },
      { label: '到货确认', icon: ArrowDownToLine, path: '/transport' },
      { label: '到货库存', icon: Warehouse, path: '/inventory?type=arrive' },
      { label: '签收登记', icon: ClipboardCheck, path: '/sign' },
      { label: '异常登记', icon: AlertTriangle, path: '/exception' },
    ],
  },
  {
    title: '回单管理',
    icon: FileCheck,
    items: [
      { label: '回单签收', icon: CheckCircle, path: '/receipt?action=sign' },
      { label: '回单寄出', icon: Send, path: '/receipt?action=send' },
      { label: '回单收到', icon: ArrowDownToLine, path: '/receipt?action=receive' },
      { label: '回单返厂', icon: RotateCcw, path: '/receipt?action=return' },
      { label: '回单总账', icon: BookOpen, path: '/receipt' },
    ],
  },
  {
    title: '财务中心',
    icon: DollarSign,
    items: [
      { label: '财务做账', icon: Calculator, path: '/finance' },
      { label: '财务对账', icon: Receipt, path: '/finance?tab=reconcile' },
      { label: '财务工具', icon: Wrench, path: '/finance?tab=tools' },
      { label: '报表中心', icon: FileBarChart, path: '/finance?tab=reports' },
    ],
  },
  {
    title: '基础资料',
    icon: Building2,
    items: [
      { label: '网点管理', icon: Building2, path: '/org' },
      { label: '线路管理', icon: Route, path: '/routes' },
      { label: '车辆管理', icon: Truck, path: '/vehicles' },
      { label: '客户管理', icon: Users, path: '/customers' },
    ],
  },
  {
    title: '系统管理',
    icon: Settings,
    items: [
      { label: '预警中心', icon: ShieldAlert, path: '/alerts' },
      { label: '用户管理', icon: UserCog, path: '/users' },
      { label: '操作日志', icon: ScrollText, path: '/logs' },
      { label: '公告管理', icon: Megaphone, path: '/announcement' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '营运中心': true,
    '回单管理': false,
    '财务中心': false,
    '基础资料': false,
    '系统管理': false,
  });
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    const basePath = path.split('?')[0];
    if (basePath === '/dashboard') return location === '/dashboard';
    return location === basePath || location.startsWith(basePath + '/');
  };

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden">
      {/* 顶部栏 - 模拟T9系统 */}
      <header className="h-11 bg-[#1a1a2e] flex items-center px-0 shrink-0 z-50 border-b border-[#2d2d44]">
        {/* 左侧Logo */}
        <div className="flex items-center h-full px-3 bg-[#16213e]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm whitespace-nowrap">云途物流</span>
          </div>
        </div>

        {/* 企业信息 */}
        <div className="flex items-center gap-4 px-4 text-xs">
          <span className="text-gray-400">
            【当前网点：<span className="text-blue-400">{user?.orgName || '总部'}</span>】
          </span>
        </div>

        {/* 中间搜索框 */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-80">
            <input
              type="text"
              placeholder="请输入任意关键字查询"
              className="w-full h-7 pl-3 pr-8 text-xs bg-[#2d2d44] border border-[#3d3d5c] rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-1 px-3">
          <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-[#2d2d44] transition-colors" title="消息通知">
            <Bell className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-[#2d2d44] transition-colors" title="系统设置">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#3d3d5c]">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-300 text-xs">{user?.fullName || '管理员'}</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 p-1 transition-colors"
              title="注销登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单栏 */}
        <aside className="w-44 bg-[#1e1e32] flex flex-col shrink-0 overflow-hidden">
          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.title}>
                {/* 一级菜单 */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors border-b border-[#2a2a42] ${
                    expandedGroups[group.title]
                      ? 'bg-[#252540] text-blue-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#252540]'
                  }`}
                >
                  <group.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{group.title}</span>
                  {expandedGroups[group.title] ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>

                {/* 二级菜单 */}
                {expandedGroups[group.title] && (
                  <div className="bg-[#1a1a2e]">
                    {group.items.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <Link key={item.path || item.label} href={item.path || '#'}>
                          <div
                            className={`flex items-center gap-2 pl-7 pr-3 py-2 text-xs cursor-pointer transition-colors ${
                              active
                                ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#252540]'
                            }`}
                          >
                            {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
