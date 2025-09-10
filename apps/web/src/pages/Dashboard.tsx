import React from 'react';
import { RewardsDashboard } from '../components/RewardsDashboard';

/**
 * Dashboard Page Component
 * 
 * This page serves as the main user dashboard showing:
 * - Available rewards and claiming interface
 * - User statistics and progress
 * - Recent transaction history
 * - Account information and settings
 * 
 * This is where users will spend most of their time interacting with the reward system.
 */
export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your reward status and recent activity.
        </p>
      </div>

      {/* Main Dashboard Content */}
      <RewardsDashboard />
    </div>
  );
}