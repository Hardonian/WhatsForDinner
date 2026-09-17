'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, MessageSquare } from 'lucide-react';
import { feedbackSystem } from '@/lib/feedbackSystem';
import { logger } from '@/lib/logger';
import type { RecipeFeedback } from '@/types/recipe';

interface RecipeFeedbackProps {
  recipeId: number;
  userId?: string;
  onFeedbackSubmitted?: (feedback: { type: string; score?: number; text?: string; [key: string]: any }) => void;
}

export default function RecipeFeedback({
  recipeId,
  userId,
  onFeedbackSubmitted,
}: RecipeFeedbackProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(
    null
  );

  const handleThumbsUp = async () => {
    if (!userId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await feedbackSystem.submitFeedback(
        recipeId,
        userId,
        'thumbs_up'
      );

      if (success) {
        setSubmittedFeedback('thumbs_up');
        onFeedbackSubmitted?.({ type: 'thumbs_up' });
        await logger.info(
          'Thumbs up feedback submitted',
          { recipeId, userId },
          'frontend',
          'feedback'
        );
      }
    } catch (error) {
      await logger.error(
        'Failed to submit thumbs up feedback',
        { error, recipeId, userId },
        'frontend',
        'feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsDown = async () => {
    if (!userId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await feedbackSystem.submitFeedback(
        recipeId,
        userId,
        'thumbs_down'
      );

      if (success) {
        setSubmittedFeedback('thumbs_down');
        onFeedbackSubmitted?.({ type: 'thumbs_down' });
        await logger.info(
          'Thumbs down feedback submitted',
          { recipeId, userId },
          'frontend',
          'feedback'
        );
      }
    } catch (error) {
      await logger.error(
        'Failed to submit thumbs down feedback',
        { error, recipeId, userId },
        'frontend',
        'feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!userId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await feedbackSystem.submitFeedback(
        recipeId,
        userId,
        'rating',
        rating
      );

      if (success) {
        setUserRating(rating);
        setSubmittedFeedback('rating');
        onFeedbackSubmitted?.({ type: 'rating', score: rating });
        await logger.info(
          'Rating feedback submitted',
          { recipeId, userId, rating },
          'frontend',
          'feedback'
        );
      }
    } catch (error) {
      await logger.error(
        'Failed to submit rating feedback',
        { error, recipeId, userId, rating },
        'frontend',
        'feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextFeedback = async () => {
    if (!userId || isSubmitting || !feedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await feedbackSystem.submitFeedback(
        recipeId,
        userId,
        'rating',
        userRating || 3,
        feedbackText.trim()
      );

      if (success) {
        setSubmittedFeedback('text');
        onFeedbackSubmitted?.({ type: 'text', text: feedbackText });
        setFeedbackText('');
        setShowTextInput(false);
        await logger.info(
          'Text feedback submitted',
          { recipeId, userId, text: feedbackText },
          'frontend',
          'feedback'
        );
      }
    } catch (error) {
      await logger.error(
        'Failed to submit text feedback',
        { error, recipeId, userId },
        'frontend',
        'feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-sm text-gray-500">Sign in to provide feedback</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">
          Rate this recipe:
        </span>

        {/* Star Rating */}
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              disabled={isSubmitting}
              className={`p-1 ${
                userRating && star <= userRating
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              } ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Thumbs Up/Down */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleThumbsUp}
          disabled={isSubmitting}
          className={`flex items-center space-x-2 rounded-lg border px-3 py-2 ${
            submittedFeedback === 'thumbs_up'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50'
          } ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">Helpful</span>
        </button>

        <button
          onClick={handleThumbsDown}
          disabled={isSubmitting}
          className={`flex items-center space-x-2 rounded-lg border px-3 py-2 ${
            submittedFeedback === 'thumbs_down'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50'
          } ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="text-sm">Not helpful</span>
        </button>
      </div>

      {/* Text Feedback */}
      <div className="space-y-2">
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Add detailed feedback</span>
        </button>

        {showTextInput && (
          <div className="space-y-2">
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Tell us what you think about this recipe..."
              className="w-full resize-none rounded-lg border border-gray-200 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleTextFeedback}
                disabled={isSubmitting || !feedbackText.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                onClick={() => {
                  setShowTextInput(false);
                  setFeedbackText('');
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {submittedFeedback && (
        <div className="text-sm text-green-600">
          Thank you for your feedback!
        </div>
      )}
    </div>
  );
}
