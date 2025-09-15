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
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {user.username || 'Anonymous User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {truncateAddress(user.wallet_address)}
          </span>
        </div>
        
        <Button
          onClick={handleDisconnect}
          variant="destructive"
          size="sm"
        >
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