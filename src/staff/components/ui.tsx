import { useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Inbox,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import type { PagedResponse } from '../../api/types';
import type { Tone } from '../labels';

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  loading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
}

export const Button = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconOnly = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={`st-btn st-btn-${variant} ${size === 'sm' ? 'st-btn-sm' : ''} ${iconOnly ? 'st-btn-icon' : ''} ${className}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="st-spin" /> : icon}
    {children}
  </button>
);

/* ---------------------------------------------------------------- Page header */

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
}

export const PageHeader = ({ title, description, actions, backTo, backLabel = 'Quay lại' }: PageHeaderProps) => (
  <div className="st-page-head">
    <div>
      {backTo && (
        <Link to={backTo} className="st-back">
          <ArrowLeft size={14} /> {backLabel}
        </Link>
      )}
      <h1 className="st-page-title">{title}</h1>
      {description && <p className="st-page-desc">{description}</p>}
    </div>
    {actions && <div className="st-actions">{actions}</div>}
  </div>
);

/* ---------------------------------------------------------------- Panel */

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  bodyless?: boolean;
  className?: string;
}

export const Panel = ({ title, subtitle, actions, children, bodyless = false, className = '' }: PanelProps) => (
  <section className={`st-panel ${className}`}>
    {(title || actions) && (
      <header className="st-panel-head">
        <div>
          {title && <h2 className="st-panel-title">{title}</h2>}
          {subtitle && <div className="st-panel-sub">{subtitle}</div>}
        </div>
        {actions && <div className="st-actions">{actions}</div>}
      </header>
    )}
    {bodyless ? children : <div className="st-panel-body">{children}</div>}
  </section>
);

/* ---------------------------------------------------------------- Badge */

export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`st-badge ${tone}`}>{children}</span>
);

export const StatusBadge = ({ value }: { value: { label: string; tone: Tone } }) => (
  <Badge tone={value.tone}>{value.label}</Badge>
);

/* ---------------------------------------------------------------- Alert, empty */

const ALERT_ICON: Record<string, ReactNode> = {
  danger: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  success: <CheckCircle2 size={16} />,
  info: <Info size={16} />,
};

export const Alert = ({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: 'danger' | 'warning' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}) => (
  <div className={`st-alert ${tone} ${className}`} role={tone === 'danger' ? 'alert' : 'status'}>
    {ALERT_ICON[tone]}
    <div>{children}</div>
  </div>
);

export const EmptyState = ({
  title,
  text,
  icon,
  action,
}: {
  title: string;
  text?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="st-empty">
    {icon ?? <Inbox size={32} strokeWidth={1.6} />}
    <div className="st-empty-title">{title}</div>
    {text && <div className="st-empty-text">{text}</div>}
    {action && <div style={{ marginTop: '0.6rem' }}>{action}</div>}
  </div>
);

/* ---------------------------------------------------------------- Form field */

interface FieldProps {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: (id: string) => ReactNode;
}

/** Nhãn gắn đúng với ô nhập qua id sinh sẵn — children nhận id đó. */
export const Field = ({ label, required, hint, className = '', children }: FieldProps) => {
  const id = useId();
  return (
    <div className={`st-field ${className}`}>
      <label className="st-label" htmlFor={id}>
        {label}
        {required && <span className="st-req" aria-hidden="true">*</span>}
      </label>
      {children(id)}
      {hint && <span className="st-hint">{hint}</span>}
    </div>
  );
};

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="st-search">
    <Search size={15} />
    <input
      className="st-input"
      type="search"
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

export interface TabOption {
  value: string;
  label: string;
}

export const FilterTabs = ({
  options,
  value,
  onChange,
  label,
}: {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) => (
  <div className="st-tabs" role="group" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={`st-tab ${value === option.value ? 'active' : ''}`}
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/* ---------------------------------------------------------------- Table helpers */

export const TableSkeleton = ({ columns, rows = 6 }: { columns: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }, (_, row) => (
      <tr key={row} aria-hidden="true">
        {Array.from({ length: columns }, (_, column) => (
          <td key={column}>
            <span className="st-skel" style={{ width: `${45 + ((row * 7 + column * 13) % 45)}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

interface TableStateProps {
  columns: number;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyTitle: string;
  emptyText?: ReactNode;
  onRetry?: () => void;
}

/** Hàng thay thế cho tbody khi đang tải, lỗi hoặc rỗng. Trả null khi có dữ liệu để vẽ. */
export const TableState = ({ columns, loading, error, isEmpty, emptyTitle, emptyText, onRetry }: TableStateProps) => {
  if (loading && isEmpty) {
    return <TableSkeleton columns={columns} />;
  }
  if (error) {
    return (
      <tr>
        <td colSpan={columns}>
          <Alert tone="danger">
            {error}{' '}
            {onRetry && (
              <Button size="sm" variant="ghost" onClick={onRetry}>
                Thử lại
              </Button>
            )}
          </Alert>
        </td>
      </tr>
    );
  }
  if (isEmpty) {
    return (
      <tr>
        <td colSpan={columns}>
          <EmptyState title={emptyTitle} text={emptyText} />
        </td>
      </tr>
    );
  }
  return null;
};

export const Pagination = <T,>({
  page,
  onPage,
}: {
  page: PagedResponse<T> | null;
  onPage: (pageNumber: number) => void;
}) => {
  if (!page || page.total_items === 0) {
    return null;
  }
  const from = (page.page_number - 1) * page.page_size + 1;
  const to = Math.min(page.page_number * page.page_size, page.total_items);

  return (
    <div className="st-pager">
      <span>
        {from}–{to} trên {page.total_items}
      </span>
      <div className="st-pager-controls">
        <Button
          size="sm"
          iconOnly
          variant="ghost"
          aria-label="Trang trước"
          disabled={!page.has_previous_page}
          onClick={() => onPage(page.page_number - 1)}
          icon={<ChevronLeft size={16} />}
        />
        <span>
          Trang {page.page_number}/{Math.max(page.total_pages, 1)}
        </span>
        <Button
          size="sm"
          iconOnly
          variant="ghost"
          aria-label="Trang sau"
          disabled={!page.has_next_page}
          onClick={() => onPage(page.page_number + 1)}
          icon={<ChevronRight size={16} />}
        />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Overlays */

function useEscape(onClose: () => void, active = true) {
  const ref = useRef(onClose);

  useEffect(() => {
    ref.current = onClose;
  });

  useEffect(() => {
    if (!active) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        ref.current();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active]);
}

interface SheetProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Ngăn kéo bên phải cho form tạo/sửa: giữ bảng phía sau trong tầm mắt. */
export const Sheet = ({ open, title, subtitle, onClose, children, footer, wide = false }: SheetProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useEscape(onClose, open);

  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="st-overlay" onClick={onClose} />
      <div
        ref={panelRef}
        className={`st-sheet ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="st-sheet-head">
          <div>
            <h2 id={titleId} className="st-sheet-title">
              {title}
            </h2>
            {subtitle && <div className="st-panel-sub">{subtitle}</div>}
          </div>
          <Button variant="ghost" iconOnly aria-label="Đóng" onClick={onClose} icon={<X size={18} />} />
        </header>
        <div className="st-sheet-body">{children}</div>
        {footer && <footer className="st-sheet-foot">{footer}</footer>}
      </div>
    </>
  );
};

interface ConfirmProps {
  open: boolean;
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger-solid' | 'success';
  loading?: boolean;
  /** Có thì hiện ô lý do bắt buộc. */
  reasonLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  children?: ReactNode;
}

/** Hộp xác nhận cho thao tác không hoàn tác được — đúng chỗ cần chặn tiêu điểm. */
export const ConfirmDialog = (props: ConfirmProps) =>
  // Chỉ gắn phần thân khi mở, để ô lý do tự trống lại ở mỗi lần mở.
  props.open ? <ConfirmDialogBody {...props} /> : null;

const ConfirmDialogBody = ({
  title,
  text,
  confirmLabel = 'Xác nhận',
  tone = 'primary',
  loading = false,
  reasonLabel,
  onConfirm,
  onClose,
  children,
}: ConfirmProps) => {
  const [reason, setReason] = useState('');
  const titleId = useId();
  useEscape(onClose);

  const blocked = Boolean(reasonLabel) && reason.trim().length === 0;

  return (
    <>
      <div className="st-overlay top" onClick={onClose} />
      <div className="st-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="st-dialog-title">
          {title}
        </h2>
        {text && <div className="st-dialog-text">{text}</div>}
        {children}
        {reasonLabel && (
          <div style={{ marginTop: '0.9rem' }}>
            <Field label={reasonLabel} required>
              {(id) => (
                <textarea
                  id={id}
                  className="st-textarea"
                  value={reason}
                  maxLength={255}
                  autoFocus
                  onChange={(event) => setReason(event.target.value)}
                />
              )}
            </Field>
          </div>
        )}
        <div className="st-form-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Huỷ bỏ
          </Button>
          <Button
            variant={tone}
            loading={loading}
            disabled={blocked}
            autoFocus={!reasonLabel}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </>
  );
};
