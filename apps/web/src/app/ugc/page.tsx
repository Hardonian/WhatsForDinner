'use client';


import { useState, useEffect } from 'react';
import { UGCGrowth, ShareAnalytics, UGCShare } from '@/lib/ugcGrowth';

export default function UGCAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null);
  const [trendingContent, setTrendingContent] = useState<UGCShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState('user-123'); // In real app, get from auth

  useEffect(() => {
    loadAnalytics();
    loadTrendingContent();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await UGCGrowth.getUserUGCAnalytics(userId);
      setAnalytics(data);
    } catch (error) {
      // Error handled: Error loading UGC analytics:
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingContent = async () => {
    try {
      const content = await UGCGrowth.getTrendingUGC(10);
      setTrendingContent(content);
    } catch (error) {
      // Error handled: Error loading trending content:
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            UGC Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Track your content performance and viral growth
          </p>
        </div>

        {analytics && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Shares */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Shares
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.total_shares}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Views */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Views
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.total_views.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Engagement */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100">
                    <svg
                      className="h-5 w-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Engagement
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.total_engagement.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Viral Coefficient */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100">
                    <svg
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Viral Coefficient
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.viral_coefficient.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Platform Breakdown */}
          {analytics && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Platform Breakdown</h2>
              <div className="space-y-4">
                {Object.entries(analytics.platform_breakdown).map(
                  ([platform, count]) => (
                    <div
                      key={platform}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="mr-3 h-4 w-4 rounded-full bg-blue-500"></div>
                        <span className="font-medium capitalize">
                          {platform}
                        </span>
                      </div>
                      <span className="text-gray-600">{count} shares</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Conversion Rate */}
          {analytics && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">
                Performance Metrics
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="text-2xl font-bold text-green-600">
                    {(analytics.conversion_rate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Avg. Engagement per Share
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {analytics.total_shares > 0
                      ? (
                          analytics.total_engagement / analytics.total_shares
                        ).toFixed(1)
                      : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg. Views per Share</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {analytics.total_shares > 0
                      ? (
                          analytics.total_views / analytics.total_shares
                        ).toFixed(0)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Content */}
        {analytics && analytics.top_performing_content.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Your Top Performing Content
            </h2>
            <div className="space-y-4">
              {analytics.top_performing_content.map((content, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">
                      {content.title}
                    </h3>
                    <span className="rounded bg-green-100 px-2 py-1 text-sm text-green-800">
                      {(
                        content.performance_metrics.engagement_rate * 100
                      ).toFixed(1)}
                      % engagement
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">
                    {content.description}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{content.social_platforms.join(', ')}</span>
                    <span>{content.performance_metrics.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Content */}
        {trendingContent.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Trending UGC Content</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trendingContent.map((content, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="line-clamp-2 font-medium text-gray-900">
                      {content.title}
                    </h3>
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {(
                        content.performance_metrics.engagement_rate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                    {content.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{content.social_platforms.join(', ')}</span>
                    <span>{content.performance_metrics.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
