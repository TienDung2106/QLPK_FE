import React from 'react';
import { TopBar } from './TopBar';
import { Navbar } from './Navbar';

interface HeaderProps {
  onOpenBooking?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBooking }) => {
  return (
    <header className="site-header">
      <TopBar />
      <Navbar onOpenBooking={onOpenBooking} />
    </header>
  );
};

export { TopBar, Navbar };
