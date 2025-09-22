import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Components
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';

// Pages
import { HomePage } from './pages/Home';
import { DashboardPage } from './pages/Dashboard';
import { TransactionsPage } from './pages/Transactions';
import { ProfilePage } from './pages/Profile';

/**
 * Main App Component
 * 
 * This is the root component that sets up routing and global providers.
 * It demonstrates the structure of a modern React application with:
 * - Error boundaries for graceful error handling
 * - Nested routing with React Router
 * - Layout components for consistent UI structure
 */
function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;