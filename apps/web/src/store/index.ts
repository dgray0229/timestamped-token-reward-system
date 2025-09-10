/**
 * Redux Store Configuration
 * 
 * This file sets up the Redux store using Redux Toolkit (RTK) with:
 * - Combined reducers for different app domains
 * - Middleware configuration for async operations
 * - DevTools integration for development
 * - Type-safe hooks for TypeScript integration
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import walletReducer from './slices/walletSlice';
import rewardsReducer from './slices/rewardsSlice';
import transactionsReducer from './slices/transactionsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    rewards: rewardsReducer,
    transactions: transactionsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Customize middleware options
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
      // Enable additional middleware in development
      immutableCheck: {
        warnAfter: 128, // Warning threshold for immutability checks
      },
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development
});

// Export store types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for better TypeScript integration
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export store instance
export default store;