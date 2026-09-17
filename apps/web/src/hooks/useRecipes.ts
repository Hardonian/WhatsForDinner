import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Recipe, GenerateRecipesRequest } from '@/lib/validation';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabaseClient';
import { fetchWithCSRF } from '@/lib/fetchWithCSRF';

interface GenerateRecipesResponse {
  recipes: Recipe[];
  metadata: {
    model: string;
    timestamp: string;
    retryCount: number;
    tokensUsed: number;
    costUsd: number;
  };
}

export function useGenerateRecipes() {
  const queryClient = useQueryClient();
  const { checkQuota, logUsage, tenant } = useTenant();

  return useMutation<GenerateRecipesResponse, Error, GenerateRecipesRequest>({
    mutationFn: async ({ ingredients, preferences }) => {
      // Check quota before generating
      const hasQuota = await checkQuota('meal_generation');
      if (!hasQuota) {
        throw new Error('Daily quota exceeded. Please upgrade your plan.');
      }

      const response = await fetchWithCSRF('/api/dinner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant?.id || '',
        },
        body: JSON.stringify({ ingredients, preferences }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate recipes');
      }

      const data = await response.json();

      // Log usage
      await logUsage(
        'meal_generation',
        data.metadata.tokensUsed || 0,
        data.metadata.costUsd || 0,
        data.metadata.model,
        { ingredients, preferences }
      );

      return data;
    },
    onSuccess: data => {
      // Cache the generated recipes
      queryClient.setQueryData(
        ['recipes', data.metadata.timestamp],
        data.recipes
      );

      // Invalidate tenant usage query
      queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
    },
  });
}

export function useRecipes(timestamp?: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<Recipe[]>(['recipes', timestamp]);
}

export function useSavedRecipes() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['saved-recipes', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!tenant,
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  const { tenant, logUsage } = useTenant();

  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      if (!tenant) throw new Error('No tenant found');

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          tenant_id: tenant.id,
          title: recipe.title,
          details: recipe,
          calories: recipe.calories,
          time: (recipe as any).time || recipe.cookTime,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (recipeId: number) => {
      if (!tenant) throw new Error('No tenant found');

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('tenant_id', tenant.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-recipes'] });
    },
  });
}
