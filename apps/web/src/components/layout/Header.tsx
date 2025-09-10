import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * Header Component
 * 
 * This component provides the main navigation header for the application.
 * It includes:
 * - Application logo and title
 * - Navigation menu with active state highlighting
 * - Wallet connection button
 * - Responsive design for mobile and desktop
 */
export function Header() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-responsive">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">TR</span>
              </div>
              <span className="font-semibold text-lg hidden sm:inline-block">
                Token Rewards
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActivePath(item.path)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-primary !rounded-md !text-primary-foreground hover:!bg-primary/90 !transition-colors !border-0 !h-9 !px-4 !text-sm !font-medium" />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t py-3">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs font-medium transition-colors hover:text-primary px-2 py-1 rounded ${
                  isActivePath(item.path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}