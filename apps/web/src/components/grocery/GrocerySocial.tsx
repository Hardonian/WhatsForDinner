/**
 * Grocery Social and Collaboration Component
 * Share lists, collaborate, comment, and see activity
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('grocerysocial');



import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroceryListActivity, GroceryListCollaborator, GroceryListComment } from '@/lib/grocery/social';
import { grocerySocialSystem } from '@/lib/grocery/social';
import { Share2, Users, MessageSquare, Activity, UserPlus, Send } from 'lucide-react';

interface GrocerySocialProps {
  listId: string;
  userId: string;
  userName: string;
}

export function GrocerySocial({ listId, userId, userName }: GrocerySocialProps) {
  const [collaborators, setCollaborators] = useState<GroceryListCollaborator[]>([]);
  const [comments, setComments] = useState<GroceryListComment[]>([]);
  const [activity, setActivity] = useState<GroceryListActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  useEffect(() => {
    loadSocialData();
  }, [listId]);

  async function loadSocialData() {
    try {
      const [collabs, comms, acts] = await Promise.all([
        grocerySocialSystem.getCollaborators(listId),
        grocerySocialSystem.getComments(listId),
        grocerySocialSystem.getActivity(listId),
      ]);

      setCollaborators(collabs);
      setComments(comms);
      setActivity(acts);
    } catch (error) {
      _logger.error('Failed to load social data:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async function handleShare() {
    if (!shareEmail) return;

    try {
      await grocerySocialSystem.shareList(listId, userId, [shareEmail], 'collaborate');
      setShowShareModal(false);
      setShareEmail('');
      loadSocialData();
    } catch (error) {
      _logger.error('Failed to share list:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;

    try {
      const comment = await grocerySocialSystem.addComment(listId, userId, userName, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      _logger.error('Failed to add comment:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  return (
    <div className="space-y-4">
      {/* Share and Collaborate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share & Collaborate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Collaborators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Collaborators ({collaborators.length})
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowShareModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {collaborators.map((collab) => (
                <Badge key={collab.userId} variant="secondary" className="gap-2">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback>{collab.userName[0]}</AvatarFallback>
                  </Avatar>
                  {collab.userName}
                </Badge>
              ))}
            </div>
          </div>

          {/* Share Modal */}
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 p-4 border rounded-lg bg-muted/50"
            >
              <Input
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                type="email"
              />
              <div className="flex gap-2">
                <Button onClick={handleShare} size="sm">
                  Share
                </Button>
                <Button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareEmail('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar>
                  <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <span className="font-medium">{act.userName}</span>
                  {' '}
                  <span className="text-muted-foreground">
                    {act.action} {act.item && `"${act.item}"`}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(act.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
