/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          preferences: Record<string, unknown> | null;
          tenant_id: string | null;
          role: 'owner' | 'editor' | 'viewer';
        };
        Insert: {
          id: string;
          name?: string | null;
          preferences?: Record<string, unknown> | null;
          tenant_id?: string | null;
          role?: 'owner' | 'editor' | 'viewer';
        };
        Update: {
          id?: string;
          name?: string | null;
          preferences?: Record<string, unknown> | null;
          tenant_id?: string | null;
          role?: 'owner' | 'editor' | 'viewer';
        };
      };
      tenants: {
        Row: {
          id: string;
          name: string;
          plan: 'free' | 'pro' | 'family';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: 'active' | 'inactive' | 'suspended' | 'cancelled';
          created_at: string;
          updated_at: string;
          settings: Record<string, unknown>;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: 'free' | 'pro' | 'family';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'inactive' | 'suspended' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          settings?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: 'free' | 'pro' | 'family';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'inactive' | 'suspended' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          settings?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
      };
      tenant_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          invited_by: string | null;
          joined_at: string;
          status: 'active' | 'pending' | 'suspended';
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          invited_by?: string | null;
          joined_at?: string;
          status?: 'active' | 'pending' | 'suspended';
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: 'owner' | 'editor' | 'viewer';
          invited_by?: string | null;
          joined_at?: string;
          status?: 'active' | 'pending' | 'suspended';
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          tenant_id: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: 'free' | 'pro' | 'family';
          status:
            | 'active'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'trialing'
            | 'unpaid';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan: 'free' | 'pro' | 'family';
          status:
            | 'active'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'trialing'
            | 'unpaid';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: 'free' | 'pro' | 'family';
          status?:
            | 'active'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'past_due'
            | 'trialing'
            | 'unpaid';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
      };
      usage_logs: {
        Row: {
          id: number;
          user_id: string | null;
          tenant_id: string | null;
          action: string;
          tokens_used: number;
          cost_usd: number;
          model_used: string | null;
          timestamp: string;
          metadata: any;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          tenant_id?: string | null;
          action: string;
          tokens_used?: number;
          cost_usd?: number;
          model_used?: string | null;
          timestamp?: string;
          metadata?: any;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          tenant_id?: string | null;
          action?: string;
          tokens_used?: number;
          cost_usd?: number;
          model_used?: string | null;
          timestamp?: string;
          metadata?: any;
        };
      };
      pantry_items: {
        Row: {
          id: number;
          user_id: string;
          ingredient: string;
          quantity: number;
        };
        Insert: {
          user_id: string;
          ingredient: string;
          quantity?: number;
        };
        Update: {
          id?: number;
          user_id?: string;
          ingredient?: string;
          quantity?: number;
        };
      };
      recipes: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          details: Record<string, unknown>;
          calories: number;
          time: string;
        };
        Insert: {
          user_id: string;
          title: string;
          details: Record<string, unknown>;
          calories: number;
          time: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string;
          details?: any;
          calories?: number;
          time?: string;
        };
      };
      favorites: {
        Row: {
          id: number;
          user_id: string;
          recipe_id: number;
        };
        Insert: {
          user_id: string;
          recipe_id: number;
        };
        Update: {
          id?: number;
          user_id?: string;
          recipe_id?: number;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          user_id: string | null;
          session_id: string;
          properties: any;
          timestamp: string;
          page_url: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          event_type: string;
          user_id?: string | null;
          session_id: string;
          properties?: any;
          timestamp?: string;
          page_url?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          event_type?: string;
          user_id?: string | null;
          session_id?: string;
          properties?: any;
          timestamp?: string;
          page_url?: string | null;
          user_agent?: string | null;
        };
      };
      recipe_metrics: {
        Row: {
          id: number;
          recipe_id: number | null;
          user_id: string | null;
          generated_at: string;
          ingredients_used: string[];
          cuisine_type: string | null;
          cook_time: string;
          calories: number;
          feedback_score: number | null;
          api_latency_ms: number;
          model_used: string;
          retry_count: number;
        };
        Insert: {
          id?: number;
          recipe_id?: number | null;
          user_id?: string | null;
          generated_at?: string;
          ingredients_used: string[];
          cuisine_type?: string | null;
          cook_time: string;
          calories: number;
          feedback_score?: number | null;
          api_latency_ms: number;
          model_used: string;
          retry_count?: number;
        };
        Update: {
          id?: number;
          recipe_id?: number | null;
          user_id?: string | null;
          generated_at?: string;
          ingredients_used?: string[];
          cuisine_type?: string | null;
          cook_time?: string;
          calories?: number;
          feedback_score?: number | null;
          api_latency_ms?: number;
          model_used?: string;
          retry_count?: number;
        };
      };
      system_metrics: {
        Row: {
          id: string;
          metric_type:
            | 'api_performance'
            | 'user_engagement'
            | 'error_rate'
            | 'cost_analysis';
          value: number;
          metadata: any;
          timestamp: string;
        };
        Insert: {
          id?: string;
          metric_type:
            | 'api_performance'
            | 'user_engagement'
            | 'error_rate'
            | 'cost_analysis';
          value: number;
          metadata?: any;
          timestamp?: string;
        };
        Update: {
          id?: string;
          metric_type?:
            | 'api_performance'
            | 'user_engagement'
            | 'error_rate'
            | 'cost_analysis';
          value?: number;
          metadata?: any;
          timestamp?: string;
        };
      };
      logs: {
        Row: {
          id: string;
          level: 'error' | 'warn' | 'info' | 'debug';
          message: string;
          context: Record<string, unknown>;
          user_id: string | null;
          session_id: string | null;
          stack_trace: string | null;
          timestamp: string;
          source: 'frontend' | 'api' | 'edge_function' | 'system';
          component: string | null;
        };
        Insert: {
          id?: string;
          level: 'error' | 'warn' | 'info' | 'debug';
          message: string;
          context?: any;
          user_id?: string | null;
          session_id?: string | null;
          stack_trace?: string | null;
          timestamp?: string;
          source: 'frontend' | 'api' | 'edge_function' | 'system';
          component?: string | null;
        };
        Update: {
          id?: string;
          level?: 'error' | 'warn' | 'info' | 'debug';
          message?: string;
          context?: any;
          user_id?: string | null;
          session_id?: string | null;
          stack_trace?: string | null;
          timestamp?: string;
          source?: 'frontend' | 'api' | 'edge_function' | 'system';
          component?: string | null;
        };
      };
      error_reports: {
        Row: {
          id: string;
          error_type: string;
          message: string;
          stack_trace: string | null;
          user_id: string | null;
          session_id: string | null;
          context: Record<string, unknown>;
          resolved: boolean;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          error_type: string;
          message: string;
          stack_trace?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          context?: any;
          resolved?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          error_type?: string;
          message?: string;
          stack_trace?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          context?: any;
          resolved?: boolean;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
      recipe_feedback: {
        Row: {
          id: number;
          recipe_id: number | null;
          user_id: string | null;
          feedback_type: 'thumbs_up' | 'thumbs_down' | 'rating';
          score: number | null;
          feedback_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          recipe_id?: number | null;
          user_id?: string | null;
          feedback_type: 'thumbs_up' | 'thumbs_down' | 'rating';
          score?: number | null;
          feedback_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          recipe_id?: number | null;
          user_id?: string | null;
          feedback_type?: 'thumbs_up' | 'thumbs_down' | 'rating';
          score?: number | null;
          feedback_text?: string | null;
          created_at?: string;
        };
      };
      ai_config: {
        Row: {
          id: string;
          model_name: string;
          system_prompt: string;
          message_templates: any;
          version: string;
          is_active: boolean;
          created_at: string;
          performance_score: number | null;
          metadata: any;
        };
        Insert: {
          id?: string;
          model_name: string;
          system_prompt: string;
          message_templates: any;
          version: string;
          is_active?: boolean;
          created_at?: string;
          performance_score?: number | null;
          metadata?: any;
        };
        Update: {
          id?: string;
          model_name?: string;
          system_prompt?: string;
          message_templates?: any;
          version?: string;
          is_active?: boolean;
          created_at?: string;
          performance_score?: number | null;
          metadata?: any;
        };
      };
      workflow_state: {
        Row: {
          id: string;
          workflow_name: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          current_step: string | null;
          progress_percentage: number;
          metadata: any;
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          workflow_name: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          current_step?: string | null;
          progress_percentage?: number;
          metadata?: any;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          workflow_name?: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          current_step?: string | null;
          progress_percentage?: number;
          metadata?: any;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
        };
      };
      growth_metrics: {
        Row: {
          id: string;
          tenant_id: string;
          metric_type:
            | 'cac'
            | 'ltv'
            | 'retention_d30'
            | 'retention_d90'
            | 'mrr'
            | 'churn_rate'
            | 'ai_cost_ratio'
            | 'conversion_rate'
            | 'activation_rate'
            | 'engagement_score';
          value: number;
          cohort_date: string | null;
          period_start: string;
          period_end: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          metric_type:
            | 'cac'
            | 'ltv'
            | 'retention_d30'
            | 'retention_d90'
            | 'mrr'
            | 'churn_rate'
            | 'ai_cost_ratio'
            | 'conversion_rate'
            | 'activation_rate'
            | 'engagement_score';
          value: number;
          cohort_date?: string | null;
          period_start: string;
          period_end: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          metric_type?:
            | 'cac'
            | 'ltv'
            | 'retention_d30'
            | 'retention_d90'
            | 'mrr'
            | 'churn_rate'
            | 'ai_cost_ratio'
            | 'conversion_rate'
            | 'activation_rate'
            | 'engagement_score';
          value?: number;
          cohort_date?: string | null;
          period_start?: string;
          period_end?: string;
          metadata?: any;
          created_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          invitee_email: string | null;
          invitee_id: string | null;
          reward_status: 'pending' | 'earned' | 'paid' | 'expired';
          referral_code: string;
          reward_type: 'pro_extension' | 'credit' | 'cash' | null;
          reward_value: number | null;
          conversion_date: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          invitee_email?: string | null;
          invitee_id?: string | null;
          reward_status?: 'pending' | 'earned' | 'paid' | 'expired';
          referral_code: string;
          reward_type?: 'pro_extension' | 'credit' | 'cash' | null;
          reward_value?: number | null;
          conversion_date?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          invitee_email?: string | null;
          invitee_id?: string | null;
          reward_status?: 'pending' | 'earned' | 'paid' | 'expired';
          referral_code?: string;
          reward_type?: 'pro_extension' | 'credit' | 'cash' | null;
          reward_value?: number | null;
          conversion_date?: string | null;
          created_at?: string;
          expires_at?: string;
        };
      };
      funnel_events: {
        Row: {
          id: string;
          user_id: string | null;
          tenant_id: string | null;
          session_id: string;
          funnel_stage:
            | 'landing'
            | 'signup'
            | 'onboarding'
            | 'first_recipe'
            | 'recipe_feedback'
            | 'subscription'
            | 'activation'
            | 'retention'
            | 'churn';
          event_data: Record<string, unknown>;
          timestamp: string;
          page_url: string | null;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          session_id: string;
          funnel_stage:
            | 'landing'
            | 'signup'
            | 'onboarding'
            | 'first_recipe'
            | 'recipe_feedback'
            | 'subscription'
            | 'activation'
            | 'retention'
            | 'churn';
          event_data?: any;
          timestamp?: string;
          page_url?: string | null;
          referrer?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          session_id?: string;
          funnel_stage?:
            | 'landing'
            | 'signup'
            | 'onboarding'
            | 'first_recipe'
            | 'recipe_feedback'
            | 'subscription'
            | 'activation'
            | 'retention'
            | 'churn';
          event_data?: any;
          timestamp?: string;
          page_url?: string | null;
          referrer?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
        };
      };
      ab_test_experiments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          hypothesis: string | null;
          status: 'draft' | 'running' | 'paused' | 'completed';
          start_date: string | null;
          end_date: string | null;
          traffic_allocation: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          hypothesis?: string | null;
          status?: 'draft' | 'running' | 'paused' | 'completed';
          start_date?: string | null;
          end_date?: string | null;
          traffic_allocation?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          hypothesis?: string | null;
          status?: 'draft' | 'running' | 'paused' | 'completed';
          start_date?: string | null;
          end_date?: string | null;
          traffic_allocation?: number;
          created_by?: string | null;
          created_at?: string;
        };
      };
      ab_test_variants: {
        Row: {
          id: string;
          experiment_id: string;
          name: string;
          description: string | null;
          configuration: any;
          traffic_weight: number;
          is_control: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          experiment_id: string;
          name: string;
          description?: string | null;
          configuration: any;
          traffic_weight?: number;
          is_control?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          experiment_id?: string;
          name?: string;
          description?: string | null;
          configuration?: any;
          traffic_weight?: number;
          is_control?: boolean;
          created_at?: string;
        };
      };
      ab_test_assignments: {
        Row: {
          id: string;
          experiment_id: string;
          variant_id: string;
          user_id: string | null;
          session_id: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          experiment_id: string;
          variant_id: string;
          user_id?: string | null;
          session_id?: string | null;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          experiment_id?: string;
          variant_id?: string;
          user_id?: string | null;
          session_id?: string | null;
          assigned_at?: string;
        };
      };
      ai_copy_logs: {
        Row: {
          id: string;
          content_type:
            | 'landing_headline'
            | 'email_subject'
            | 'feature_copy'
            | 'cta_button'
            | 'social_post';
          variant_name: string;
          content: string;
          performance_metrics: any;
          is_winner: boolean;
          test_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type:
            | 'landing_headline'
            | 'email_subject'
            | 'feature_copy'
            | 'cta_button'
            | 'social_post';
          variant_name: string;
          content: string;
          performance_metrics?: any;
          is_winner?: boolean;
          test_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_type?:
            | 'landing_headline'
            | 'email_subject'
            | 'feature_copy'
            | 'cta_button'
            | 'social_post';
          variant_name?: string;
          content?: string;
          performance_metrics?: any;
          is_winner?: boolean;
          test_id?: string | null;
          created_at?: string;
        };
      };
      social_posts: {
        Row: {
          id: string;
          platform: 'twitter' | 'tiktok' | 'threads' | 'instagram' | 'linkedin';
          content: string;
          media_urls: string[] | null;
          hashtags: string[] | null;
          scheduled_for: string | null;
          published_at: string | null;
          status: 'draft' | 'scheduled' | 'published' | 'failed';
          performance_metrics: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform: 'twitter' | 'tiktok' | 'threads' | 'instagram' | 'linkedin';
          content: string;
          media_urls?: string[] | null;
          hashtags?: string[] | null;
          scheduled_for?: string | null;
          published_at?: string | null;
          status?: 'draft' | 'scheduled' | 'published' | 'failed';
          performance_metrics?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform?:
            | 'twitter'
            | 'tiktok'
            | 'threads'
            | 'instagram'
            | 'linkedin';
          content?: string;
          media_urls?: string[] | null;
          hashtags?: string[] | null;
          scheduled_for?: string | null;
          published_at?: string | null;
          status?: 'draft' | 'scheduled' | 'published' | 'failed';
          performance_metrics?: any;
          created_at?: string;
        };
      };
      ugc_shares: {
        Row: {
          id: string;
          user_id: string | null;
          recipe_id: number | null;
          share_type: 'meal_card' | 'recipe' | 'achievement';
          platform: string;
          share_url: string | null;
          impressions: number;
          clicks: number;
          conversions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          recipe_id?: number | null;
          share_type: 'meal_card' | 'recipe' | 'achievement';
          platform: string;
          share_url?: string | null;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          recipe_id?: number | null;
          share_type?: 'meal_card' | 'recipe' | 'achievement';
          platform?: string;
          share_url?: string | null;
          impressions?: number;
          clicks?: number;
          conversions?: number;
          created_at?: string;
        };
      };
      churn_predictions: {
        Row: {
          id: string;
          user_id: string | null;
          tenant_id: string | null;
          churn_probability: number;
          risk_factors: any;
          recommended_actions: any;
          model_version: string;
          predicted_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          churn_probability: number;
          risk_factors?: any;
          recommended_actions?: any;
          model_version: string;
          predicted_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          churn_probability?: number;
          risk_factors?: any;
          recommended_actions?: any;
          model_version?: string;
          predicted_at?: string;
          expires_at?: string;
        };
      };
      winback_campaigns: {
        Row: {
          id: string;
          user_id: string | null;
          campaign_type: 'email' | 'push' | 'sms' | 'in_app';
          status:
            | 'pending'
            | 'sent'
            | 'opened'
            | 'clicked'
            | 'converted'
            | 'failed';
          content: any;
          sent_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          converted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          campaign_type: 'email' | 'push' | 'sms' | 'in_app';
          status?:
            | 'pending'
            | 'sent'
            | 'opened'
            | 'clicked'
            | 'converted'
            | 'failed';
          content: any;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          converted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          tenant_id?: string | null;
          campaign_type?: 'email' | 'push' | 'sms' | 'in_app';
          status?:
            | 'pending'
            | 'sent'
            | 'opened'
            | 'clicked'
            | 'converted'
            | 'failed';
          content?: any;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          converted_at?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_popular_ingredients: {
        Args: {
          limit_count?: number;
        };
        Returns: {
          ingredient: string;
          usage_count: number;
        }[];
      };
      get_cuisine_preferences: {
        Args: Record<PropertyKey, never>;
        Returns: {
          cuisine_type: string;
          preference_count: number;
        }[];
      };
      get_recipe_feedback_summary: {
        Args: {
          recipe_id_param: number;
        };
        Returns: {
          total_feedback: number;
          average_rating: number;
          thumbs_up_count: number;
          thumbs_down_count: number;
        }[];
      };
      update_recipe_feedback: {
        Args: {
          recipe_id_param: number;
          user_id_param: string;
          feedback_type_param: string;
          score_param?: number;
          feedback_text_param?: string;
        };
        Returns: number;
      };
    };
  };
};
