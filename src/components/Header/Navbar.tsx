import React, { useState } from 'react';
import { Calendar, Building2, Menu, X } from 'lucide-react';
import type { NavItem } from '../../types';

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

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <a href="#home" className="navbar-logo">
          <div className="logo-icon-wrapper">
            <Building2 className="logo-icon" size={26} />
          </div>
          <div className="logo-text-group">
            <span className="logo-title">Phòng Khám Da Liễu</span>
            <span className="logo-subtitle">Chăm sóc sức khỏe tận tâm</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div className="navbar-menu">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="navbar-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-booking"
            onClick={onOpenBooking}
          >
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
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
            >
              {item.label}
            </a>
          ))}
          <button 
            type="button" 
            className="btn btn-primary btn-booking mobile-btn-booking"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBooking?.();
            }}
          >
            <Calendar size={18} />
            <span>Đặt lịch ngay</span>
          </button>
        </div>
      )}
    </nav>
  );
};
