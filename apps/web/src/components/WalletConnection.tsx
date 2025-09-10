import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  connectWallet, 
  disconnectWallet,
  selectWalletState,
  clearError
} from '../store/slices/walletSlice';
import { showNotification } from '../store/slices/uiSlice';
import { Button } from './ui/Button';
import { truncateAddress } from '../lib/utils';

export function WalletConnection() {
  const dispatch = useAppDispatch();
  const { 
    isConnected, 
    isAuthenticated, 
    user, 
    isConnecting, 
    error 
  } = useAppSelector(selectWalletState);
  
  const { 
    wallet, 
    publicKey, 
    connected, 
    disconnect,
    signMessage 
  } = useWallet();

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
      dispatch(showNotification({
        type: 'error',
        message: error,
        duration: 5000,
      }));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAuthentication = async () => {
    if (!publicKey || !signMessage) {
      dispatch(showNotification({
        type: 'error',
        message: 'Wallet not properly connected',
        duration: 3000,
      }));
      return;
    }

    try {
      await dispatch(connectWallet({
        walletAddress: publicKey.toString(),
        signMessage,
      })).unwrap();

      dispatch(showNotification({
        type: 'success',
        message: 'Wallet connected successfully!',
        duration: 3000,
      }));
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      dispatch(disconnectWallet());
      dispatch(showNotification({
        type: 'info',
        message: 'Wallet disconnected',
        duration: 3000,
      }));
    } catch (error) {
      console.error('Disconnect failed:', error);
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