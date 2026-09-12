import type { ReactNode } from 'react';
import { Header } from '../../components/Header';
import './AuthLayout.css';

/**
 * Ảnh hành lang phòng khám phía sau các trang tài khoản. Cùng nguồn với ảnh ở mục Cơ sở
 * vật chất, nên trang đăng nhập trông vẫn là cùng một phòng khám.
 */
const BACKDROP_URL =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80';

interface AuthLayoutProps {
  title: string;
  /** Câu dẫn ngắn dưới tiêu đề. */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Dòng liên kết ở chân thẻ: "Chưa có tài khoản? Đăng kí". */
  footer?: ReactNode;
  /** Dải tab trên đầu thẻ — chỉ trang đăng nhập dùng. */
  tabs?: ReactNode;
}

/**
 * Vỏ dùng chung của đăng nhập / đăng ký / quên mật khẩu: header quen thuộc ở trên, ảnh nền
 * phủ lớp xanh thương hiệu, và một thẻ kính mờ ở giữa.
 */
export const AuthLayout = ({ title, subtitle, children, footer, tabs }: AuthLayoutProps) => (
  <div className="auth-page">
    <Header />

    <main
      className="auth-backdrop"
      style={{ backgroundImage: `url(${BACKDROP_URL})` }}
    >
      <div className="auth-backdrop-veil" />

      <section className="auth-card">
        <h1 className="auth-card-title">{title}</h1>
        {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
        {tabs}
        {children}
        {footer && <div className="auth-card-footer">{footer}</div>}
      </section>
    </main>
  </div>
);
