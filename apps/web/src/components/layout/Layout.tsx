import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout Component
 * 
 * This component provides the overall layout structure for the application.
 * It includes:
 * - Header with navigation and wallet connection
 * - Main content area with proper spacing
 * - Footer with links and information
 * 
 * The layout is responsive and provides consistent spacing and structure
 * across all pages of the application.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container-responsive py-6">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}