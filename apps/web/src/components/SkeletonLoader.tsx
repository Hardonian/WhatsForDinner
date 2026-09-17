'use client';

/**
 * Skeleton Loader Components
 * 
 * Loading states for async operations
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PantrySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SuggestionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-8 bg-muted rounded w-16" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function InputPromptSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="h-5 bg-muted rounded w-1/3 mb-4" />
        <div className="h-12 bg-muted rounded w-full mb-3" />
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-9 bg-muted rounded w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
