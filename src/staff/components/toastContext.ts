import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'danger' | 'info';

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string | null | undefined) => void;
}

export const ToastContext = createContext<ToastApi>({
  show: () => undefined,
  success: () => undefined,
  error: () => undefined,
});

export const useToast = () => useContext(ToastContext);
