import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext } from './toastContext';
import type { ToastApi, ToastTone } from './toastContext';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let nextId = 1;

const ICON: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={16} />,
  danger: <AlertCircle size={16} />,
  info: <Info size={16} />,
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId++;
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      // Lỗi ở lại lâu hơn: người dùng cần đọc để biết phải làm gì tiếp.
      window.setTimeout(() => dismiss(id), tone === 'danger' ? 7000 : 3500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message || 'Đã có lỗi xảy ra. Vui lòng thử lại.', 'danger'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="st-toasts" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`st-toast ${item.tone}`} role={item.tone === 'danger' ? 'alert' : 'status'}>
            {ICON[item.tone]}
            <span style={{ flex: 1 }}>{item.message}</span>
            <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(item.id)} style={{ color: 'inherit' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
