/**
 * Home Page Tests
 *
 * Comprehensive test suite for the Home page component covering:
 * - Wallet connection states and UI adaptation
 * - Gradient button functionality and interactions
 * - Navigation behavior and routing
 * - Feature section rendering and content
 * - Responsive design elements
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { HomePage } from '../Home';

// Mock wallet adapter
jest.mock('@solana/wallet-adapter-react');
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

// Mock router navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window methods
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SOLANA_NETWORK: 'devnet',
    VITE_SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  },
  writable: true,
});

const mockPublicKey = {
  toString: () => '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
};

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connected Wallet State', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
      } as any);
    });

    it('should render main heading and description', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText('Timestamped')).toBeInTheDocument();
      expect(screen.getByText('Token Rewards')).toBeInTheDocument();
      expect(screen.getByText(/Learn Solana blockchain development/)).toBeInTheDocument();
    });

    it('should show dashboard and history links when connected', () => {
      renderWithRouter(<HomePage />);

      const dashboardButton = screen.getByRole('link', { name: /open dashboard/i });
      const historyButton = screen.getByRole('link', { name: /view history/i });

      expect(dashboardButton).toBeInTheDocument();
      expect(historyButton).toBeInTheDocument();
      expect(dashboardButton).toHaveAttribute('href', '/dashboard');
      expect(historyButton).toHaveAttribute('href', '/transactions');
    });

    it('should not show wallet connection button when connected', () => {
      renderWithRouter(<HomePage />);

      expect(screen.queryByText('Connect Your Solana Wallet to Start')).not.toBeInTheDocument();
    });

    it('should display dashboard button with correct styling', () => {
      renderWithRouter(<HomePage />);

      const dashboardButton = screen.getByRole('link', { name: /open dashboard/i });
      expect(dashboardButton).toHaveClass('bg-primary');
      expect(dashboardButton).toHaveClass('text-primary-foreground');
      expect(dashboardButton).toHaveClass('hover:scale-105');
    });
  });

  describe('Disconnected Wallet State', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        connected: false,
        publicKey: null,
      } as any);
    });

    it('should show wallet connection button when not connected', () => {
      renderWithRouter(<HomePage />);

      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('should have correct styling for gradient button', () => {
      renderWithRouter(<HomePage />);

      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });
      expect(connectButton).toHaveClass('gradient-bg-readable');
      expect(connectButton).toHaveClass('gradient-animated');
      expect(connectButton).toHaveClass('hover:scale-105');
    });

    it('should not show dashboard and history links when disconnected', () => {
      renderWithRouter(<HomePage />);

      expect(screen.queryByRole('link', { name: /open dashboard/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /view history/i })).not.toBeInTheDocument();
    });

    it('should show instructional text for wallet connection', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText(/Click the button above or use the wallet button in the top navigation/)).toBeInTheDocument();
    });

    it('should display animated arrow pointing up', () => {
      renderWithRouter(<HomePage />);

      const arrow = screen.getByRole('img', { hidden: true }); // SVG elements are often hidden from screen readers
      expect(arrow.closest('svg')).toHaveClass('animate-bounce');
    });
  });

  describe('Wallet Connection Button Functionality', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        connected: false,
        publicKey: null,
      } as any);
    });

    it('should scroll to top when connect button is clicked', async () => {
      const mockScrollTo = jest.fn();
      Object.defineProperty(window, 'scrollTo', {
        writable: true,
        value: mockScrollTo,
      });

      renderWithRouter(<HomePage />);

      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });
      fireEvent.click(connectButton);

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('should attempt to focus wallet button after scroll delay', async () => {
      jest.useFakeTimers();

      // Mock querySelector to return a wallet button element
      const mockWalletButton = {
        focus: jest.fn(),
        style: {},
      };
      const mockQuerySelector = jest.fn().mockReturnValue(mockWalletButton);
      Object.defineProperty(document, 'querySelector', {
        writable: true,
        value: mockQuerySelector,
      });

      renderWithRouter(<HomePage />);

      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });
      fireEvent.click(connectButton);

      // Fast-forward past the initial scroll delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockQuerySelector).toHaveBeenCalledWith('[data-testid="wallet-adapter-button"]');
        expect(mockWalletButton.focus).toHaveBeenCalled();
      });

      // Fast-forward past the highlight effect delay
      jest.advanceTimersByTime(2000);

      jest.useRealTimers();
    });

    it('should handle missing wallet button gracefully', async () => {
      jest.useFakeTimers();

      // Mock querySelector to return null (wallet button not found)
      const mockQuerySelector = jest.fn().mockReturnValue(null);
      Object.defineProperty(document, 'querySelector', {
        writable: true,
        value: mockQuerySelector,
      });

      renderWithRouter(<HomePage />);

      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });

      // Should not throw error when wallet button is not found
      expect(() => {
        fireEvent.click(connectButton);
        jest.advanceTimersByTime(500);
      }).not.toThrow();

      jest.useRealTimers();
    });
  });

  describe('Features Section', () => {
    it('should render all three feature cards', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText('Timestamped Rewards')).toBeInTheDocument();
      expect(screen.getByText('Secure & Transparent')).toBeInTheDocument();
      expect(screen.getByText('Fast & Low Cost')).toBeInTheDocument();
    });

    it('should display feature descriptions', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText(/Earn tokens based on time intervals/)).toBeInTheDocument();
      expect(screen.getByText(/Built on Solana blockchain with smart contracts/)).toBeInTheDocument();
      expect(screen.getByText(/Leverage Solana's high performance/)).toBeInTheDocument();
    });

    it('should render feature icons', () => {
      renderWithRouter(<HomePage />);

      // Check for presence of SVG icons (they don't have accessible names)
      const featureCards = screen.getAllByText(/Timestamped Rewards|Secure & Transparent|Fast & Low Cost/);
      expect(featureCards).toHaveLength(3);

      // Each feature card should have an icon container
      const iconContainers = document.querySelectorAll('.w-12.h-12.bg-primary\\/10');
      expect(iconContainers).toHaveLength(3);
    });
  });

  describe('Educational Section', () => {
    it('should render educational content', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText('Educational Purpose')).toBeInTheDocument();
      expect(screen.getByText(/This application is designed as a comprehensive tutorial/)).toBeInTheDocument();
    });

    it('should display technology stack information', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText('React 18')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Redux Toolkit')).toBeInTheDocument();
      expect(screen.getByText('Solana Programs')).toBeInTheDocument();
    });

    it('should show technology descriptions', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText('Modern frontend with hooks and context')).toBeInTheDocument();
      expect(screen.getByText('Type-safe development throughout')).toBeInTheDocument();
      expect(screen.getByText('Professional state management')).toBeInTheDocument();
      expect(screen.getByText('Smart contracts with Anchor framework')).toBeInTheDocument();
    });
  });

  describe('Network Status', () => {
    it('should display network information', () => {
      renderWithRouter(<HomePage />);

      expect(screen.getByText(/Connected to devnet/)).toBeInTheDocument();
    });

    it('should show connection status indicator', () => {
      renderWithRouter(<HomePage />);

      const statusIndicator = document.querySelector('.w-2.h-2.bg-green-500.rounded-full.animate-pulse');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should use fallback network when env var is not set', () => {
      // Temporarily override environment variable
      Object.defineProperty(import.meta, 'env', {
        value: {},
        writable: true,
      });

      renderWithRouter(<HomePage />);

      expect(screen.getByText(/Connected to devnet/)).toBeInTheDocument();

      // Restore original env
      Object.defineProperty(import.meta, 'env', {
        value: {
          VITE_SOLANA_NETWORK: 'devnet',
          VITE_SOLANA_RPC_URL: 'https://api.devnet.solana.com',
        },
        writable: true,
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      renderWithRouter(<HomePage />);

      // Features section should have responsive grid
      const featuresSection = screen.getByText('Timestamped Rewards').closest('section');
      expect(featuresSection).toHaveClass('grid-cols-1', 'md:grid-cols-3');

      // Technology stack should have responsive grid
      const techSection = screen.getByText('React 18').closest('div');
      expect(techSection?.classList.toString()).toMatch(/grid-cols-1|sm:grid-cols-2|lg:grid-cols-4/);
    });

    it('should have responsive button layout', () => {
      mockUseWallet.mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
      } as any);

      renderWithRouter(<HomePage />);

      const buttonContainer = screen.getByRole('link', { name: /open dashboard/i }).closest('div');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<HomePage />);

      // Main heading should be h1
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Section headings should be h2
      const educationalHeading = screen.getByRole('heading', { level: 2, name: /educational purpose/i });
      expect(educationalHeading).toBeInTheDocument();

      // Feature headings should be h3
      const featureHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(featureHeadings.length).toBeGreaterThan(0);
    });

    it('should have accessible button with focus states', () => {
      mockUseWallet.mockReturnValue({
        connected: false,
        publicKey: null,
      } as any);

      renderWithRouter(<HomePage />);

      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });
      expect(connectButton).toHaveClass('focus:outline-none');
      expect(connectButton).toHaveClass('focus:ring-4');
    });

    it('should have accessible links with proper attributes', () => {
      mockUseWallet.mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
      } as any);

      renderWithRouter(<HomePage />);

      const dashboardLink = screen.getByRole('link', { name: /open dashboard/i });
      const historyLink = screen.getByRole('link', { name: /view history/i });

      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(historyLink).toHaveAttribute('href', '/transactions');
    });
  });

  describe('Visual Effects and Animations', () => {
    it('should have animated elements', () => {
      mockUseWallet.mockReturnValue({
        connected: false,
        publicKey: null,
      } as any);

      renderWithRouter(<HomePage />);

      // Connect button should have gradient animation
      const connectButton = screen.getByRole('button', { name: /connect your solana wallet to start/i });
      expect(connectButton).toHaveClass('gradient-animated');

      // Arrow should bounce
      const arrowSvg = document.querySelector('.animate-bounce');
      expect(arrowSvg).toBeInTheDocument();

      // Network status should pulse
      const statusIndicator = document.querySelector('.animate-pulse');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should have hover effects on interactive elements', () => {
      mockUseWallet.mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
      } as any);

      renderWithRouter(<HomePage />);

      const dashboardButton = screen.getByRole('link', { name: /open dashboard/i });
      expect(dashboardButton).toHaveClass('hover:scale-105');
    });
  });
});