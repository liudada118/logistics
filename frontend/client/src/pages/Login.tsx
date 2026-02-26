import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('用户名或密码错误');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-[#0F172A] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight" style={{ fontFamily: 'DM Sans' }}>云途物流</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">SaaS 管理平台</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'DM Sans' }}>
              智能物流<br />高效管控
            </div>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-sm">
              一站式物流管理解决方案，覆盖运单管理、运输调度、仓储管控、财务结算全流程，助力企业降本增效。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '运单处理', value: '50万+/月' },
              { label: '覆盖城市', value: '300+' },
              { label: '合作企业', value: '2000+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="text-white font-semibold text-lg tabular-nums" style={{ fontFamily: 'DM Sans' }}>{stat.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-600 text-xs">
          © 2026 云途物流科技有限公司
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8F9FA]">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'DM Sans' }}>云途物流</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1A1D23]" style={{ fontFamily: 'DM Sans' }}>登录系统</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">请输入您的账号信息</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-[#374151]">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 bg-white border-[#E5E7EB] focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#374151]">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white border-[#E5E7EB] focus:border-blue-500 focus:ring-blue-500/20 text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : '登 录'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-white rounded-lg border border-[#E5E7EB]">
            <p className="text-xs text-[#9CA3AF] mb-2">演示账号：</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>管理员：<code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#374151] font-mono">admin</code></span>
                <span className="text-[#9CA3AF]">任意密码</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>操作员：<code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#374151] font-mono">operator1</code></span>
                <span className="text-[#9CA3AF]">任意密码</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>财务员：<code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#374151] font-mono">finance1</code></span>
                <span className="text-[#9CA3AF]">任意密码</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
