import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface T9ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function T9Modal({ open, onClose, title, width = '600px', children, footer }: T9ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl" style={{ width, maxWidth: '90vw', maxHeight: '85vh' }}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#f7f8fa] rounded-t-lg">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* 内容区 */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {children}
        </div>
        {/* 底部按钮 */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-[#f7f8fa] rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function T9FormRow({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <label className="w-20 text-xs text-gray-600 text-right pt-1.5 shrink-0">
        {required && <span className="text-red-500 mr-0.5">*</span>}
        {label}:
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function T9Input({ value, onChange, placeholder, type = 'text', ...props }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 transition-colors"
      {...props}
    />
  );
}

export function T9Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 transition-colors"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function T9Textarea({ value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
    />
  );
}

export function T9Button({ children, variant = 'default', onClick, disabled, type = 'button' }: { children: ReactNode; variant?: 'primary' | 'default' | 'danger'; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  const cls = variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400' :
    variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300' :
    'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 disabled:bg-gray-100';
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`h-7 px-4 text-xs rounded transition-colors ${cls}`}>
      {children}
    </button>
  );
}
