import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { store } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

// Initialize global error handling
import {
  setupGlobalErrorHandler,
  setupNetworkMonitoring,
  setupPerformanceMonitoring,
} from './utils/globalErrorHandler';

setupGlobalErrorHandler();
setupPerformanceMonitoring();
setupNetworkMonitoring();

// Enhanced Solana provider with error handling
import SolanaProviderWrapper from './components/SolanaProviderWrapper';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Provider store={store}>
          <ErrorBoundary
            fallback={
              <div className='text-center p-4'>
                Redux store error - please reload
              </div>
            }
          >
            <SolanaProviderWrapper>
              <App />
            </SolanaProviderWrapper>
          </ErrorBoundary>
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
