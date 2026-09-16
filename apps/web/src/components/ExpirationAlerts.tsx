'use client';

/**
 * Expiration Alerts Component
 * 
 * Displays alerts for items expiring soon with recipe suggestions
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('expiration-alerts');

interface ExpirationAlert {
  itemId: string;
  itemName: string;
  daysUntilExpiration: number;
  severity: 'warning' | 'urgent' | 'expired';
}

interface RecipeSuggestion {
  recipeId: string;
  title: string;
  usesItems: string[];
}

export function ExpirationAlerts() {
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expiration/alerts?days=7');
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      setRecipeSuggestions(data.recipeSuggestions || []);
    } catch (error) {
      _logger.error('Error fetching expiration alerts', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (itemId: string) => {
    setDismissed(prev => new Set(prev).add(itemId));
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.itemId));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'expired':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'expired':
        return 'Expired';
      case 'urgent':
        return 'Expires Soon';
      case 'warning':
        return 'Expiring';
      default:
        return '';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Expiration Alerts
          </CardTitle>
          <Badge variant="outline">{visibleAlerts.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.map(alert => (
          <div
            key={alert.itemId}
            className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
              <div className="flex-1">
                <div className="font-medium">{alert.itemName}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alert.daysUntilExpiration < 0
                    ? `Expired ${Math.abs(alert.daysUntilExpiration)} days ago`
                    : `Expires in ${alert.daysUntilExpiration} day${alert.daysUntilExpiration !== 1 ? 's' : ''}`}
                </div>
              </div>
              <Badge className={getSeverityColor(alert.severity)}>
                {getSeverityText(alert.severity)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(alert.itemId)}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {recipeSuggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Recipe Suggestions</div>
            <div className="space-y-2">
              {recipeSuggestions.map(recipe => (
                <div
                  key={recipe.recipeId}
                  className="p-2 rounded bg-muted text-sm"
                >
                  <div className="font-medium">{recipe.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Uses: {recipe.usesItems.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
