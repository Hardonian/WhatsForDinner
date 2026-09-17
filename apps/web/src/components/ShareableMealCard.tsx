'use client';

import { useState, useEffect } from 'react';
import { UGCGrowth, MealCard } from '@/lib/ugcGrowth';

interface ShareableMealCardProps {
  recipeData: {
    recipe_name: string;
    cooking_time: number;
    difficulty_level: 'easy' | 'medium' | 'hard';
    cuisine_type: string;
    dietary_tags: string[];
    nutrition_info: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    image_url?: string;
  };
  userId: string;
  onShare?: (shareId: string) => void;
}

export default function ShareableMealCard({
  recipeData,
  userId,
  onShare,
}: ShareableMealCardProps) {
  const [mealCard, setMealCard] = useState<MealCard | null>(null);
  const [shareSuggestions, setShareSuggestions] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    createMealCard();
    loadShareSuggestions();
  }, []);

  const createMealCard = async () => {
    try {
      const card = await UGCGrowth.createMealCard(userId, recipeData);
      setMealCard(card);
    } catch (error) {
      // Error handled: Error creating meal card:
    }
  };

  const loadShareSuggestions = async () => {
    try {
      const suggestions = await UGCGrowth.generateShareSuggestions(
        userId,
        recipeData
      );
      setShareSuggestions(suggestions);
      setSelectedPlatforms(suggestions.optimal_platforms);
    } catch (error) {
      // Error handled: Error loading share suggestions:
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleShare = async () => {
    if (!mealCard || selectedPlatforms.length === 0) return;

    setIsSharing(true);
    try {
      await UGCGrowth.shareToSocial(
        mealCard.id,
        selectedPlatforms,
        customMessage
      );

      // Generate share URLs for the selected platforms
      const { share_urls } =
        await UGCGrowth.createShareableMealCardData(recipeData);
      setShareUrls(share_urls);

      if (onShare) {
        onShare(mealCard.id);
      }

      alert('Content shared successfully!');
    } catch (error) {
      // Error handled: Error sharing content:
      alert('Failed to share content');
    } finally {
      setIsSharing(false);
    }
  };

  const openShareUrl = (platform: string) => {
    const url = shareUrls[platform];
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (!mealCard || !shareSuggestions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg">
      {/* Meal Card Preview */}
      <div className="relative">
        <img
          src={mealCard.image_url}
          alt={mealCard.recipe_name}
          className="h-64 w-full object-cover"
        />
        <div className="absolute right-4 top-4 rounded-full bg-white bg-opacity-90 px-3 py-1 text-sm font-medium">
          {mealCard.difficulty_level.toUpperCase()}
        </div>
      </div>

      <div className="p-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          {mealCard.title}
        </h2>
        <p className="mb-4 text-gray-600">{mealCard.description}</p>

        {/* Recipe Details */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mealCard.cooking_time}
            </div>
            <div className="text-sm text-gray-600">minutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mealCard.nutrition_info.calories}
            </div>
            <div className="text-sm text-gray-600">calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mealCard.cuisine_type}
            </div>
            <div className="text-sm text-gray-600">cuisine</div>
          </div>
        </div>

        {/* Dietary Tags */}
        <div className="mb-6 flex flex-wrap gap-2">
          {mealCard.dietary_tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Nutrition Info */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold">Nutrition per serving</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">
                {mealCard.nutrition_info.protein}g
              </div>
              <div className="text-gray-600">Protein</div>
            </div>
            <div className="text-center">
              <div className="font-medium">
                {mealCard.nutrition_info.carbs}g
              </div>
              <div className="text-gray-600">Carbs</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{mealCard.nutrition_info.fat}g</div>
              <div className="text-gray-600">Fat</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{mealCard.cooking_time}min</div>
              <div className="text-gray-600">Cook Time</div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold">Share this recipe</h3>

          {/* Custom Message */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Custom message (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Add a personal message..."
              className="h-20 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Platform Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select platforms
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                'twitter',
                'facebook',
                'linkedin',
                'instagram',
                'pinterest',
                'whatsapp',
              ].map(platform => (
                <label
                  key={platform}
                  className="flex cursor-pointer items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Suggested Content */}
          {shareSuggestions && (
            <div className="mb-4">
              <h4 className="mb-2 font-medium">Suggested content</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Title:
                  </label>
                  <p className="text-sm text-gray-800">
                    {shareSuggestions.suggested_titles[0]}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Description:
                  </label>
                  <p className="text-sm text-gray-800">
                    {shareSuggestions.suggested_descriptions[0]}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Hashtags:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {shareSuggestions.suggested_hashtags
                      .slice(0, 5)
                      .map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={isSharing || selectedPlatforms.length === 0}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSharing
              ? 'Sharing...'
              : `Share to ${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? 's' : ''}`}
          </button>

          {/* Share URLs (if shared) */}
          {Object.keys(shareUrls).length > 0 && (
            <div className="mt-4 rounded-lg bg-green-50 p-4">
              <h4 className="mb-2 font-medium text-green-800">
                Share links generated!
              </h4>
              <div className="space-y-2">
                {Object.entries(shareUrls).map(([platform, url]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">{platform}</span>
                    <button
                      onClick={() => openShareUrl(platform)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
