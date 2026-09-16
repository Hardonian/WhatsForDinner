import { useState, useEffect } from 'react'
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('usetenant');

;
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/supabaseClient';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantMembership =
  Database['public']['Tables']['tenant_memberships']['Row'];
type UsageSummary = {
  total_meals_today: number;
  total_tokens_today: number;
  total_cost_today: number;
  plan_quota: number;
  remaining_quota: number;
};

export function useTenant() {
  const { user } = useUser();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTenantData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Get user's profile to find tenant
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.tenant_id) {
        // User doesn't have a tenant yet, create one
        await createTenantForUser();
        return;
      }

      // Fetch tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (tenantError) {
        throw tenantError;
      }

      setTenant(tenantData);

      // Fetch tenant memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('tenant_memberships')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

      if (membershipsError) {
        throw membershipsError;
      }

      setMemberships(membershipsData || []);

      // Fetch usage summary
      const { data: usageData, error: usageError } = await supabase.rpc(
        'get_tenant_usage_summary',
        { tenant_id_param: profile.tenant_id }
      );

      if (usageError) {
        _logger.error('Error fetching usage data:', { usageError });
      } else if (usageData && usageData.length > 0) {
        setUsage(usageData[0]);
      }
    } catch (err) {
      _logger.error('Error fetching tenant data:', { err });
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tenant data'
      );
    } finally {
      setLoading(false);
    }
  };

  const createTenantForUser = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase.rpc('create_tenant_for_user', {
        user_id: user.id,
        tenant_name: `${user.email?.split('@')[0]}'s Kitchen`,
        user_name: user.email?.split('@')[0] || 'User',
      });

      if (error) {
        throw error;
      }

      // Refresh tenant data
      await fetchTenantData();
    } catch (err) {
      _logger.error('Error creating tenant:', { err });
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  };

  const checkQuota = async (action: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const { data, error } = await supabase.rpc('check_user_quota', {
        user_id_param: user.id,
        action_param: action,
      });

      if (error) {
        throw error;
      }

      return data || false;
    } catch (err) {
      _logger.error('Error checking quota:', { err });
      return false;
    }
  };

  const logUsage = async (
    action: string,
    tokensUsed: number = 0,
    costUsd: number = 0,
    modelUsed: string | null = null,
    metadata: any = {}
  ) => {
    try {
      if (!user) return;

      await supabase.rpc('log_usage', {
        user_id_param: user.id,
        action_param: action,
        tokens_used_param: tokensUsed,
        cost_usd_param: costUsd,
        model_used_param: modelUsed,
        metadata_param: metadata,
      });
    } catch (err) {
      _logger.error('Error logging usage:', { err });
    }
  };

  const inviteUser = async (email: string, role: 'editor' | 'viewer') => {
    try {
      if (!tenant) return;

      const { data, error } = await supabase.from('tenant_invites').insert({
        tenant_id: tenant.id,
        email,
        role,
        invited_by: user?.id || null,
        token: crypto.randomUUID(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      _logger.error('Error inviting user:', { err });
      throw err;
    }
  };

  const refreshUsage = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase.rpc('get_tenant_usage_summary', {
        tenant_id_param: tenant.id,
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setUsage(data[0]);
      }
    } catch (err) {
      _logger.error('Error refreshing usage:', { err });
    }
  };

  return {
    tenant,
    memberships,
    usage,
    loading,
    error,
    createTenantForUser,
    checkQuota,
    logUsage,
    inviteUser,
    refreshUsage,
    refetch: fetchTenantData,
  };
}
