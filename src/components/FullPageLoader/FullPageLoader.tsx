import { Loader2 } from 'lucide-react';

/** Màn chờ khi chưa biết người dùng là ai, hoặc khi một trang đang tải dữ liệu đầu tiên. */
export const FullPageLoader = ({ label = 'Đang tải...' }: { label?: string }) => (
  <div className="full-page-loader" role="status" aria-live="polite">
    <Loader2 className="full-page-loader-icon" size={32} />
    <span>{label}</span>
  </div>
);
