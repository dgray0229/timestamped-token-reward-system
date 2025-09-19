import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { SuccessAnimation } from './ui/SuccessAnimation';
import { formatCurrency, formatTimeAgo, truncateAddress } from '../lib/utils';

export function RewardsDashboard() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(selectWallet);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState('');
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
      const amount = availableRewards.available_amount;
      await dispatch(claimRewards(amount)).unwrap();

      // Show success animation
      setClaimedAmount(amount);
      setShowSuccessAnimation(true);

      // Also show notification
      dispatch(addNotification({
        type: 'success',
        message: `Successfully claimed ${amount} tokens!`,
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
      <div className="space-y-8">
        {/* Main Welcome Card */}
        <Card className="max-w-2xl mx-auto relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white via-primary/5 to-accent/10">
          <CardHeader className="text-center relative">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <CardTitle className="text-2xl mb-4 text-foreground font-bold">Ready to Start Earning?</CardTitle>
            <CardDescription className="text-base text-muted-foreground font-medium">
              Connect your Solana wallet to begin earning timestamped token rewards.
              The longer you wait between claims, the more rewards you accumulate!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* How It Works Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">1. Connect</h3>
            <p className="text-sm text-muted-foreground">
              Use the wallet button above to connect your Solana wallet securely.
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">2. Wait</h3>
            <p className="text-sm text-muted-foreground">
              Your rewards accumulate over time. The longer you wait, the more you earn.
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">3. Claim</h3>
            <p className="text-sm text-muted-foreground">
              Claim your accumulated rewards directly to your wallet anytime.
            </p>
          </Card>
        </div>

        {/* Stats Preview */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">System Stats</CardTitle>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-2xl font-bold text-primary">1.2M+</p>
                <p className="text-xs text-muted-foreground">Tokens Distributed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">500+</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
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
    <>
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        amount={claimedAmount}
        onComplete={() => setShowSuccessAnimation(false)}
      />

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
            <div className="space-y-6">
              {/* Reward Display Section */}
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {parseFloat(availableRewards.available_amount) > 0 && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-xs font-bold text-yellow-900">!</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-gradient">
                      {formatCurrency(availableRewards.available_amount)}
                    </p>
                    <p className="text-base text-muted-foreground font-medium">
                      Tokens Ready to Claim
                    </p>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="max-w-sm mx-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accumulation Progress</span>
                    <span className="font-medium">{availableRewards.hours_since_last_claim}h elapsed</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((availableRewards.hours_since_last_claim / 24) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Rewards grow over time • Maximum after 24 hours
                  </p>
                </div>

                {/* Claim Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleClaimRewards}
                    disabled={isClaiming || parseFloat(availableRewards.available_amount) <= 0}
                    className={`px-8 py-4 text-lg font-semibold shadow-lg transition-all transform ${
                      parseFloat(availableRewards.available_amount) > 0
                        ? 'hover:scale-105 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                        : ''
                    }`}
                    size="lg"
                  >
                    {isClaiming ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Processing Claim...
                      </>
                    ) : parseFloat(availableRewards.available_amount) > 0 ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Claim {formatCurrency(availableRewards.available_amount)} Tokens
                      </>
                    ) : (
                      'No Rewards Available'
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{availableRewards.hours_since_last_claim}h</p>
                  <p className="text-sm text-muted-foreground">Time Elapsed</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-accent">{availableRewards.next_claim_available_in}h</p>
                  <p className="text-sm text-muted-foreground">Next Bonus In</p>
                </div>
              </div>

              {/* Informational Alert */}
              {availableRewards.next_claim_available_in > 0 && parseFloat(availableRewards.available_amount) <= 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription className="text-blue-800">
                    Your next reward batch will be ready in {availableRewards.next_claim_available_in} hours.
                    The longer you wait, the bigger the reward!
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
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction.id} className="group relative">
                  <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.status === 'confirmed'
                        ? 'bg-green-100 text-green-600'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.status === 'confirmed' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : transaction.status === 'pending' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg text-green-600">
                            +{formatCurrency(transaction.amount)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Claimed {formatTimeAgo(transaction.timestamp_earned)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`text-xs font-medium ${
                              transaction.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Transaction Signature */}
                      {transaction.transaction_signature && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                            {truncateAddress(transaction.transaction_signature, 6, 6)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(transaction.transaction_signature)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors p-1"
                            title="Copy transaction signature"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <a
                            href={`https://solscan.io/tx/${transaction.transaction_signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors p-1"
                            title="View on Solscan"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline connector */}
                  {index < transactions.slice(0, 5).length - 1 && (
                    <div className="absolute left-9 top-14 w-0.5 h-6 bg-muted"></div>
                  )}
                </div>
              ))}

              {/* View All Link */}
              <div className="pt-4 text-center">
                <Link
                  to="/transactions"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View All Transactions →
                </Link>
              </div>
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
    </>
  );
}