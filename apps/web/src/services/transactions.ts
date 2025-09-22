/**
 * Transactions Service - Transaction history and status management
 * 
 * This service handles transaction-related operations:
 * - Transaction history with pagination and filtering
 * - Individual transaction details
 * - Transaction status checking
 * - Export functionality
 */

import { api } from './api';
import type {
  RewardTransaction,
  PaginatedTransactions,
  TransactionHistoryParams,
  TransactionStatus,
} from '@reward-system/shared';
import { TRANSACTION_ENDPOINTS } from '@reward-system/shared';

/**
 * Get paginated transaction history
 */
export async function getTransactionHistory(
  params: TransactionHistoryParams = {}
): Promise<PaginatedTransactions> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);

  const url = `${TRANSACTION_ENDPOINTS.LIST}?${queryParams.toString()}`;
  const response = await api.get<PaginatedTransactions>(url);
  
  // Convert date strings to Date objects
  response.transactions = response.transactions.map(tx => ({
    ...tx,
    timestamp_earned: new Date(tx.timestamp_earned),
    timestamp_claimed: tx.timestamp_claimed ? new Date(tx.timestamp_claimed) : undefined,
  }));
  
  return response;
}

/**
 * Get details for a specific transaction
 */
export async function getTransactionDetails(
  transactionId: string
): Promise<RewardTransaction> {
  const url = TRANSACTION_ENDPOINTS.DETAILS.replace(':id', transactionId);
  const response = await api.get<RewardTransaction>(url);
  
  // Convert date strings to Date objects
  return {
    ...response,
    timestamp_earned: new Date(response.timestamp_earned),
    timestamp_claimed: response.timestamp_claimed ? new Date(response.timestamp_claimed) : undefined,
  };
}

/**
 * Check the status of a specific transaction
 */
export async function checkTransactionStatus(
  transactionId: string
): Promise<{
  transactionId: string;
  status: TransactionStatus;
  blockNumber?: string;
  confirmations?: number;
  lastChecked: Date;
}> {
  const url = TRANSACTION_ENDPOINTS.STATUS.replace(':id', transactionId);
  const response = await api.get(url);
  
  return {
    ...response,
    lastChecked: new Date(response.lastChecked),
  };
}

/**
 * Export transactions to CSV or JSON format
 */
export async function exportTransactions(
  format: 'csv' | 'json',
  filters?: TransactionHistoryParams
): Promise<Blob> {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);
  
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());
  if (filters?.status) queryParams.append('status', filters.status);

  const url = `${TRANSACTION_ENDPOINTS.EXPORT}?${queryParams.toString()}`;
  
  const response = await api.get(url, {
    responseType: 'blob',
  });
  
  return response;
}

/**
 * Search transactions by signature or other criteria
 */
export async function searchTransactions(query: string): Promise<{
  transactions: RewardTransaction[];
  totalResults: number;
}> {
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);

  const url = `${TRANSACTION_ENDPOINTS.LIST}/search?${queryParams.toString()}`;
  const response = await api.get(url);
  
  // Convert date strings to Date objects
  response.transactions = response.transactions.map((tx: any) => ({
    ...tx,
    timestamp_earned: new Date(tx.timestamp_earned),
    timestamp_claimed: new Date(tx.timestamp_claimed),
  }));
  
  return response;
}

/**
 * Get transaction statistics for current user
 */
export async function getTransactionStats(): Promise<{
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  successRate: number;
  totalVolume: string;
  averageTransactionSize: string;
  firstTransactionDate: Date | null;
  lastTransactionDate: Date | null;
  monthlyBreakdown: Array<{
    month: string;
    count: number;
    volume: string;
  }>;
}> {
  const response = await api.get('/transactions/stats');
  
  return {
    ...response,
    firstTransactionDate: response.firstTransactionDate 
      ? new Date(response.firstTransactionDate) 
      : null,
    lastTransactionDate: response.lastTransactionDate 
      ? new Date(response.lastTransactionDate) 
      : null,
  };
}

