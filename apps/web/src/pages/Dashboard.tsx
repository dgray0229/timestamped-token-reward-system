import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

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
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="card p-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Wallet Required</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your Solana wallet to access the dashboard and start earning rewards.
          </p>
          <div className="text-sm text-muted-foreground">
            Supported wallets: Phantom, Solflare, and more
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your reward status and recent activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold">0 TOK</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">0 TOK</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Claims</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Claim</p>
              <p className="text-2xl font-bold">24h</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reward Claiming */}
        <div className="card p-6 space-y-6">
          <h2 className="text-xl font-semibold">Claim Rewards</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Available Rewards</span>
                <span className="text-lg font-bold">0 TOK</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Rewards accumulate over time. Come back later for more!
              </div>
            </div>

            <button
              disabled
              className="w-full inline-flex items-center justify-center rounded-md bg-muted px-4 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed"
            >
              No Rewards Available
            </button>

            <div className="text-center text-sm text-muted-foreground">
              Next reward available in 24 hours
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-6 space-y-6">
          <h2 className="text-xl font-semibold">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Wallet Address
              </label>
              <div className="mt-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {publicKey?.toString() || 'Not connected'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Network
              </label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                Just now (Demo)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6 space-y-6">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No transactions yet</p>
          <p className="text-sm">Your reward claims and transactions will appear here</p>
        </div>
      </div>
    </div>
  );
}