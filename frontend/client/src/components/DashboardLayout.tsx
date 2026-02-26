import { type ReactNode, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, FileText, Truck, LogOut, ChevronLeft, ChevronRight, User, Menu, X,
  Warehouse, Building2, Route, Users, DollarSign, ShieldAlert, ScrollText, UserCog,
  ClipboardCheck, AlertTriangle, FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '营运中心',
    items: [
      { label: '工作台', icon: LayoutDashboard, path: '/dashboard' },
      { label: '运单管理', icon: FileText, path: '/waybills' },
      { label: '运输任务', icon: Truck, path: '/transport' },
      { label: '库存管理', icon: Warehouse, path: '/inventory' },
      { label: '签收管理', icon: ClipboardCheck, path: '/sign' },
      { label: '异常管理', icon: AlertTriangle, path: '/exception' },
    ],
  },
  {
    title: '回单管理',
    items: [
      { label: '回单管理', icon: FileCheck, path: '/receipt' },
    ],
  },
  {
    title: '财务中心',
    items: [
      { label: '财务管理', icon: DollarSign, path: '/finance' },
    ],
  },
  {
    title: '基础资料',
    items: [
      { label: '网点管理', icon: Building2, path: '/org' },
      { label: '线路管理', icon: Route, path: '/routes' },
      { label: '车辆管理', icon: Truck, path: '/vehicles' },
      { label: '客户管理', icon: Users, path: '/customers' },
    ],
  },
  {
    title: '系统管理',
    items: [
      { label: '预警中心', icon: ShieldAlert, path: '/alerts' },
      { label: '用户管理', icon: UserCog, path: '/users' },
      { label: '操作日志', icon: ScrollText, path: '/logs' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/dashboard';
    return location.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground font-bold text-base whitespace-nowrap" style={{ fontFamily: 'DM Sans' }}>
              云途物流
            </span>
          )}
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? 'mt-4' : ''}>
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
                {group.title}
              </div>
            )}
            {collapsed && gi > 0 && <div className="mx-2 mb-2 border-t border-sidebar-border" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`}
                    >
                      <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-blue-400' : ''}`} />
                      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-sidebar-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.fullName}</div>
              <div className="text-xs text-sidebar-foreground/40 truncate">{user?.orgName}</div>
            </div>
            <button onClick={handleLogout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1" title="退出登录">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-2" title="退出登录">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[18px] bg-sidebar border border-sidebar-border rounded-full p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors z-10"
          style={{ left: collapsed ? '52px' : '212px' }}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 lg:px-6 shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setMobileOpen(true)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground hidden sm:inline">{user?.orgName}</span>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <span className="font-medium text-foreground">{user?.fullName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
