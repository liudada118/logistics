import DashboardLayout from '@/components/DashboardLayout';
import { useLocation } from 'wouter';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full bg-[#f0f2f5]">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <div className="text-lg text-gray-500 mb-6">页面不存在</div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="h-8 px-4 text-xs bg-white text-gray-600 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />返回上页
          </button>
          <button onClick={() => navigate('/dashboard')} className="h-8 px-4 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />回到主页
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
