import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Profile Page Component
 * 
 * This page allows users to:
 * - View and edit their profile information
 * - Manage account settings and preferences
 * - View account statistics and history
 * - Export account data
 */
export function ProfilePage() {
  const { connected, publicKey } = useWallet();

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and view your activity summary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  placeholder="Enter username (optional)"
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter email (optional)"
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Wallet Address</label>
                <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {publicKey?.toString()}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                Save Changes
              </button>
              <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                Cancel
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications about reward claims and important updates
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto-claim Rewards</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically claim rewards when available (requires wallet approval)
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="rounded border-input text-primary focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Dark Mode</label>
                  <p className="text-xs text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <input
                  type="checkbox"
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
                <span className="text-sm font-medium">Today</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Earned</span>
                <span className="text-sm font-medium">0 TOK</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Claims</span>
                <span className="text-sm font-medium">0</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                Export Data
              </button>
              
              <button className="w-full inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                View on Solscan
              </button>
              
              <button className="w-full inline-flex items-center justify-center rounded-md border border-destructive text-destructive px-4 py-2 text-sm font-medium shadow-sm hover:bg-destructive hover:text-destructive-foreground">
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