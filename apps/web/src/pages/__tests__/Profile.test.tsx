/**
 * Profile Page Tests
 *
 * Comprehensive test suite for the Profile page component covering:
 * - Component rendering and state management
 * - Form interactions and validation
 * - API integration and error handling
 * - User preferences management
 * - Data export and account deletion flows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ProfilePage } from '../Profile';
import * as userService from '../../services/user';

// Mock wallet adapter
jest.mock('@solana/wallet-adapter-react');
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;

// Mock user service functions
jest.mock('../../services/user');
const mockGetUserProfile = userService.getUserProfile as jest.MockedFunction<typeof userService.getUserProfile>;
const mockUpdateUserProfile = userService.updateUserProfile as jest.MockedFunction<typeof userService.updateUserProfile>;
const mockGetUserPreferences = userService.getUserPreferences as jest.MockedFunction<typeof userService.getUserPreferences>;
const mockUpdateUserPreferences = userService.updateUserPreferences as jest.MockedFunction<typeof userService.updateUserPreferences>;
const mockGetUserStats = userService.getUserStats as jest.MockedFunction<typeof userService.getUserStats>;
const mockExportUserData = userService.exportUserData as jest.MockedFunction<typeof userService.exportUserData>;
const mockDeleteUserAccount = userService.deleteUserAccount as jest.MockedFunction<typeof userService.deleteUserAccount>;

// Mock window methods
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Sample test data
const mockProfile = {
  id: 'user-123',
  wallet_address: '5FHneW46...',
  username: 'testuser',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  last_login: '2023-12-01T00:00:00Z',
};

const mockPreferences = {
  autoClaimEnabled: false,
  minClaimAmount: '0.1',
  emailNotifications: true,
};

const mockStats = {
  totalEarned: '10.50',
  totalTransactions: 5,
  successfulTransactions: 4,
  successRate: 80.0,
  joinDate: '2023-01-01T00:00:00Z',
  lastActivity: '2023-12-01T00:00:00Z',
  firstReward: '2023-01-02T00:00:00Z',
  lastReward: '2023-12-01T00:00:00Z',
};

const mockPublicKey = {
  toString: () => '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default wallet mock setup
    mockUseWallet.mockReturnValue({
      connected: true,
      publicKey: mockPublicKey,
    } as any);

    // Default API mock responses
    mockGetUserProfile.mockResolvedValue(mockProfile);
    mockGetUserPreferences.mockResolvedValue(mockPreferences);
    mockGetUserStats.mockResolvedValue(mockStats);
  });

  describe('Wallet Connection States', () => {
    it('should show wallet connection prompt when not connected', () => {
      mockUseWallet.mockReturnValue({
        connected: false,
        publicKey: null,
      } as any);

      render(<ProfilePage />);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Wallet Required')).toBeInTheDocument();
      expect(screen.getByText('Please connect your Solana wallet to view and manage your profile.')).toBeInTheDocument();
    });

    it('should show loading state while fetching data', async () => {
      // Delay the API response to test loading state
      mockGetUserProfile.mockImplementation(() => new Promise(() => {}));

      render(<ProfilePage />);

      expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Profile Data Loading', () => {
    it('should load and display user profile data', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockGetUserProfile).toHaveBeenCalled();
        expect(mockGetUserPreferences).toHaveBeenCalled();
        expect(mockGetUserStats).toHaveBeenCalled();
      });

      // Check if profile data is displayed
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByText(mockPublicKey.toString())).toBeInTheDocument();
    });

    it('should display user statistics correctly', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('10.50 TOK')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // Total transactions
        expect(screen.getByText('80%')).toBeInTheDocument(); // Success rate
      });
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to load profile data';
      mockGetUserProfile.mockRejectedValue(new Error(errorMessage));

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Form Interactions', () => {
    it('should enable save button when form data changes', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      // Initially save button should be disabled
      expect(saveButton).toBeDisabled();

      // Change username to enable save button
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'newusername');

      expect(saveButton).toBeEnabled();
    });

    it('should save profile changes successfully', async () => {
      const updatedProfile = { ...mockProfile, username: 'newusername' };
      mockUpdateUserProfile.mockResolvedValue(updatedProfile);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      // Change username
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'newusername');

      // Save changes
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalledWith({
          username: 'newusername',
        });
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('test@example.com');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      // Enter invalid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'invalid-email');

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/)).toBeInTheDocument();
      });
    });

    it('should cancel form changes', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Change username
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'newusername');

      // Cancel changes
      fireEvent.click(cancelButton);

      // Should revert to original value
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });
  });

  describe('Preferences Management', () => {
    it('should toggle email notifications', async () => {
      mockUpdateUserPreferences.mockResolvedValue({
        ...mockPreferences,
        emailNotifications: false,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        const emailNotificationsCheckbox = screen.getByRole('checkbox', { name: /email notifications/i });
        expect(emailNotificationsCheckbox).toBeChecked();
      });

      const emailNotificationsCheckbox = screen.getByRole('checkbox', { name: /email notifications/i });
      fireEvent.click(emailNotificationsCheckbox);

      await waitFor(() => {
        expect(mockUpdateUserPreferences).toHaveBeenCalledWith({
          ...mockPreferences,
          emailNotifications: false,
        });
        expect(screen.getByText('Preferences updated successfully')).toBeInTheDocument();
      });
    });

    it('should toggle auto-claim rewards', async () => {
      mockUpdateUserPreferences.mockResolvedValue({
        ...mockPreferences,
        autoClaimEnabled: true,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        const autoClaimCheckbox = screen.getByRole('checkbox', { name: /auto-claim rewards/i });
        expect(autoClaimCheckbox).not.toBeChecked();
      });

      const autoClaimCheckbox = screen.getByRole('checkbox', { name: /auto-claim rewards/i });
      fireEvent.click(autoClaimCheckbox);

      await waitFor(() => {
        expect(mockUpdateUserPreferences).toHaveBeenCalledWith({
          ...mockPreferences,
          autoClaimEnabled: true,
        });
      });
    });
  });

  describe('Quick Actions', () => {
    it('should export user data', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export data/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockExportUserData).toHaveBeenCalled();
        expect(screen.getByText('Data exported successfully!')).toBeInTheDocument();
      });
    });

    it('should handle export errors', async () => {
      const errorMessage = 'Export failed';
      mockExportUserData.mockRejectedValue(new Error(errorMessage));

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export data/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should open Solscan when view on solscan is clicked', async () => {
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      const solscanButton = screen.getByRole('button', { name: /view on solscan/i });
      fireEvent.click(solscanButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('solscan.io'),
        '_blank'
      );
    });

    it('should handle account deletion with confirmation', async () => {
      const mockConfirm = window.confirm as jest.MockedFunction<typeof window.confirm>;
      mockConfirm.mockReturnValueOnce(true).mockReturnValueOnce(true);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledTimes(2);
        expect(mockDeleteUserAccount).toHaveBeenCalled();
      });
    });

    it('should cancel account deletion if not confirmed', async () => {
      const mockConfirm = window.confirm as jest.MockedFunction<typeof window.confirm>;
      mockConfirm.mockReturnValue(false);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(mockDeleteUserAccount).not.toHaveBeenCalled();
    });
  });

  describe('Network Information', () => {
    it('should display network information correctly', async () => {
      // Mock environment variables
      Object.defineProperty(import.meta, 'env', {
        value: {
          VITE_SOLANA_NETWORK: 'devnet',
          VITE_SOLANA_RPC_URL: 'https://api.devnet.solana.com',
        },
        writable: true,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('devnet')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate username length', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      // Test too short username
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'ab');

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Username must be at least 3 characters long/)).toBeInTheDocument();
      });
    });

    it('should validate username characters', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      // Test invalid characters
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'test@user');

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Username can only contain letters, numbers, underscores, and hyphens/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show saving state when saving profile', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockUpdateUserProfile.mockReturnValue(promise);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      });

      const usernameInput = screen.getByDisplayValue('testuser');
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      // Change username
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'newusername');

      // Click save
      fireEvent.click(saveButton);

      // Should show saving state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!({ ...mockProfile, username: 'newusername' });

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });

    it('should show exporting state when exporting data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockExportUserData.mockReturnValue(promise);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Account Information')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export data/i });
      fireEvent.click(exportButton);

      // Should show exporting state
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
      expect(exportButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(undefined);

      await waitFor(() => {
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });
    });
  });
});