/**
 * Retry a failed transaction
 */
export async function retryTransaction(transactionId: string): Promise<{
  newTransactionId: string;
  status: string;
  message: string;
}> {
  const response = await api.post(`/transactions/${transactionId}/retry`);
  return response;
}

/**
 * Cancel a pending transaction
 */
export async function cancelTransaction(transactionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await api.post(`/transactions/${transactionId}/cancel`);
  return response;
}

/**
 * Get transaction fees and estimates
 */
export async function getTransactionFees(): Promise<{
  networkFee: string;
  serviceFee: string;
  totalFee: string;
  estimatedConfirmationTime: number;
}> {
  const response = await api.get('/transactions/fees');
  return response;
}

/**
 * Subscribe to real-time transaction updates
 */
export async function subscribeToTransactionUpdates(
  transactionIds: string[],
  callback: (update: {
    transactionId: string;
    status: TransactionStatus;
    blockNumber?: string;
    timestamp: Date;
  }) => void
): Promise<() => void> {
  // This would typically use WebSocket or Server-Sent Events
  // For now, we'll implement polling for the specified transactions
  
  let isSubscribed = true;
  let pollInterval: number;
  
  const poll = async () => {
    if (!isSubscribed || transactionIds.length === 0) return;
    
    try {
      // Check status for each transaction
      const statusChecks = await Promise.allSettled(
        transactionIds.map(id => checkTransactionStatus(id))
      );
      
      statusChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          callback({
            transactionId: result.value.transactionId,
            status: result.value.status,
            blockNumber: result.value.blockNumber || undefined,
            timestamp: result.value.lastChecked,
          });
        }
      });
      
      // Filter out completed transactions from future polls
      const pendingTransactions = statusChecks
        .map((result, index) => ({
          id: transactionIds[index],
          status: result.status === 'fulfilled' ? result.value.status : 'pending',
        }))
        .filter(tx => tx.status === 'pending' && tx.id)
        .map(tx => tx.id)
        .filter(id => id !== undefined) as string[];
      
      // Update the list for next poll
      transactionIds.length = 0;
      transactionIds.push(...pendingTransactions);
      
      // Schedule next poll if there are still pending transactions
      if (transactionIds.length > 0) {
        pollInterval = window.setTimeout(poll, 30000); // Poll every 30 seconds
      }
    } catch (error) {
      console.error('Failed to poll transaction updates:', error);
      // Retry with longer delay on error
      pollInterval = window.setTimeout(poll, 60000);
    }
  };
  
  // Start polling
  poll();
  
  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    if (pollInterval) {
      clearTimeout(pollInterval);
    }
  };
}

/**
 * Get transaction receipt for blockchain verification
 */
export async function getTransactionReceipt(signature: string): Promise<{
  signature: string;
  blockTime: number;
  slot: number;
  confirmations: number;
  fee: number;
  success: boolean;
  logs: string[];
}> {
  const response = await api.get(`/transactions/receipt/${signature}`);
  return response;
}

/**
 * Verify transaction on blockchain
 */
export async function verifyTransactionOnChain(
  signature: string
): Promise<{
  verified: boolean;
  onChainStatus: 'confirmed' | 'finalized' | 'not_found';
  blockNumber?: string;
  timestamp?: Date;
  amount?: string;
}> {
  const response = await api.get(`/transactions/verify/${signature}`);
  
  return {
    ...response,
    timestamp: response.timestamp ? new Date(response.timestamp) : undefined,
  };
}

/**
 * Report a transaction issue
 */
export async function reportTransactionIssue(
  transactionId: string,
  issue: {
    type: 'stuck' | 'failed' | 'incorrect_amount' | 'missing' | 'other';
    description: string;
    expectedOutcome?: string;
  }
): Promise<{
  ticketId: string;
  message: string;
  estimatedResolutionTime: string;
}> {
  const response = await api.post(`/transactions/${transactionId}/report`, issue);
  return response;
}