/**
 * User Service - Profile and user account management
 *
 * This service handles all user-related API operations including:
 * - Profile information retrieval and updates
 * - User preferences management
 * - Account statistics and activity data
 * - User data export and account deletion
 */

import { api } from './api';
import type { User } from '@reward-system/shared';

/**
 * User profile information structure
 */
export interface UserProfile {
  id: string;
  wallet_address: string;
  username: string;
  email: string | null;
  created_at: string;
  last_login: string | null;
}

/**
 * Profile update request payload
 */
export interface ProfileUpdateRequest {
  username?: string;
  email?: string | null;
}

/**
 * User preferences structure
 */
export interface UserPreferences {
  autoClaimEnabled: boolean;
  minClaimAmount: string;
  emailNotifications: boolean;
}

/**
 * User statistics and activity summary
 */
export interface UserStats {
  totalEarned: string;
  totalTransactions: number;
  successfulTransactions: number;
  successRate: number;
  joinDate: string;
  lastActivity: string | null;
  firstReward: string | null;
  lastReward: string | null;
}

/**
 * Get current user profile information
 *
 * @returns Promise<UserProfile> Current user's profile data
 * @throws ApiError if request fails or user is not authenticated
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const profile = await api.get<UserProfile>('/users/profile');
    return profile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
}

/**
 * Update user profile information
 *
 * @param updates - Partial profile updates (username and/or email)
 * @returns Promise<UserProfile> Updated profile data
 * @throws ApiError if validation fails or update is unsuccessful
 */
export async function updateUserProfile(
  updates: ProfileUpdateRequest
): Promise<UserProfile> {
  try {
    // Validate input data
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No profile updates provided');
    }

    // Validate username format if provided
    if (updates.username !== undefined) {
      if (updates.username.length > 0 && updates.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (updates.username.length > 30) {
        throw new Error('Username must be less than 30 characters');
      }
      // Allow alphanumeric, underscore, and hyphen
      if (updates.username && !/^[a-zA-Z0-9_-]+$/.test(updates.username)) {
        throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Validate email format if provided
    if (updates.email !== undefined && updates.email !== null && updates.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error('Please enter a valid email address');
      }
    }

    const updatedProfile = await api.put<UserProfile>('/users/profile', updates);
    return updatedProfile;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}

/**
 * Get user preferences for rewards and notifications
 *
 * @returns Promise<UserPreferences> Current user preferences
 * @throws ApiError if request fails
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const preferences = await api.get<UserPreferences>('/users/preferences');
    return preferences;
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 *
 * @param preferences - Updated preference settings
 * @returns Promise<UserPreferences> Updated preferences
 * @throws ApiError if update fails
 */
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  try {
    const updatedPreferences = await api.put<UserPreferences>('/users/preferences', {
      auto_claim_enabled: preferences.autoClaimEnabled,
      min_claim_amount: preferences.minClaimAmount,
      email_notifications: preferences.emailNotifications,
    });
    return updatedPreferences;
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
}

/**
 * Get user statistics and activity summary
 *
 * @returns Promise<UserStats> User's activity statistics
 * @throws ApiError if request fails
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const stats = await api.get<UserStats>('/users/stats');
    return stats;
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    throw error;
  }
}

/**
 * Export all user data as JSON file
 *
 * This downloads a comprehensive export of all user data including:
 * - Profile information
 * - Transaction history
 * - Preferences
 * - Support tickets
 *
 * @returns Promise<void> Triggers file download
 * @throws ApiError if export fails
 */
export async function exportUserData(): Promise<void> {
  try {
    // Make direct request to handle file download
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'}/users/export`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Create download link
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-data-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export user data:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data
 *
 * WARNING: This action is irreversible and will delete all user data
 * including profile, transactions, preferences, and support tickets.
 *
 * @returns Promise<void> Account deletion confirmation
 * @throws ApiError if deletion fails
 */
export async function deleteUserAccount(): Promise<void> {
  try {
    await api.delete('/users/account');

    // Clear local storage after successful deletion
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');

    // Trigger logout event to update UI
    window.dispatchEvent(new CustomEvent('auth:logout'));
  } catch (error) {
    console.error('Failed to delete user account:', error);
    throw error;
  }
}