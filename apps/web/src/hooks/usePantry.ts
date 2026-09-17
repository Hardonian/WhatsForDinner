import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { PantryItem } from '@/types/pantry';
import { useTenant } from './useTenant';

export function usePantryItems() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['pantry', tenant?.id],
    queryFn: async (): Promise<PantryItem[]> => {
      if (!tenant) return [];

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('ingredient');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAddPantryItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<
    PantryItem,
    Error,
    { ingredient: string; quantity: number }
  >({
    mutationFn: async ({ ingredient, quantity }) => {
      if (!tenant) throw new Error('No tenant found');

      const { data, error } = await supabase
        .from('pantry_items')
        .insert({
          tenant_id: tenant.id,
          ingredient,
          quantity,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
    },
  });
}

export function useUpdatePantryItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<void, Error, { id: number; quantity: number }>({
    mutationFn: async ({ id, quantity }) => {
      if (!tenant) throw new Error('No tenant found');

      const { error } = await supabase
        .from('pantry_items')
        .update({ quantity })
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
    },
  });
}

export function useDeletePantryItem() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  return useMutation<void, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      if (!tenant) throw new Error('No tenant found');

      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantry'] });
    },
  });
}
