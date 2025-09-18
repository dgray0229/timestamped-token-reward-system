import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Home Page Component
 * 
 * This is the landing page of the application that provides:
 * - Introduction to the project and its purpose
 * - Overview of features and functionality
 * - Call-to-action to connect wallet and get started
 * - Educational information about Solana and blockchain
 */
export function HomePage() {
  const { connected } = useWallet();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-gradient">Timestamped</span><br />
            Token Rewards
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn Solana blockchain development through a practical tutorial 
            application that demonstrates timestamped token rewards with modern 
            React and Node.js integration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {connected ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Open Dashboard
              </Link>
              <Link
                to="/transactions"
                className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-background px-6 py-3 text-base font-medium text-primary shadow-sm hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              >
                View History
              </Link>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-lg animate-pulse">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Connect Your Solana Wallet to Start
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Use the wallet button in the top navigation to connect your Solana wallet and begin earning timestamped rewards.
              </p>
              <div className="flex justify-center">
                <svg className="w-6 h-6 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg">Timestamped Rewards</h3>
          <p className="text-muted-foreground">
            Earn tokens based on time intervals. The longer you wait between claims, 
            the more rewards you can accumulate.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg">Secure & Transparent</h3>
          <p className="text-muted-foreground">
            Built on Solana blockchain with smart contracts that ensure secure, 
            transparent, and verifiable token distribution.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg">Fast & Low Cost</h3>
          <p className="text-muted-foreground">
            Leverage Solana's high performance and low transaction fees for 
            near-instant reward claims at minimal cost.
          </p>
        </div>
      </section>

      {/* Educational Section */}
      <section className="card p-8 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Educational Purpose</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            This application is designed as a comprehensive tutorial for learning 
            modern full-stack development with blockchain integration. It demonstrates 
            real-world patterns and best practices.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'React 18', description: 'Modern frontend with hooks and context' },
            { title: 'TypeScript', description: 'Type-safe development throughout' },
            { title: 'Redux Toolkit', description: 'Professional state management' },
            { title: 'Solana Programs', description: 'Smart contracts with Anchor framework' },
          ].map((item, index) => (
            <div key={index} className="text-center p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm">{item.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Network Status */}
      <section className="text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            Connected to {import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}
          </span>
        </div>
      </section>
    </div>
  );
}