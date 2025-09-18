import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  authenticateWallet, 
  disconnectWallet,
  selectWallet,
  clearErrors
} from '../store/slices/walletSlice';
import { Button } from './ui/Button';
import { truncateAddress } from '../lib/utils';
import { useErrorHandling } from '../hooks/useErrorHandling';

export function WalletConnection() {
  const dispatch = useAppDispatch();
  const { 
    isConnected, 
    isAuthenticated, 
    user, 
    isConnecting, 
    error 
  } = useAppSelector(selectWallet);
  
  const { 
    wallet, 
    publicKey, 
    connected, 
    disconnect,
    signMessage 
  } = useWallet();

  const { handleWalletError, handleSuccess, handleInfo } = useErrorHandling();

  // Handle wallet connection state changes
  useEffect(() => {
    if (connected && publicKey && wallet && signMessage) {
      if (!isAuthenticated) {
        handleAuthentication();
      }
    } else if (!connected && isConnected) {
      dispatch(disconnectWallet());
    }
  }, [connected, publicKey, wallet, signMessage, isAuthenticated, isConnected]);

  // Handle authentication error display
  useEffect(() => {
    if (error) {
      handleWalletError(new Error(error));
      dispatch(clearErrors());
    }
  }, [error, dispatch, handleWalletError]);

  const handleAuthentication = async () => {
    if (!publicKey || !signMessage) {
      handleWalletError(new Error('Wallet not properly connected'));
      return;
    }

    try {
      await dispatch(authenticateWallet({
        walletAddress: publicKey.toString(),
        signMessage,
      })).unwrap();

      handleSuccess('Wallet connected successfully!');
    } catch (error) {
      handleWalletError(error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      dispatch(disconnectWallet());
      handleInfo('Wallet disconnected');
    } catch (error) {
      handleWalletError(error);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        {/* User Profile Section */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold">
                {user.username || 'Wallet User'}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected"></div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground font-mono">
                {truncateAddress(user.wallet_address)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(user.wallet_address)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors p-1"
                title="Copy address"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Disconnect Button */}
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="text-xs border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <WalletMultiButton 
        className="!bg-blue-600 !hover:bg-blue-700 !rounded-md !transition-colors"
      />
      
      {isConnecting && (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Authenticating...</span>
        </div>
      )}
    </div>
  );
}