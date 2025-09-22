import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  amount?: string;
}

export function SuccessAnimation({ isVisible, onComplete, amount }: SuccessAnimationProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return;
  }, [isVisible, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      isVisible ? "animate-fade-in" : "animate-fade-out"
    )}>
      <div className="bg-card rounded-2xl p-8 shadow-2xl border max-w-sm mx-4 text-center">
        {/* Success Icon with Animation */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping`}
              style={{
                top: '50%',
                left: '50%',
                animationDelay: `${i * 0.2}s`,
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-40px)`
              }}
            />
          ))}
        </div>

        {/* Success Message */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-green-600">
            Rewards Claimed!
          </h3>

          {amount && (
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gradient">
                +{amount}
              </p>
              <p className="text-sm text-muted-foreground">
                Tokens added to your wallet
              </p>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 pt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Transaction confirmed on Solana
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-green-500 h-1 rounded-full transition-all duration-3000 ease-out"
              style={{ width: isVisible ? '100%' : '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}