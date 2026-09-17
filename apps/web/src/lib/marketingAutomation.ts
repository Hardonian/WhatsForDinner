import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('marketingautomation');

import { Resend } from 'resend';
import { supabase } from './supabaseClient';
import { GrowthAnalytics } from './growthAnalytics';
import { validateInput } from './validation-guards';
import { fireAndForget } from './error-boundaries';
import {
  SendEmailSchema,
  SendRecipeEmailSchema,
  EmailCampaignSchema,
  type ValidatedSendEmail,
  type ValidatedSendRecipeEmail,
} from './marketing-schemas';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_placeholder_key');

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  trigger: 'signup' | 'first_recipe' | 'milestone' | 'churn_risk' | 'winback';
  delay_hours?: number;
  conditions?: Record<string, unknown>;
}

export interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  target_audience: {
    user_segments: string[];
    tenant_ids: string[];
    conditions: Record<string, unknown>;
  };
  schedule: {
    start_date: string;
    end_date?: string;
    timezone: string;
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export class MarketingAutomation {
  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    referralCode?: string
  ): Promise<void> {
    // Validate input
    const validated = validateInput(
      SendEmailSchema,
      { userEmail, userName, referralCode },
      'welcome email'
    );

    try {
      const template = await this.getEmailTemplate('welcome');
      if (!template) {
        _logger.error('Welcome email template not found');
        return;
      }

      const personalizedSubject = template.subject.replace(
        '{{name}}',
        validated.userName
      );
      const personalizedHtml = template.html
        .replace(/{{name}}/g, validated.userName)
        .replace(/{{referral_code}}/g, validated.referralCode || '');

      const { error } = await resend.emails.send({
        from: "What's for Dinner <welcome@whatsfordinner.ai>",
        to: [validated.userEmail],
        subject: personalizedSubject,
        html: personalizedHtml,
        text: template.text.replace(/{{name}}/g, validated.userName),
      });

      if (error) {
        // Error handled: Error sending welcome email:
        throw error;
      }

      // Track email sent event (fire-and-forget for non-critical operation)
      fireAndForget(
        () => this.trackEmailEvent('welcome', validated.userEmail, 'sent'),
        (error) => _logger.error('Failed to track email event:', { error: error instanceof Error ? error.message : String(error) })
      );
    } catch (error) {
      // Error handled: Failed to send welcome email:
      throw error;
    }
  }

  /**
   * Send first recipe celebration email
   */
  static async sendFirstRecipeEmail(
    userEmail: string,
    userName: string,
    recipeTitle: string
  ): Promise<void> {
    // Validate input
    const validated = validateInput(
      SendRecipeEmailSchema,
      { userEmail, userName, recipeTitle },
      'first recipe email'
    );

    try {
      const template = await this.getEmailTemplate('first_recipe');
      if (!template) {
        _logger.error('First recipe email template not found');
        return;
      }

      const personalizedSubject = template.subject.replace(
        '{{recipe_title}}',
        recipeTitle
      );
      const personalizedHtml = template.html
        .replace(/{{name}}/g, userName)
        .replace(/{{recipe_title}}/g, recipeTitle);

      const { error } = await resend.emails.send({
        from: "What's for Dinner <recipes@whatsfordinner.ai>",
        to: [userEmail],
        subject: personalizedSubject,
        html: personalizedHtml,
        text: template.text
          .replace(/{{name}}/g, userName)
          .replace(/{{recipe_title}}/g, recipeTitle),
      });

      if (error) {
        // Error handled: Error sending first recipe email:
        throw error;
      }

      await this.trackEmailEvent('first_recipe', userEmail, 'sent');
    } catch (error) {
      // Error handled: Failed to send first recipe email:
      throw error;
    }
  }

  /**
   * Send milestone celebration email
   */
  static async sendMilestoneEmail(
    userEmail: string,
    userName: string,
    milestone: string,
    milestoneValue: number
  ): Promise<void> {
    try {
      const template = await this.getEmailTemplate('milestone');
      if (!template) {
        _logger.error('Milestone email template not found');
        return;
      }

      const personalizedSubject = template.subject.replace(
        '{{milestone}}',
        milestone
      );
      const personalizedHtml = template.html
        .replace(/{{name}}/g, userName)
        .replace(/{{milestone}}/g, milestone)
        .replace(/{{value}}/g, milestoneValue.toString());

      const { error } = await resend.emails.send({
        from: "What's for Dinner <milestones@whatsfordinner.ai>",
        to: [userEmail],
        subject: personalizedSubject,
        html: personalizedHtml,
        text: template.text
          .replace(/{{name}}/g, userName)
          .replace(/{{milestone}}/g, milestone)
          .replace(/{{value}}/g, milestoneValue.toString()),
      });

      if (error) {
        // Error handled: Error sending milestone email:
        throw error;
      }

      await this.trackEmailEvent('milestone', userEmail, 'sent');
    } catch (error) {
      // Error handled: Failed to send milestone email:
      throw error;
    }
  }

  /**
   * Send churn risk winback email
   */
  static async sendChurnRiskEmail(
    userEmail: string,
    userName: string,
    personalizedOffer?: string
  ): Promise<void> {
    try {
      const template = await this.getEmailTemplate('churn_risk');
      if (!template) {
        _logger.error('Churn risk email template not found');
        return;
      }

      const personalizedSubject = template.subject;
      const personalizedHtml = template.html
        .replace(/{{name}}/g, userName)
        .replace(/{{offer}}/g, personalizedOffer || '20% off your next month');

      const { error } = await resend.emails.send({
        from: "What's for Dinner <team@whatsfordinner.ai>",
        to: [userEmail],
        subject: personalizedSubject,
        html: personalizedHtml,
        text: template.text
          .replace(/{{name}}/g, userName)
          .replace(
            /{{offer}}/g,
            personalizedOffer || '20% off your next month'
          ),
      });

      if (error) {
        // Error handled: Error sending churn risk email:
        throw error;
      }

      await this.trackEmailEvent('churn_risk', userEmail, 'sent');
    } catch (error) {
      // Error handled: Failed to send churn risk email:
      throw error;
    }
  }

  /**
   * Send winback email to churned users
   */
  static async sendWinbackEmail(
    userEmail: string,
    userName: string,
    lastActiveDate: string,
    specialOffer?: string
  ): Promise<void> {
    try {
      const template = await this.getEmailTemplate('winback');
      if (!template) {
        _logger.error('Winback email template not found');
        return;
      }

      const daysSinceLastActive = Math.floor(
        (Date.now() - new Date(lastActiveDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const personalizedSubject = template.subject;
      const personalizedHtml = template.html
        .replace(/{{name}}/g, userName)
        .replace(/{{days}}/g, daysSinceLastActive.toString())
        .replace(/{{offer}}/g, specialOffer || '50% off your first month back');

      const { error } = await resend.emails.send({
        from: "What's for Dinner <welcome-back@whatsfordinner.ai>",
        to: [userEmail],
        subject: personalizedSubject,
        html: personalizedHtml,
        text: template.text
          .replace(/{{name}}/g, userName)
          .replace(/{{days}}/g, daysSinceLastActive.toString())
          .replace(
            /{{offer}}/g,
            specialOffer || '50% off your first month back'
          ),
      });

      if (error) {
        // Error handled: Error sending winback email:
        throw error;
      }

      await this.trackEmailEvent('winback', userEmail, 'sent');
    } catch (error) {
      // Error handled: Failed to send winback email:
      throw error;
    }
  }

  /**
   * Get email template by name
   */
  static async getEmailTemplate(
    templateName: string
  ): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', templateName)
        .single();

      if (error) {
        // Error handled: Error fetching email template:
        return null;
      }

      return data;
    } catch (error) {
      // Error handled: Failed to get email template:
      return null;
    }
  }

  /**
   * Create email template
   */
  static async createEmailTemplate(
    template: Omit<EmailTemplate, 'id'>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select('id')
        .single();

      if (error) {
        // Error handled: Error creating email template:
        throw error;
      }

      return data.id;
    } catch (error) {
      // Error handled: Failed to create email template:
      throw error;
    }
  }

  /**
   * Track email event
   */
  static async trackEmailEvent(
    emailType: string,
    userEmail: string,
    event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced'
  ): Promise<void> {
    try {
      const { error } = await supabase.from('email_events').insert({
        email_type: emailType,
        user_email: userEmail,
        event,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        // Error handled: Error tracking email event:
        throw error;
      }
    } catch (error) {
      // Error handled: Failed to track email event:
      throw error;
    }
  }

  /**
   * Process automated email triggers
   */
  static async processEmailTriggers(): Promise<void> {
    try {
      // Get users who signed up but haven't created their first recipe
      const { data: newUsers, error: newUsersError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('created_at', new Date().toISOString().split('T')[0]); // Today's signups

      if (newUsersError) {
        _logger.error('Error fetching new users:', { newUsersError });
        return;
      }

      // Send welcome emails to new users
      for (const user of newUsers || []) {
        if (user.email) {
          await this.sendWelcomeEmail(user.email, user.name || 'Friend');
        }
      }

      // Get users who created their first recipe today
      const { data: firstRecipeUsers, error: firstRecipeError } = await supabase
        .from('recipes')
        .select('user_id, title, profiles!inner(email, name)')
        .eq('created_at', new Date().toISOString().split('T')[0]);

      if (firstRecipeError) {
        _logger.error('Error fetching first recipe users:', { firstRecipeError });
        return;
      }

      // Send first recipe celebration emails
      for (const recipe of firstRecipeUsers || []) {
        const profile = recipe.profiles as any;
        if (profile?.email) {
          await this.sendFirstRecipeEmail(
            profile.email,
            profile.name || 'Friend',
            recipe.title
          );
        }
      }

      // Get users at milestones (10, 25, 50, 100 recipes)
      const { data: milestoneUsers, error: milestoneError } = await supabase
        .from('recipes')
        .select('user_id, count, profiles!inner(email, name)')
        .eq('count', 10); // 10th recipe milestone

      if (milestoneError) {
        _logger.error('Error fetching milestone users:', { milestoneError });
        return;
      }

      // Send milestone emails
      for (const user of milestoneUsers || []) {
        const profile = user.profiles as any;
        if (profile?.email) {
          await this.sendMilestoneEmail(
            profile.email,
            profile.name || 'Friend',
            '10th Recipe',
            10
          );
        }
      }
    } catch (error) {
      // Error handled: Failed to process email triggers:
      throw error;
    }
  }

  /**
   * Create email campaign
   */
  static async createEmailCampaign(
    campaign: Omit<EmailCampaign, 'id' | 'metrics'>
  ): Promise<string> {
    try {
      const campaignData = {
        ...campaign,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
        },
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert(campaignData)
        .select('id')
        .single();

      if (error) {
        // Error handled: Error creating email campaign:
        throw error;
      }

      return data.id;
    } catch (error) {
      // Error handled: Failed to create email campaign:
      throw error;
    }
  }

  /**
   * Execute email campaign
   */
  static async executeEmailCampaign(campaignId: string): Promise<void> {
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        _logger.error('Error fetching campaign:', { campaignError });
        return;
      }

      if (campaign.status !== 'scheduled') {
        _logger.error('Campaign is not in scheduled status');
        return;
      }

      // Get target users based on campaign criteria
      const { data: targetUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email, name')
        .in('tenant_id', campaign.target_audience.tenant_ids);

      if (usersError) {
        _logger.error('Error fetching target users:', { usersError });
        return;
      }

      // Get email template
      const template = await this.getEmailTemplate(campaign.template_id);
      if (!template) {
        _logger.error('Email template not found');
        return;
      }

      // Send emails to target users
      let sentCount = 0;
      for (const user of targetUsers || []) {
        if (user.email) {
          try {
            const personalizedSubject = template.subject.replace(
              '{{name}}',
              user.name || 'Friend'
            );
            const personalizedHtml = template.html.replace(
              /{{name}}/g,
              user.name || 'Friend'
            );

            const { error: sendError } = await resend.emails.send({
              from: "What's for Dinner <campaigns@whatsfordinner.ai>",
              to: [user.email],
              subject: personalizedSubject,
              html: personalizedHtml,
              text: template.text.replace(/{{name}}/g, user.name || 'Friend'),
            });

            if (!sendError) {
              sentCount++;
              await this.trackEmailEvent('campaign', user.email, 'sent');
            }
          } catch (error) {
            // Error handled: Error sending campaign email:
          }
        }
      }

      // Update campaign metrics
      await supabase
        .from('email_campaigns')
        .update({
          status: 'running',
          metrics: {
            ...campaign.metrics,
            sent: campaign.metrics.sent + sentCount,
          },
        })
        .eq('id', campaignId);
    } catch (error) {
      // Error handled: Failed to execute email campaign:
      throw error;
    }
  }

  /**
   * Get campaign performance metrics
   */
  static async getCampaignMetrics(
    campaignId: string
  ): Promise<EmailCampaign['metrics'] | null> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('metrics')
        .eq('id', campaignId)
        .single();

      if (error) {
        // Error handled: Error fetching campaign metrics:
        return null;
      }

      return data.metrics;
    } catch (error) {
      // Error handled: Failed to get campaign metrics:
      return null;
    }
  }
}
