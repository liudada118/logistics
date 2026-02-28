import { useState, type ReactNode } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Download, RefreshCw, Filter, Plus, Printer, Settings, BarChart3 } from 'lucide-react';

export interface Column {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => ReactNode;
}

export interface FilterItem {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface T9TablePageProps {
  title: string;
  columns: Column[];
  data: any[];
  loading?: boolean;
  total?: number;
  filters?: FilterItem[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  selectedRows?: Set<number>;
  onToggleRow?: (id: number) => void;
  onToggleAll?: () => void;
  toolbarButtons?: { label: string; icon?: any; onClick?: () => void }[];
  actionButtons?: { label: string; icon?: any; onClick?: () => void; variant?: 'primary' | 'default' | 'danger' }[];
  rowKey?: string;
  children?: ReactNode;
}

export default function T9TablePage({
  title, columns, data, loading, total, filters, filterValues, onFilterChange,
  onSearch, onRefresh, onAdd, addLabel, selectedRows, onToggleRow, onToggleAll,
  toolbarButtons, actionButtons, rowKey = 'id', children,
}: T9TablePageProps) {
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#f0f2f5]">
        {/* 页面标题栏 */}
        <div className="px-3 py-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          <div className="flex items-center gap-1">
            {actionButtons?.map((btn, i) => (
              <button key={i} onClick={btn.onClick} className={`h-7 px-3 text-xs rounded flex items-center gap-1 ${
                btn.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                btn.variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' :
                'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
              }`}>
                {btn.icon && <btn.icon className="w-3 h-3" />}
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 筛选条件栏 */}
        {filters && filters.length > 0 && (
          <div className="px-3 py-1.5 bg-white mx-3 rounded-t border border-gray-200 border-b-0">
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <div key={f.key} className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500 whitespace-nowrap">{f.label}:</span>
                  {f.type === 'select' ? (
                    <select
                      value={filterValues?.[f.key] || ''}
                      onChange={e => onFilterChange?.(f.key, e.target.value)}
                      className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">全部</option>
                      {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'date' ? (
                    <input
                      type="date"
                      value={filterValues?.[f.key] || ''}
                      onChange={e => onFilterChange?.(f.key, e.target.value)}
                      className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={filterValues?.[f.key] || ''}
                      onChange={e => onFilterChange?.(f.key, e.target.value)}
                      placeholder={f.placeholder || '请输入'}
                      className="h-7 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 w-32"
                    />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-1 ml-auto">
                {onAdd && (
                  <button onClick={onAdd} className="h-7 px-3 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" />{addLabel || '新增'}
                  </button>
                )}
                <button onClick={onSearch} className="h-7 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                  <Search className="w-3 h-3" />查询
                </button>
                <button onClick={onRefresh} className="h-7 px-3 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />刷新
                </button>
                <button className="h-7 px-3 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                  <Download className="w-3 h-3" />导出
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 额外内容插槽 */}
        {children}

        {/* 数据表格 */}
        <div className={`flex-1 mx-3 bg-white border border-gray-200 overflow-auto ${filters && filters.length > 0 ? '' : 'rounded-t'}`}>
          <table className="w-full text-xs border-collapse" style={{ minWidth: columns.length * 120 }}>
            <thead className="bg-[#f7f8fa] sticky top-0 z-10">
              <tr>
                {onToggleRow && (
                  <th className="w-8 px-2 py-2 border-b border-r border-gray-200">
                    <input type="checkbox" checked={selectedRows?.size === data.length && data.length > 0} onChange={onToggleAll} className="w-3.5 h-3.5" />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className={`px-2 py-2 border-b border-r border-gray-200 font-medium text-gray-600 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`} style={{ width: col.width }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length + (onToggleRow ? 1 : 0)} className="text-center py-20 text-gray-400">
                  <div className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />加载中...</div>
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length + (onToggleRow ? 1 : 0)} className="text-center py-20 text-gray-400">暂无数据</td></tr>
              ) : data.map((row, i) => (
                <tr key={row[rowKey] ?? i} className={`hover:bg-blue-50/50 ${selectedRows?.has(row[rowKey]) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  {onToggleRow && (
                    <td className="px-2 py-1.5 border-b border-r border-gray-100">
                      <input type="checkbox" checked={selectedRows?.has(row[rowKey])} onChange={() => onToggleRow(row[rowKey])} className="w-3.5 h-3.5" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-2 py-1.5 border-b border-r border-gray-100 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 底部工具栏 */}
        <div className="mx-3 bg-white border border-gray-200 border-t-0 rounded-b px-3 py-1.5 flex items-center gap-1 text-xs">
          {toolbarButtons?.map((btn, i) => (
            <button key={i} onClick={btn.onClick} className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
              {btn.icon && <btn.icon className="w-3 h-3" />}
              {btn.label}
            </button>
          ))}
          {!toolbarButtons?.length && (
            <>
              <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />统计
              </button>
              <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <Settings className="w-3 h-3" />表格设置
              </button>
              <button className="h-6 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 border border-gray-300 flex items-center gap-1">
                <Printer className="w-3 h-3" />打印
              </button>
            </>
          )}
          <div className="flex-1" />
          <span className="text-gray-500">
            共 <span className="text-blue-600 font-medium">{total ?? data.length}</span> 条记录
            {selectedRows && selectedRows.size > 0 && <span className="ml-2">已选 <span className="text-blue-600 font-medium">{selectedRows.size}</span> 条</span>}
          </span>
        </div>
        <div className="h-1" />
      </div>
    </DashboardLayout>
  );
}
