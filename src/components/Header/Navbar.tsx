import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building2,
  ChevronDown,
  KeyRound,
  LogIn,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import type { NavItem } from '../../types';
import useAuth from '../../hooks/useAuth';

interface NavbarProps {
  onOpenBooking?: () => void;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Trang chủ', href: '#home', isActive: true },
  { id: 'services', label: 'Dịch vụ', href: '#services' },
  { id: 'doctors', label: 'Bác sĩ', href: '#doctors' },
  { id: 'contact', label: 'Liên hệ', href: '#contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, account, logout } = useAuth();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Các liên kết trong menu là neo trong trang chủ, nên khi đang ở trang khác phải quay về
  // trang chủ trước rồi mới cuộn tới mục — nếu không thì '#services' chỉ đổi URL.
  const onHomePage = location.pathname === '/';

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  const handleNavClick = (event: React.MouseEvent, item: NavItem) => {
    setActiveTab(item.id);
    setMobileMenuOpen(false);

    if (!onHomePage) {
      event.preventDefault();
      navigate(`/${item.href}`);
    }
  };

  const handleBooking = () => {
    setMobileMenuOpen(false);

    if (onOpenBooking) {
      onOpenBooking();
      return;
    }

    navigate('/booking');
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon-wrapper">
            <Building2 className="logo-icon" size={26} />
          </div>
          <div className="logo-text-group">
            <span className="logo-title">Phòng Khám Da Liễu</span>
            <span className="logo-subtitle">Chăm sóc sức khỏe tận tâm</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-menu">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={(event) => handleNavClick(event, item)}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA + tài khoản */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="account-menu" ref={accountMenuRef}>
              <button
                type="button"
                className="account-menu-trigger"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
              >
                <span className="account-avatar">
                  {account?.full_name?.trim().charAt(0).toUpperCase() || 'B'}
                </span>
                <span className="account-menu-name">{account?.full_name}</span>
                <ChevronDown size={16} />
              </button>

              {accountMenuOpen && (
                <div className="account-dropdown" role="menu">
                  <Link
                    to="/lich-hen-cua-toi"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <Calendar size={16} /> Lịch hẹn của tôi
                  </Link>
                  <Link to="/ho-so" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                    <User size={16} /> Hồ sơ của tôi
                  </Link>
                  <Link
                    to="/doi-mat-khau"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <KeyRound size={16} /> Đổi mật khẩu
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline btn-login">
              <LogIn size={18} />
              <span>Đăng nhập</span>
            </Link>
          )}

          <button type="button" className="btn btn-primary btn-booking" onClick={handleBooking}>
            <Calendar size={18} />
            <span>Đặt lịch ngay</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu-dropdown">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`mobile-nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={(event) => handleNavClick(event, item)}
            >
              {item.label}
            </a>
          ))}

          {isAuthenticated ? (
            <>
              <Link
                to="/lich-hen-cua-toi"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lịch hẹn của tôi
              </Link>
              <Link
                to="/ho-so"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Hồ sơ của tôi
              </Link>
              <Link
                to="/doi-mat-khau"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Đổi mật khẩu
              </Link>
              <button type="button" className="mobile-nav-link" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Đăng nhập
            </Link>
          )}

          <button
            type="button"
            className="btn btn-primary btn-booking mobile-btn-booking"
            onClick={handleBooking}
          >
            <Calendar size={18} />
            <span>Đặt lịch ngay</span>
          </button>
        </div>
      )}
    </nav>
  );
};
