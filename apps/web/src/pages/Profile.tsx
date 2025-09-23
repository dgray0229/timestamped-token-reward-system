import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserStats,
  exportUserData,
  deleteUserAccount
} from '../services';
import type {
  UserProfile,
  UserPreferences,
  UserStats
} from '../services/user';

/**
 * Profile Page Component
 *
 * This page allows users to:
 * - View and edit their profile information (username, email)
 * - Manage account settings and preferences
 * - View account statistics and activity history
 * - Export account data or delete account
 *
 * Features state management for form data, loading states, and error handling.
 * Integrates with backend API for persistent data storage.
 */
export function ProfilePage() {
  const { connected, publicKey } = useWallet();

  // Profile state management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: ''
  });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isExporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * Load user data when component mounts or wallet connects
   * Fetches profile, preferences, and statistics in parallel
   */
  useEffect(() => {
    if (connected) {
      loadUserData();
    }
  }, [connected]);

  /**
   * Track form changes to enable/disable save button
   */
  useEffect(() => {
    if (profile) {
      const hasChanges =
        profileForm.username !== (profile.username || '') ||
        profileForm.email !== (profile.email || '');
      setHasUnsavedChanges(hasChanges);
    }
  }, [profileForm, profile]);

  /**
   * Load all user data from API
   */
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all user data in parallel for better performance
      const [profileData, preferencesData, statsData] = await Promise.all([
        getUserProfile(),
        getUserPreferences(),
        getUserStats()
      ]);

      setProfile(profileData);
      setProfileForm({
        username: profileData.username || '',
        email: profileData.email || ''
      });
      setPreferences(preferencesData);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      setError(error.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: 'username' | 'email', value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear success message
  };

  /**
   * Handle preference toggle changes
   */
  const handlePreferenceChange = async (field: keyof UserPreferences, value: boolean | string) => {
    if (!preferences) return;

    try {
      const updatedPreferences = await updateUserPreferences({
        ...preferences,
        [field]: value
      });
      setPreferences(updatedPreferences);
      setSuccessMessage('Preferences updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to update preferences');
    }
  };

  /**
   * Save profile changes to backend
   */
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare update payload - only include changed fields
      const updates: { username?: string; email?: string | null } = {};

      if (profileForm.username !== (profile?.username || '')) {
        updates.username = profileForm.username.trim() || '';
      }

      if (profileForm.email !== (profile?.email || '')) {
        updates.email = profileForm.email.trim() || null;
      }

      // Only make API call if there are actual changes
      if (Object.keys(updates).length === 0) {
        setSuccessMessage('No changes to save');
        return;
      }

      const updatedProfile = await updateUserProfile(updates);
      setProfile(updatedProfile);
      setProfileForm({
        username: updatedProfile.username || '',
        email: updatedProfile.email || ''
      });
      setHasUnsavedChanges(false);
      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Profile save error:', error);
      setError(error.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel form changes and reset to original values
   */
  const handleCancelChanges = () => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        email: profile.email || ''
      });
      setHasUnsavedChanges(false);
      setError(null);
      setSuccessMessage(null);
    }
  };

  /**
   * Handle data export
   */
  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);
      await exportUserData();
      setSuccessMessage('Data exported successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Handle account deletion with confirmation
   */
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This is your final warning. Deleting your account will permanently remove all transactions, preferences, and profile data. Type "DELETE" to confirm.'
      );

      if (doubleConfirmed) {
        try {
          await deleteUserAccount();
          // Account deletion automatically triggers logout and redirects
        } catch (error: any) {
          setError(error.message || 'Failed to delete account');
        }
      }
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Show wallet connection prompt if not connected
  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="card p-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Wallet Required</h2>
          <p className="text-muted-foreground">
            Please connect your Solana wallet to view and manage your profile.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="card p-8 max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and view your activity summary.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="card p-4 border-destructive bg-destructive/10">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="card p-4 border-green-500 bg-green-50">
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Account Information</h2>

            <div className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="text-sm font-medium block mb-1">
                  Username
                  <span className="text-muted-foreground ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter username"
                  maxLength={30}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Letters, numbers, underscores, and hyphens only. 3-30 characters.
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label className="text-sm font-medium block mb-1">
                  Email
                  <span className="text-muted-foreground ml-1">(optional)</span>
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for notifications and account recovery.
                </p>
              </div>

              {/* Wallet Address (Read-only) */}
              <div>
                <label className="text-sm font-medium block mb-1">Wallet Address</label>
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {publicKey?.toString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This is your connected Solana wallet address.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSaveProfile}
                disabled={!hasUnsavedChanges || isSaving}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancelChanges}
                disabled={!hasUnsavedChanges}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Preferences</h2>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications about reward claims and important updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences?.emailNotifications || false}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
              </div>

              {/* Auto-claim Rewards */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-claim Rewards</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically claim rewards when available (requires wallet approval)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences?.autoClaimEnabled || false}
                  onChange={(e) => handlePreferenceChange('autoClaimEnabled', e.target.checked)}
                  className="rounded border-input text-primary focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">Account Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">{formatDate(stats?.joinDate || null)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Earned</span>
                <span className="text-sm font-medium">{stats?.totalEarned || '0'} TOK</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Claims</span>
                <span className="text-sm font-medium">{stats?.totalTransactions || 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-medium">
                  {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">Quick Actions</h3>

            <div className="space-y-2">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>

              <button
                onClick={() => window.open(`https://solscan.io/account/${publicKey?.toString()}?cluster=${import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}`, '_blank')}
                className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                View on Solscan
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full inline-flex items-center justify-center rounded-md border border-destructive text-destructive px-4 py-2 text-sm font-medium shadow-sm hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Network Info */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">Network Information</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm font-medium">
                  {import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">RPC Endpoint</span>
                <span className="text-sm font-medium text-right break-all">
                  {import.meta.env.VITE_SOLANA_RPC_URL?.split('/').pop() || 'localhost'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}