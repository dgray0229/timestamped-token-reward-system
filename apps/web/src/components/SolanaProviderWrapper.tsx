/**
 * Solana Provider Wrapper
 *
 * Provides enhanced error handling and fallback behavior for Solana wallet connections
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  SolflareWalletAdapter,
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
}

export default function SolanaProviderWrapper({ children }: Props) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Get network and endpoint with fallbacks
  const network = (import.meta.env.VITE_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;
  const [endpoint, setEndpoint] = useState(
    import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network)
  );

  // Initialize wallet adapters with error handling
  const [wallets, setWallets] = useState(() => {
    try {
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network }),
      ];
    } catch (error) {
      console.warn('Failed to initialize wallet adapters:', error);
      return [];
    }
  });

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const connection = new Connection(endpoint, 'confirmed');
        const version = await Promise.race([
          connection.getVersion(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);

        console.log('✅ Solana connection established:', version);
        setConnectionError(null);
      } catch (error) {
        console.warn('❌ Solana connection failed:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');

        // Try fallback endpoint
        if (endpoint !== clusterApiUrl(network)) {
          console.log('Trying fallback endpoint...');
          setEndpoint(clusterApiUrl(network));
        }
      }
    };

    testConnection();
  }, [endpoint, network]);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    setConnectionError(null);

    try {
      // Reset to default endpoint
      const defaultEndpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);
      setEndpoint(defaultEndpoint);

      // Test connection
      const connection = new Connection(defaultEndpoint, 'confirmed');
      await connection.getVersion();

      console.log('✅ Connection retry successful');
    } catch (error) {
      console.warn('❌ Connection retry failed:', error);
      setConnectionError('Unable to connect to Solana network');
    } finally {
      setIsRetrying(false);
    }
  };

  // Show connection error UI
  if (connectionError && !isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-semibold text-gray-900 text-center">
            Solana Network Unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-600 text-center">
            Unable to connect to the Solana network. This may be temporary.
          </p>

          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Network:</strong> {network}<br />
            <strong>Endpoint:</strong> {endpoint}<br />
            <strong>Error:</strong> {connectionError}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleRetryConnection}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => setConnectionError(null)}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Continue Anyway
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="https://status.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Check Solana Network Status
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading during retry
  if (isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Reconnecting to Solana...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">Solana Connection Error</h2>
          <p className="text-gray-600 mb-4">
            There was an error with the Solana wallet connection.
          </p>
          <button
            onClick={handleRetryConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      }
    >
      <ConnectionProvider endpoint={endpoint}>
        <ErrorBoundary fallback={<div className="text-center p-4">Wallet provider error - please try again</div>}>
          <WalletProvider wallets={wallets} autoConnect={false}>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ErrorBoundary>
      </ConnectionProvider>
    </ErrorBoundary>
  );
}