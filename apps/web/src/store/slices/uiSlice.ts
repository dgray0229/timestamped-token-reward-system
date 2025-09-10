/**
 * UI Redux Slice
 * 
 * This slice manages UI state and user interface interactions.
 * It handles:
 * - Theme and appearance settings
 * - Modal and dialog states
 * - Notification system
 * - Loading states for UI components
 * - Navigation and layout preferences
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types for UI state
type Theme = 'light' | 'dark' | 'system';
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

interface UiState {
  // Theme and appearance
  theme: Theme;
  sidebarCollapsed: boolean;
  
  // Modals and dialogs
  modals: Record<string, Modal>;
  
  // Notifications
  notifications: Notification[];
  
  // Loading states for various UI operations
  loadingStates: Record<string, boolean>;
  
  // Navigation
  activeTab: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
  
  // Preferences
  compactMode: boolean;
  animationsEnabled: boolean;
  
  // Connection status indicators
  connectionStatus: {
    api: 'connected' | 'disconnected' | 'connecting';
    solana: 'connected' | 'disconnected' | 'connecting';
    wallet: 'connected' | 'disconnected' | 'connecting';
  };
}

const initialState: UiState = {
  theme: 'system',
  sidebarCollapsed: false,
  modals: {},
  notifications: [],
  loadingStates: {},
  activeTab: 'dashboard',
  breadcrumbs: [{ label: 'Home', path: '/' }],
  compactMode: false,
  animationsEnabled: true,
  connectionStatus: {
    api: 'disconnected',
    solana: 'disconnected',
    wallet: 'disconnected',
  },
};

// Helper function to generate notification ID
const generateNotificationId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// UI slice definition
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    
    toggleTheme: (state) => {
      if (state.theme === 'light') {
        state.theme = 'dark';
      } else if (state.theme === 'dark') {
        state.theme = 'system';
      } else {
        state.theme = 'light';
      }
    },
    
    // Sidebar management
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Modal management
    openModal: (state, action: PayloadAction<{ id: string; data?: any }>) => {
      const { id, data } = action.payload;
      state.modals[id] = { id, isOpen: true, data };
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalId => {
        state.modals[modalId].isOpen = false;
      });
    },
    
    // Notification management
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        id: generateNotificationId(),
        duration: 5000, // Default 5 seconds
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Quick notification helpers
    showSuccess: (state, action: PayloadAction<{ title: string; message?: string }>) => {
      const notification: Notification = {
        id: generateNotificationId(),
        type: 'success',
        title: action.payload.title,
        message: action.payload.message,
        duration: 4000,
      };
      state.notifications.push(notification);
    },
    
    showError: (state, action: PayloadAction<{ title: string; message?: string; persistent?: boolean }>) => {
      const notification: Notification = {
        id: generateNotificationId(),
        type: 'error',
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.persistent ? 0 : 6000,
        persistent: action.payload.persistent,
      };
      state.notifications.push(notification);
    },
    
    showWarning: (state, action: PayloadAction<{ title: string; message?: string }>) => {
      const notification: Notification = {
        id: generateNotificationId(),
        type: 'warning',
        title: action.payload.title,
        message: action.payload.message,
        duration: 5000,
      };
      state.notifications.push(notification);
    },
    
    showInfo: (state, action: PayloadAction<{ title: string; message?: string }>) => {
      const notification: Notification = {
        id: generateNotificationId(),
        type: 'info',
        title: action.payload.title,
        message: action.payload.message,
        duration: 4000,
      };
      state.notifications.push(notification);
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loadingStates[key] = true;
      } else {
        delete state.loadingStates[key];
      }
    },
    
    clearAllLoading: (state) => {
      state.loadingStates = {};
    },
    
    // Navigation
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    
    // Preferences
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
    },
    
    setAnimationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.animationsEnabled = action.payload;
    },
    
    // Connection status
    setConnectionStatus: (state, action: PayloadAction<{
      service: keyof UiState['connectionStatus'];
      status: 'connected' | 'disconnected' | 'connecting';
    }>) => {
      const { service, status } = action.payload;
      state.connectionStatus[service] = status;
    },
    
    // Bulk connection status update
    updateConnectionStatus: (state, action: PayloadAction<Partial<UiState['connectionStatus']>>) => {
      state.connectionStatus = { ...state.connectionStatus, ...action.payload };
    },
  },
});

// Export actions
export const {
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearAllNotifications,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  setLoading,
  clearAllLoading,
  setActiveTab,
  setBreadcrumbs,
  addBreadcrumb,
  setCompactMode,
  setAnimationsEnabled,
  setConnectionStatus,
  updateConnectionStatus,
} = uiSlice.actions;

// Export reducer
export default uiSlice.reducer;

// Selectors for easy state access
export const selectUi = (state: { ui: UiState }) => state.ui;
export const selectTheme = (state: { ui: UiState }) => state.ui.theme;
export const selectSidebarCollapsed = (state: { ui: UiState }) => state.ui.sidebarCollapsed;
export const selectModals = (state: { ui: UiState }) => state.ui.modals;
export const selectModal = (modalId: string) => (state: { ui: UiState }) => state.ui.modals[modalId];
export const selectNotifications = (state: { ui: UiState }) => state.ui.notifications;
export const selectLoadingStates = (state: { ui: UiState }) => state.ui.loadingStates;
export const selectIsLoading = (key: string) => (state: { ui: UiState }) => !!state.ui.loadingStates[key];
export const selectActiveTab = (state: { ui: UiState }) => state.ui.activeTab;
export const selectBreadcrumbs = (state: { ui: UiState }) => state.ui.breadcrumbs;
export const selectConnectionStatus = (state: { ui: UiState }) => state.ui.connectionStatus;
export const selectCompactMode = (state: { ui: UiState }) => state.ui.compactMode;
export const selectAnimationsEnabled = (state: { ui: UiState }) => state.ui.animationsEnabled;