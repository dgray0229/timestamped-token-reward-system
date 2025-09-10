import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { store } from './store';
import './styles/globals.css';

// Solana wallet context providers
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Get network from environment
const network = (import.meta.env.VITE_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;

// Get RPC endpoint
const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);

// Initialize wallet adapters
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter({ network }),
];

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <App />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);