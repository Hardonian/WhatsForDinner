import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ScrollView, AccessibilityInfo } from 'react-native';
import { Text, Button, Card } from '@whats-for-dinner/ui';
import { Recipe } from '@whats-for-dinner/utils';
import { Clock, Users, ChefHat, ChevronDown, ChevronUp } from 'lucide-react-native';

interface RecipeCardProps {
  recipe: Recipe;
  onSave: () => void;
  canSave: boolean;
}

export function RecipeCard({ recipe, onSave, canSave }: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
    if (!showDetails) {
      AccessibilityInfo.announceForAccessibility('Recipe instructions expanded');
    }
  };

  return (
    <Card className="p-4 space-y-3" accessibilityRole="article">
      <View className="space-y-2">
        <Text 
          variant="h3" 
          className="text-primary"
          accessibilityRole="header"
        >
          {recipe.title}
        </Text>
        {recipe.description && (
          <Text variant="body" className="text-muted-foreground">
            {recipe.description}
          </Text>
        )}
      </View>

      {recipe.imageUrl && (
        <Image
          source={{ uri: recipe.imageUrl }}
          className="w-full h-48 rounded-lg"
          resizeMode="cover"
          accessibilityLabel={`${recipe.title} recipe image`}
        />
      )}

      <View className="flex-row justify-between items-center">
        <View className="flex-row space-x-4">
          <View className="flex-row items-center space-x-1">
            <Clock size={16} color="#64748b" />
            <Text variant="small">{recipe.prepTime + recipe.cookTime}m</Text>
          </View>
          <View className="flex-row items-center space-x-1">
            <Users size={16} color="#64748b" />
            <Text variant="small">{recipe.servings} servings</Text>
          </View>
          <View className="flex-row items-center space-x-1">
            <ChefHat size={16} color="#64748b" />
            <Text variant="small" className="capitalize">
              {recipe.difficulty}
            </Text>
          </View>
        </View>
      </View>

      <View className="space-y-2" accessibilityRole="list">
        <Text variant="h5" accessibilityRole="header">Ingredients</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-2">
            {recipe.ingredients.map((ingredient, index) => (
              <View
                key={index}
                className="bg-secondary px-2 py-1 rounded"
                accessibilityLabel={`Ingredient ${index + 1}: ${ingredient}`}
              >
                <Text variant="small" className="text-muted-foreground">
                  {ingredient}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={toggleDetails}
        accessibilityRole="button"
        accessibilityLabel={showDetails ? "Hide instructions" : "Show instructions"}
        accessibilityState={{ expanded: showDetails }}
        className="flex-row items-center justify-between p-2"
      >
        <Text variant="h5" accessibilityRole="header">
          Instructions
        </Text>
        {showDetails ? (
          <ChevronUp size={20} color="#64748b" />
        ) : (
          <ChevronDown size={20} color="#64748b" />
        )}
      </TouchableOpacity>

      {showDetails && (
        <ScrollView className="max-h-64" accessibilityRole="list">
          {(recipe.instructions || (recipe as any).steps || []).map((step: string, index: number) => (
            <View key={index} className="flex-row gap-2 mb-3" accessibilityRole="text">
              <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
                <Text variant="small" className="text-primary-foreground font-bold">
                  {index + 1}
                </Text>
              </View>
              <Text variant="body" className="text-muted-foreground flex-1">
                {step}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {canSave && (
        <Button 
          onPress={onSave} 
          className="w-full min-h-[48px]"
          accessibilityLabel={`Save recipe: ${recipe.title}`}
        >
          Save Recipe
        </Button>
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <View className="flex-row flex-wrap space-x-2">
          {recipe.tags.map((tag, index) => (
            <View
              key={index}
              className="bg-secondary px-2 py-1 rounded-full"
            >
              <Text variant="small">{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}