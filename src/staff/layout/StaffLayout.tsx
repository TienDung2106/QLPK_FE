import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, KeyRound, LogOut, Menu } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { resolveLandingPath } from '../../auth/landing';
import { API_ROOT, API_TARGET, API_TARGET_LABEL } from '../../api/apiTarget';
import { ROLE_LABEL } from '../labels';
import { initials } from '../format';
import { ToastProvider } from '../components/ToastProvider';
import { NotificationBell } from '../components/NotificationBell';
import { NAV_SECTIONS } from './navConfig';
import '../staff.css';

/**
 * Khung chung của mọi khu nhân viên: sidebar theo quyền, topbar, vùng nội dung.
 *
 * Menu dựng từ `account.permissions` chứ không từ vai trò, nên admin — vốn mang cả quyền
 * thu ngân lẫn nhà thuốc — tự thấy thêm hai nhóm đó mà không cần danh sách riêng.
 */
export const StaffLayout = () => {
  const { account, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [railOpen, setRailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đổi trang thì đóng menu: điều chỉnh ngay trong lượt render thay vì qua effect.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setRailOpen(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(item.permission)),
  })).filter((section) => section.items.length > 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="st-app">
      <ToastProvider>
        {railOpen && <div className="st-rail-scrim" onClick={() => setRailOpen(false)} />}
        <aside className={`st-rail ${railOpen ? 'open' : ''}`} aria-label="Điều hướng khu nhân viên">
          <Link to={resolveLandingPath(account)} className="st-rail-brand">
            <span className="st-rail-brand-mark">
              <Building2 size={20} />
            </span>
            <span>
              <span className="st-rail-brand-name">Phòng Khám Da Liễu</span>
              <br />
              <span className="st-rail-brand-sub">Khu làm việc nhân viên</span>
            </span>
          </Link>

          <nav>
            {sections.map((section) => (
              <div key={section.key} className="st-rail-group">
                {sections.length > 1 && <div className="st-rail-group-title">{section.title}</div>}
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end ?? false}
                    className={({ isActive }) => `st-rail-link ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="st-main">
          <header className="st-topbar">
            <button
              type="button"
              className="st-btn st-btn-ghost st-btn-icon st-topbar-menu"
              aria-label="Mở menu"
              onClick={() => setRailOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="st-topbar-spacer" />

            {/* Chỉ khi chạy dev: để biết đang test với backend nào. Bản build luôn là Azure. */}
            {import.meta.env.DEV && (
              <span
                className={`st-api-badge ${API_TARGET}`}
                title={`Đang gọi ${API_ROOT}`}
                aria-label={`Máy chủ API: ${API_TARGET_LABEL}`}
              >
                <span className="st-api-badge-text">API:</span> {API_TARGET_LABEL}
              </span>
            )}

            <NotificationBell />

            <div className="st-user" ref={menuRef}>
              <button
                type="button"
                className="st-user-trigger"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="st-avatar">{initials(account?.full_name)}</span>
                <span className="st-user-meta">
                  <span className="st-user-name">{account?.full_name}</span>
                  <br />
                  <span className="st-user-role">{ROLE_LABEL[account?.role_code ?? ''] ?? account?.role_name}</span>
                </span>
                <ChevronDown size={15} />
              </button>
              {menuOpen && (
                <div className="st-menu" role="menu">
                  <Link to="/doi-mat-khau" role="menuitem">
                    <KeyRound size={15} /> Đổi mật khẩu
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="st-content">
            <Outlet />
          </main>
        </div>
      </ToastProvider>
    </div>
  );
};

export default StaffLayout;
