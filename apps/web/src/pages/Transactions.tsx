import React from 'react';

/**
 * Transactions Page Component
 * 
 * This page displays:
 * - Complete transaction history with filtering and search
 * - Transaction details with blockchain verification
 * - Export functionality for transaction data
 * - Pagination for large transaction lists
 */
export function TransactionsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          View your complete transaction history and reward claims.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <select className="px-3 py-2 border border-input rounded-md bg-background text-sm">
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <input
              type="text"
              placeholder="Search by signature..."
              className="px-3 py-2 border border-input rounded-md bg-background text-sm w-full sm:w-64"
            />
          </div>

          <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 font-medium text-muted-foreground">Date</th>
                <th className="p-4 font-medium text-muted-foreground">Type</th>
                <th className="p-4 font-medium text-muted-foreground">Amount</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Signature</th>
                <th className="p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state */}
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="space-y-4">
                    <svg className="w-12 h-12 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <div>
                      <h3 className="font-medium">No transactions yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Your reward claims and transactions will appear here once you start using the system.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Example (Hidden by default, will be shown when there are transactions) */}
      <div className="hidden card p-6 space-y-4">
        <h3 className="font-semibold">Transaction Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
            <p className="font-mono text-sm mt-1">tx_example_12345</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
            <p className="text-sm mt-1">2024-01-15 14:30:00 UTC</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <p className="text-sm mt-1">1.0000 TOK</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
              Confirmed
            </span>
          </div>
          
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Signature</label>
            <p className="font-mono text-xs break-all mt-1 p-2 bg-muted rounded">
              5j6X9zKGjQx7XvQzn2... (example signature)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
            View on Solscan
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            Copy Signature
          </button>
        </div>
      </div>
    </div>
  );
}