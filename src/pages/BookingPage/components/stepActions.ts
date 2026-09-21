import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Đưa nút Quay lại / Tiếp tục của một bước sang chỗ dành sẵn ở cột tóm tắt, nếu chỗ đó đã có. */
export const renderActions = (actions: ReactNode, slot: HTMLElement | null | undefined) =>
  slot ? createPortal(actions, slot) : actions;
