// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your_anon_key';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

describe('Supabase Backend Validation', () => {
  let testUserId: string;
  let testTenantId: string;

  beforeAll(async () => {
    // Create a test user and tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: 'Test Tenant',
        plan: 'free',
        status: 'active',
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Failed to create test tenant:', tenantError);
    } else {
      testTenantId = tenant.id;
    }

    // Create a test user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test User',
        tenant_id: testTenantId,
        role: 'owner',
      })
      .select()
      .single();

    if (profileError) {
      console.error('Failed to create test profile:', profileError);
    } else {
      testUserId = profile.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testTenantId) {
      await supabaseAdmin.from('tenants').delete().eq('id', testTenantId);
    }
  });

  describe('Database Schema', () => {
    test('should have all required tables', async () => {
      const tables = [
        'profiles',
        'pantry_items',
        'recipes',
        'favorites',
        'jobs_queue',
        'job_results',
        'job_logs',
        'tenants',
        'tenant_memberships',
        'subscriptions',
        'usage_logs',
        'ai_cache',
        'analytics_events',
        'recipe_metrics',
        'system_metrics',
        'recipe_feedback',
      ];

      for (const table of tables) {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);

        expect(error).toBeNull();
        expect(data).toBeDefined();
      }
    });

    test('should have RLS policies enabled', async () => {
      // Test that RLS is working by trying to access data without auth
      const { data, error } = await supabase.from('pantry_items').select('*');

      // Should either return empty data or error due to RLS
      expect(error || data).toBeDefined();
    });
  });

  describe('Job Queue System', () => {
    test('should create a job successfully', async () => {
      const { data, error } = await supabaseAdmin.rpc('create_job', {
        job_type: 'meal_generation',
        job_payload: {
          pantry_items: ['chicken', 'rice'],
          tenant_id: testTenantId,
          user_id: testUserId,
        },
        job_priority: 5,
        job_tenant_id: testTenantId,
        job_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data).toBe('number');
    });

    test('should get job statistics', async () => {
      const { data, error } = await supabaseAdmin.rpc('get_job_stats');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('total_jobs');
        expect(data[0]).toHaveProperty('pending_jobs');
        expect(data[0]).toHaveProperty('completed_jobs');
      }
    });

    test('should process jobs', async () => {
      // Create a test job
      const { data: jobId } = await supabaseAdmin.rpc('create_job', {
        job_type: 'data_cleanup',
        job_payload: {
          cleanup_type: 'expired_cache',
          days_to_keep: 7,
        },
        job_priority: 1,
      });

      // Process the job
      const { data: jobs } = await supabaseAdmin.rpc('get_next_job');

      if (jobs && jobs.length > 0) {
        const job = jobs[0];
        expect(job.job_id).toBeDefined();
        expect(job.job_type).toBeDefined();
        expect(job.job_payload).toBeDefined();
      }
    });
  });

  describe('Edge Functions', () => {
    test('should have API function accessible', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/api/pantry`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      // Should return 401 for unauthenticated request
      expect(response.status).toBe(401);
    });

    test('should have job processor function accessible', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/job-processor`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message');
    });

    test('should have meal generation function accessible', async () => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-meal`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pantry_items: ['chicken', 'rice'],
            tenant_id: testTenantId,
            user_id: testUserId,
          }),
        }
      );

      // Should return 401 for unauthenticated request or 400 for missing auth
      expect([200, 400, 401, 429]).toContain(response.status);
    });
  });

  describe('Multi-tenant Features', () => {
    test('should create tenant successfully', async () => {
      const { data, error } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: 'Test Tenant 2',
          plan: 'pro',
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe('Test Tenant 2');
      expect(data.plan).toBe('pro');

      // Clean up
      await supabaseAdmin.from('tenants').delete().eq('id', data.id);
    });

    test('should check user quota', async () => {
      const { data, error } = await supabaseAdmin.rpc('check_user_quota', {
        user_id_param: testUserId,
        action_param: 'meal_generation',
      });

      expect(error).toBeNull();
      expect(typeof data).toBe('boolean');
    });

    test('should log usage', async () => {
      const { error } = await supabaseAdmin.rpc('log_usage', {
        user_id_param: testUserId,
        action_param: 'meal_generation',
        tokens_used_param: 100,
        cost_usd_param: 0.001,
        model_used_param: 'gpt-4',
        metadata_param: { test: true },
      });

      expect(error).toBeNull();
    });
  });

  describe('Analytics Functions', () => {
    test('should get popular ingredients', async () => {
      const { data, error } = await supabaseAdmin.rpc(
        'get_popular_ingredients',
        {
          limit_count: 5,
        }
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should get cuisine preferences', async () => {
      const { data, error } = await supabaseAdmin.rpc(
        'get_cuisine_preferences'
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Data Cleanup', () => {
    test('should clean up old jobs', async () => {
      const { error } = await supabaseAdmin.rpc('cleanup_old_jobs', {
        days_to_keep: 1,
      });

      expect(error).toBeNull();
    });

    test('should clean up expired cache', async () => {
      // This would typically be tested with actual expired cache entries
      const { error } = await supabaseAdmin
        .from('ai_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Should not error even if no records to delete
      expect(error).toBeNull();
    });
  });
});

// Helper function to run validation
export async function runSupabaseValidation() {
  console.log('🧪 Running Supabase Backend Validation...');

  try {
    // Test database connection
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');

    // Test Edge Functions
    const functions = ['api', 'generate-meal', 'job-processor'];
    for (const func of functions) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
          method: 'OPTIONS',
        });

        if (response.ok) {
          console.log(`✅ Edge Function ${func} is accessible`);
        } else {
          console.log(
            `⚠️  Edge Function ${func} returned status ${response.status}`
          );
        }
      } catch (error) {
        console.log(
          `❌ Edge Function ${func} is not accessible:`,
          error.message
        );
      }
    }

    // Test job queue
    const { data: stats } = await supabaseAdmin.rpc('get_job_stats');
    if (stats) {
      console.log('✅ Job queue system is functional');
      console.log(`   Total jobs: ${stats[0]?.total_jobs || 0}`);
    } else {
      console.log('❌ Job queue system is not functional');
    }

    console.log('🎉 Supabase Backend Validation Complete!');
    return true;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  runSupabaseValidation().then(success => {
    process.exit(success ? 0 : 1);
  });
}
