/**
 * Transactions Redux Slice
 * 
 * This slice manages transaction history and status tracking.
 * It handles:
 * - Transaction history with pagination
 * - Real-time transaction status updates
 * - Transaction filtering and search
 * - Export functionality
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  RewardTransaction, 
  PaginatedTransactions, 
  TransactionStatus,
  TransactionHistoryParams 
} from '@reward-system/shared';
import * as transactionsService from '../../services/transactions';

// Types for transactions state
export interface TransactionsState {
  // Transaction list
  transactions: RewardTransaction[];
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  
  // Filters and search
  statusFilter: TransactionStatus | '';
  searchQuery: string;
  
  // Individual transaction details
  selectedTransaction: RewardTransaction | null;
  isLoadingDetails: boolean;
  detailsError: string | null;
  
  // Export functionality
  isExporting: boolean;
  exportError: string | null;
  
  // Real-time updates
  pendingTransactions: string[];
  lastUpdateTime: number | null;
}

const initialState: TransactionsState = {
  transactions: [],
  totalTransactions: 0,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  error: null,
  statusFilter: '',
  searchQuery: '',
  selectedTransaction: null,
  isLoadingDetails: false,
  detailsError: null,
  isExporting: false,
  exportError: null,
  pendingTransactions: [],
  lastUpdateTime: null,
};

// Async thunks for transaction operations
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchList',
  async (params: TransactionHistoryParams = {}, { rejectWithValue }) => {
    try {
      const response = await transactionsService.getTransactionHistory(params);
      return { ...response, params };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch transactions'
      );
    }
  }
);

export const fetchTransactionDetails = createAsyncThunk(
  'transactions/fetchDetails',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const transaction = await transactionsService.getTransactionDetails(transactionId);
      return transaction;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch transaction details'
      );
    }
  }
);

export const checkTransactionStatus = createAsyncThunk(
  'transactions/checkStatus',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const status = await transactionsService.checkTransactionStatus(transactionId);
      return { transactionId, status };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to check transaction status'
      );
    }
  }
);

export const exportTransactions = createAsyncThunk(
  'transactions/export',
  async (params: { format: 'csv' | 'json'; filters?: TransactionHistoryParams }, { rejectWithValue }) => {
    try {
      const blob = await transactionsService.exportTransactions(params.format, params.filters);
      return { blob, format: params.format };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to export transactions'
      );
    }
  }
);

// Transactions slice definition
const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Filters and search
    setStatusFilter: (state, action: PayloadAction<TransactionStatus | ''>) => {
      state.statusFilter = action.payload;
      state.currentPage = 1; // Reset to first page when filtering
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // Reset to first page when searching
    },
    
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    
    // Clear states
    clearError: (state) => {
      state.error = null;
      state.detailsError = null;
      state.exportError = null;
    },
    
    clearSelectedTransaction: (state) => {
      state.selectedTransaction = null;
      state.detailsError = null;
    },
    
    // Real-time updates
    addPendingTransaction: (state, action: PayloadAction<string>) => {
      if (!state.pendingTransactions.includes(action.payload)) {
        state.pendingTransactions.push(action.payload);
      }
    },

    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter(id => id !== action.payload);
    },
    
    updateTransactionStatus: (state, action: PayloadAction<{
      transactionId: string;
      status: TransactionStatus;
      signature?: string;
    }>) => {
      const { transactionId, status, signature } = action.payload;
      
      // Update transaction in list
      const transactionIndex = state.transactions.findIndex(tx => tx.id === transactionId);
      if (transactionIndex !== -1 && state.transactions[transactionIndex]) {
        state.transactions[transactionIndex].status = status;
        if (signature) {
          state.transactions[transactionIndex].transaction_signature = signature;
        }
      }
      
      // Update selected transaction if it matches
      if (state.selectedTransaction?.id === transactionId) {
        state.selectedTransaction.status = status;
        if (signature) {
          state.selectedTransaction.transaction_signature = signature;
        }
      }
      
      // Remove from pending if status is final
      if (status === 'confirmed' || status === 'failed') {
        state.pendingTransactions = state.pendingTransactions.filter(id => id !== transactionId);
      }
      
      state.lastUpdateTime = Date.now();
    },
    
    // Add new transaction to the list (for real-time updates)
    addNewTransaction: (state, action: PayloadAction<RewardTransaction>) => {
      state.transactions.unshift(action.payload);
      state.totalTransactions += 1;
      
      // Add to pending if not confirmed
      if (action.payload.status === 'pending' && !state.pendingTransactions.includes(action.payload.id)) {
        state.pendingTransactions.push(action.payload.id);
      }
    },
  },
  
  extraReducers: (builder) => {
    // Handle fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<PaginatedTransactions & { params: TransactionHistoryParams }>) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.totalTransactions = action.payload.pagination.total;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.pages;
        state.error = null;
        state.lastUpdateTime = Date.now();
        
        // Update pending transactions based on current data
        state.pendingTransactions = action.payload.transactions
          .filter(tx => tx.status === 'pending')
          .map(tx => tx.id);
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Handle fetch transaction details
    builder
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action: PayloadAction<RewardTransaction>) => {
        state.isLoadingDetails = false;
        state.selectedTransaction = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = action.payload as string;
      });
    
    // Handle check transaction status
    builder
      .addCase(checkTransactionStatus.pending, (state) => {
        // Keep current state during status check
      })
      .addCase(checkTransactionStatus.fulfilled, (state, action) => {
        const { transactionId, status } = action.payload;
        
        // Update transaction status using the updateTransactionStatus reducer logic
        transactionsSlice.caseReducers.updateTransactionStatus(state, {
          type: 'transactions/updateTransactionStatus',
          payload: { transactionId, status },
        });
      })
      .addCase(checkTransactionStatus.rejected, (state, action) => {
        // Silently fail status checks to avoid UI disruption
        console.warn('Failed to check transaction status:', action.payload);
      });
    
    // Handle export transactions
    builder
      .addCase(exportTransactions.pending, (state) => {
        state.isExporting = true;
        state.exportError = null;
      })
      .addCase(exportTransactions.fulfilled, (state, action: PayloadAction<{
        blob: Blob;
        format: string;
      }>) => {
        state.isExporting = false;
        state.exportError = null;
        
        // Trigger download
        const url = URL.createObjectURL(action.payload.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions.${action.payload.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .addCase(exportTransactions.rejected, (state, action) => {
        state.isExporting = false;
        state.exportError = action.payload as string;
      });
  },
});

// Export actions
export const {
  setStatusFilter,
  setSearchQuery,
  setCurrentPage,
  clearError,
  clearSelectedTransaction,
  addPendingTransaction,
  removePendingTransaction,
  updateTransactionStatus,
  addNewTransaction,
} = transactionsSlice.actions;

// Export reducer
export default transactionsSlice.reducer;

// Selectors for easy state access
export const selectTransactions = (state: { transactions: TransactionsState }) => state.transactions;
export const selectTransactionsList = (state: { transactions: TransactionsState }) => state.transactions.transactions;
export const selectIsLoadingTransactions = (state: { transactions: TransactionsState }) => state.transactions.isLoading;
export const selectSelectedTransaction = (state: { transactions: TransactionsState }) => state.transactions.selectedTransaction;
export const selectTransactionFilters = (state: { transactions: TransactionsState }) => ({
  statusFilter: state.transactions.statusFilter,
  searchQuery: state.transactions.searchQuery,
});
export const selectPagination = (state: { transactions: TransactionsState }) => ({
  currentPage: state.transactions.currentPage,
  totalPages: state.transactions.totalPages,
  totalTransactions: state.transactions.totalTransactions,
});
export const selectPendingTransactions = (state: { transactions: TransactionsState }) => state.transactions.pendingTransactions;