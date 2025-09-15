import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchAvailableRewards,
  claimRewards,
  selectRewards,
} from '../store/slices/rewardsSlice';
import { 
  fetchTransactions,
  selectTransactions,
} from '../store/slices/transactionsSlice';
import { selectWallet } from '../store/slices/walletSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Alert, AlertDescription } from './ui/Alert';
import { formatCurrency, formatTimeAgo, truncateAddress } from '../lib/utils';

export function RewardsDashboard() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(selectWallet);
  const { 
    availableRewards, 
    isLoading: rewardsLoading, 
    isClaiming,
    error: rewardsError 
  } = useAppSelector(selectRewards);
  const { 
    transactions, 
    isLoading: transactionsLoading 
  } = useAppSelector(selectTransactions);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchAvailableRewards());
      dispatch(fetchTransactions({ page: 1, limit: 10 }));
    }
  }, [isAuthenticated, dispatch]);

  // Auto-refresh rewards every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      dispatch(fetchAvailableRewards());
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  const handleClaimRewards = async () => {
    if (!availableRewards || parseFloat(availableRewards.available_amount) <= 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'No rewards available to claim',
        duration: 3000,
      }));
      return;
    }

    try {
      await dispatch(claimRewards(availableRewards.available_amount)).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: `Successfully claimed ${availableRewards.available_amount} tokens!`,
        duration: 5000,
      }));

      // Refresh data after successful claim
      dispatch(fetchAvailableRewards());
      dispatch(fetchTransactions({ page: 1, limit: 10 }));
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <CardTitle>Welcome to Reward System</CardTitle>
          <CardDescription>
            Connect your Solana wallet to start earning rewards based on your participation time.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (rewardsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-muted-foreground">Loading rewards...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Rewards Card */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
          <CardDescription>Claim your accumulated rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {rewardsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{rewardsError}</AlertDescription>
            </Alert>
          )}

          {availableRewards ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(availableRewards.available_amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tokens available to claim
                  </p>
                </div>
                
                <Button
                  onClick={handleClaimRewards}
                  disabled={isClaiming || parseFloat(availableRewards.available_amount) <= 0}
                  variant={parseFloat(availableRewards.available_amount) > 0 ? 'default' : 'secondary'}
                  size="lg"
                >
                  {isClaiming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Claiming...
                    </>
                  ) : (
                    'Claim Rewards'
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Hours since last claim:</span>
                  <span className="ml-2 font-medium">{availableRewards.hours_since_last_claim}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Next claim available:</span>
                  <span className="ml-2 font-medium">{availableRewards.next_claim_available_in}h</span>
                </div>
              </div>

              {availableRewards.next_claim_available_in > 0 && (
                <Alert variant="warning">
                  <AlertDescription>
                    You can claim your next rewards in {availableRewards.next_claim_available_in} hours.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No reward data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest reward claims and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-muted-foreground">Loading transactions...</span>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeAgo(transaction.timestamp_earned)}
                    </p>
                    {transaction.transaction_signature && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(transaction.transaction_signature, 8, 8)}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant={
                      transaction.status === 'confirmed' 
                        ? 'success'
                        : transaction.status === 'pending'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {transaction.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start by claiming your first rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}