'use client';

import { Users, MessageSquare, Heart, Share2, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FamilyActivity {
  id: string;
  user: string;
  avatar: string;
  action: 'logged_meal' | 'added_recipe' | 'completed_goal' | 'shared';
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export function FamilyFeedCard() {
  const activities: FamilyActivity[] = [
    {
      id: '1',
      user: 'Mom',
      avatar: '??',
      action: 'logged_meal',
      content: 'Just logged a delicious Mediterranean bowl for lunch! ??',
      timestamp: '2 hours ago',
      likes: 3,
      comments: 1,
    },
    {
      id: '2',
      user: 'Dad',
      avatar: '??',
      action: 'completed_goal',
      content: '?? Completed daily water goal! 8/8 glasses',
      timestamp: '4 hours ago',
      likes: 5,
      comments: 2,
    },
    {
      id: '3',
      user: 'Sarah',
      avatar: '??',
      action: 'shared',
      content: 'Shared a new recipe: Chocolate Chip Cookies ??',
      timestamp: '6 hours ago',
      likes: 8,
      comments: 3,
    },
  ];

  const getActionIcon = (action: FamilyActivity['action']) => {
    switch (action) {
      case 'logged_meal':
        return '???';
      case 'added_recipe':
        return '??';
      case 'completed_goal':
        return '?';
      case 'shared':
        return '??';
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-lg">Family Feed</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
              <div className="text-2xl">{activity.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{activity.user}</span>
                  <span className="text-lg">{getActionIcon(activity.action)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors">
                <Heart className="w-3 h-3" />
                <span>{activity.likes}</span>
              </button>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 transition-colors">
                <MessageSquare className="w-3 h-3" />
                <span>{activity.comments}</span>
              </button>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600 transition-colors">
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4">
        <MessageSquare className="w-4 h-4 mr-2" />
        Send Message
      </Button>
    </Card>
  );
}

export default FamilyFeedCard;
