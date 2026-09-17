'use client';

import React from 'react';
import { LoadingSpinner } from './ui/loading-spinner';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center min-h-[200px]">{content}</div>;
}

// Skeleton loader component
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-muted rounded-md h-4 w-3/4 mb-2"></div>
      <div className="bg-muted rounded-md h-4 w-1/2 mb-2"></div>
      <div className="bg-muted rounded-md h-4 w-5/6"></div>
    </div>
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="bg-muted rounded-md h-32 w-full mb-4"></div>
      <div className="bg-muted rounded-md h-6 w-3/4 mb-2"></div>
      <div className="bg-muted rounded-md h-4 w-full mb-2"></div>
      <div className="bg-muted rounded-md h-4 w-5/6"></div>
    </div>
  );
}

export default LoadingState;
