'use client';

/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a user-friendly error page
 * Provides error reporting and recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
// Sentry removed — optional dependency
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('error-boundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error using unified logger
    _logger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Report to Sentry error tracking service
    try {
      console.error(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: true,
        },
      });
    } catch (sentryError) {
      // Fallback if Sentry is not initialized
      _logger.error('Failed to log to Sentry', {
        error: sentryError instanceof Error ? sentryError.message : String(sentryError),
      });
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDevelopment && this.state.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="font-mono text-sm">
                    <div className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      Error: {this.state.error.name}
                    </div>
                    <div className="text-red-700 dark:text-red-300 whitespace-pre-wrap break-all">
                      {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                        <div className="font-semibold text-red-800 dark:text-red-200 mb-2">
                          Component Stack:
                        </div>
                        <div className="text-red-700 dark:text-red-300 text-xs whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="default">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                {isDevelopment && (
                  <Button
                    onClick={() => {
                      _logger.error('Full error details:', { error: this.state.error, errorInfo: this.state.errorInfo });
                    }}
                    variant="outline"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Log Details
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  If this problem persists, please{' '}
                  <a
                    href="/support"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    contact support
                  </a>
                  {' '}with the error details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
