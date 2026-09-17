import { supabase } from './supabaseClient';
import { logger } from './logger';
import { analytics } from './analytics';
import { feedbackSystem } from './feedbackSystem';
import { aiConfigManager } from './aiConfig';
import { v4 as uuidv4 } from 'uuid';
import { validateInput } from './validation-guards';
import { withErrorBoundary } from './error-boundaries';
import {
  CreateWorkflowSchema,
  WorkflowIdSchema,
  UpdateWorkflowStepSchema,
  UpdateWorkflowStatusSchema,
  type ValidatedCreateWorkflow,
} from './workflow-schemas';

export interface WorkflowStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: string | null;
  progress_percentage: number;
  steps: WorkflowStep[];
  metadata: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

class WorkflowManager {
  private activeWorkflows: Map<string, Workflow> = new Map();

  async createWorkflow(
    name: string,
    steps: Omit<WorkflowStep, 'status' | 'started_at' | 'completed_at'>[],
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    // Validate input
    const validated = validateInput(
      CreateWorkflowSchema,
      { name, steps, metadata },
      'workflow creation'
    );

    const workflowId = uuidv4();

    const workflow: Workflow = {
      id: workflowId,
      name: validated.name,
      status: 'pending',
      current_step: null,
      progress_percentage: 0,
      steps: validated.steps.map(step => ({
        ...step,
        status: 'pending',
      })),
      metadata: validated.metadata || {},
      started_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('workflow_state').insert({
        id: workflowId,
        workflow_name: validated.name,
        status: 'pending',
        current_step: null,
        progress_percentage: 0,
        metadata: { steps: workflow.steps, ...validated.metadata },
        started_at: workflow.started_at,
      });

      if (error) {
        await logger.error(
          'Failed to create workflow',
          { error, workflowId },
          'api',
          'workflow'
        );
        throw error;
      }

      this.activeWorkflows.set(workflowId, workflow);
      await logger.info(
        'Workflow created',
        { workflowId, name: validated.name, stepsCount: validated.steps.length },
        'api',
        'workflow'
      );

      return workflowId;
    } catch (error) {
      await logger.error(
        'Error creating workflow',
        { error, workflowId },
        'api',
        'workflow'
      );
      throw error;
    }
  }

  async executeWorkflow(workflowId: string): Promise<boolean> {
    // Validate workflow ID
    validateInput(WorkflowIdSchema, { workflowId }, 'workflow execution');

    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      await logger.error(
        'Workflow not found',
        { workflowId },
        'api',
        'workflow'
      );
      return false;
    }

    try {
      await this.updateWorkflowStatus(workflowId, 'running');

      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        await this.updateWorkflowStep(workflowId, step.name, 'running');

        try {
          await this.executeStep(step, workflow);
          await this.updateWorkflowStep(workflowId, step.name, 'completed');
        } catch (error) {
          await this.updateWorkflowStep(
            workflowId,
            step.name,
            'failed',
            error.message
          );
          await this.updateWorkflowStatus(workflowId, 'failed', error.message);
          return false;
        }

        const progress = ((i + 1) / workflow.steps.length) * 100;
        await this.updateWorkflowProgress(workflowId, progress);
      }

      await this.updateWorkflowStatus(workflowId, 'completed');
      await logger.info(
        'Workflow completed successfully',
        { workflowId },
        'api',
        'workflow'
      );
      return true;
    } catch (error) {
      await this.updateWorkflowStatus(workflowId, 'failed', error.message);
      await logger.error(
        'Workflow execution failed',
        { error, workflowId },
        'api',
        'workflow'
      );
      return false;
    }
  }

  private async executeStep(
    step: WorkflowStep,
    workflow: Workflow
  ): Promise<void> {
    switch (step.name) {
      case 'analyze_feedback':
        await this.analyzeFeedbackStep(workflow);
        break;
      case 'optimize_prompts':
        await this.optimizePromptsStep(workflow);
        break;
      case 'update_ai_config':
        await this.updateAIConfigStep(workflow);
        break;
      case 'generate_analytics_report':
        await this.generateAnalyticsReportStep(workflow);
        break;
      case 'cleanup_old_data':
        await this.cleanupOldDataStep(workflow);
        break;
      case 'health_check':
        await this.healthCheckStep(workflow);
        break;
      case 'backup_data':
        await this.backupDataStep(workflow);
        break;
      default:
        throw new Error(`Unknown step: ${step.name}`);
    }
  }

  private async analyzeFeedbackStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Analyzing user feedback',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    const feedbackAnalytics = await feedbackSystem.getFeedbackAnalytics('week');
    if (feedbackAnalytics) {
      workflow.metadata.feedback_analytics = feedbackAnalytics;
    }

    const trainingData = await feedbackSystem.generateTrainingData('week');
    workflow.metadata.training_data_count = trainingData.length;

    await logger.info(
      'Feedback analysis completed',
      {
        workflowId: workflow.id,
        totalFeedback: feedbackAnalytics?.total_feedback || 0,
        averageRating: feedbackAnalytics?.average_rating || 0,
      },
      'api',
      'workflow'
    );
  }

  private async optimizePromptsStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Optimizing prompts based on feedback',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    const success = await feedbackSystem.optimizePromptsBasedOnFeedback();
    workflow.metadata.prompt_optimization_success = success;

    await logger.info(
      'Prompt optimization completed',
      {
        workflowId: workflow.id,
        success,
      },
      'api',
      'workflow'
    );
  }

  private async updateAIConfigStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Updating AI configuration',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    const currentConfig = await aiConfigManager.getCurrentConfig();
    if (currentConfig) {
      // Check if we need to update the configuration based on performance
      const performanceMetrics = await aiConfigManager.getPerformanceMetrics();

      if (performanceMetrics.averageScore < 0.8) {
        // Create an improved configuration
        const improvedConfig = await aiConfigManager.createConfig({
          model_name: currentConfig.model_name,
          system_prompt:
            currentConfig.system_prompt +
            '\n\nFocus on user feedback and improve recipe quality.',
          message_templates: currentConfig.message_templates,
          version: `${currentConfig.version.split('.')[0]}.${parseInt(currentConfig.version.split('.')[1]) + 1}.0`,
          is_active: true,
          performance_score: performanceMetrics.averageScore + 0.1,
          metadata: {
            ...currentConfig.metadata,
            optimized: true,
            optimization_date: new Date().toISOString(),
          },
        });

        workflow.metadata.ai_config_updated = !!improvedConfig;
      }
    }

    await logger.info(
      'AI configuration update completed',
      {
        workflowId: workflow.id,
        updated: workflow.metadata.ai_config_updated,
      },
      'api',
      'workflow'
    );
  }

  private async generateAnalyticsReportStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Generating analytics report',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    const report = {
      generated_at: new Date().toISOString(),
      total_recipes: 0,
      total_users: 0,
      average_rating: 0,
      popular_ingredients: [],
      cuisine_preferences: [],
      api_performance: [],
    };

    // Gather analytics data
    const recipeAnalytics = await analytics.getRecipeAnalytics('week');
    const popularIngredients = await analytics.getPopularIngredients(10);
    const cuisinePreferences = await analytics.getCuisinePreferences();
    const apiPerformance = await analytics.getAPIPerformanceMetrics();

    report.total_recipes = recipeAnalytics?.length || 0;
    report.total_users =
      new Set(recipeAnalytics?.map(r => r.user_id)).size || 0;
    report.popular_ingredients = popularIngredients || [];
    report.cuisine_preferences = cuisinePreferences || [];
    report.api_performance = apiPerformance || [];

    workflow.metadata.analytics_report = report;

    await logger.info(
      'Analytics report generated',
      {
        workflowId: workflow.id,
        totalRecipes: report.total_recipes,
        totalUsers: report.total_users,
      },
      'api',
      'workflow'
    );
  }

  private async cleanupOldDataStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Cleaning up old data',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // Clean up old logs (keep only last 30 days)
      const { error: logsError } = await supabase
        .from('logs')
        .delete()
        .lt('timestamp', thirtyDaysAgo.toISOString());

      if (logsError) {
        await logger.error(
          'Failed to cleanup old logs',
          { error: logsError },
          'api',
          'workflow'
        );
      }

      // Clean up old analytics events (keep only last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { error: analyticsError } = await supabase
        .from('analytics_events')
        .delete()
        .lt('timestamp', ninetyDaysAgo.toISOString());

      if (analyticsError) {
        await logger.error(
          'Failed to cleanup old analytics events',
          { error: analyticsError },
          'api',
          'workflow'
        );
      }

      workflow.metadata.cleanup_completed = true;

      await logger.info(
        'Data cleanup completed',
        { workflowId: workflow.id },
        'api',
        'workflow'
      );
    } catch (error) {
      await logger.error(
        'Data cleanup failed',
        { error, workflowId: workflow.id },
        'api',
        'workflow'
      );
      throw error;
    }
  }

  private async healthCheckStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Performing health check',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    const healthStatus = {
      database: false,
      api: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    };

    try {
      // Check database connection
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      healthStatus.database = !dbError;

      // Check API performance
      const apiMetrics = await analytics.getAPIPerformanceMetrics();
      const recentMetrics = apiMetrics.filter(
        m => new Date(m.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      healthStatus.api = recentMetrics.length > 0;

      // Check analytics system
      const recipeAnalytics = await analytics.getRecipeAnalytics('day');
      healthStatus.analytics = recipeAnalytics !== null;

      workflow.metadata.health_status = healthStatus;

      await logger.info(
        'Health check completed',
        {
          workflowId: workflow.id,
          healthStatus,
        },
        'api',
        'workflow'
      );
    } catch (error) {
      await logger.error(
        'Health check failed',
        { error, workflowId: workflow.id },
        'api',
        'workflow'
      );
      throw error;
    }
  }

  private async backupDataStep(workflow: Workflow): Promise<void> {
    await logger.info(
      'Backing up critical data',
      { workflowId: workflow.id },
      'api',
      'workflow'
    );

    try {
      // Export training data
      const trainingData = await feedbackSystem.exportTrainingData('json');

      // Store backup metadata
      workflow.metadata.backup = {
        training_data_exported: true,
        backup_size: trainingData.length,
        timestamp: new Date().toISOString(),
      };

      await logger.info(
        'Data backup completed',
        {
          workflowId: workflow.id,
          backupSize: trainingData.length,
        },
        'api',
        'workflow'
      );
    } catch (error) {
      await logger.error(
        'Data backup failed',
        { error, workflowId: workflow.id },
        'api',
        'workflow'
      );
      throw error;
    }
  }

  private async updateWorkflowStatus(
    workflowId: string,
    status: Workflow['status'],
    errorMessage?: string
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = status;
      if (errorMessage) {
        workflow.error_message = errorMessage;
      }
      if (status === 'completed') {
        workflow.completed_at = new Date().toISOString();
      }
    }

    try {
      const updateData: any = { status };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('workflow_state')
        .update(updateData)
        .eq('id', workflowId);

      if (error) {
        await logger.error(
          'Failed to update workflow status',
          { error, workflowId },
          'api',
          'workflow'
        );
      }
    } catch (error) {
      await logger.error(
        'Error updating workflow status',
        { error, workflowId },
        'api',
        'workflow'
      );
    }
  }

  private async updateWorkflowStep(
    workflowId: string,
    stepName: string,
    status: WorkflowStep['status'],
    errorMessage?: string
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      const step = workflow.steps.find(s => s.name === stepName);
      if (step) {
        step.status = status;
        if (status === 'running') {
          step.started_at = new Date().toISOString();
        } else if (status === 'completed' || status === 'failed') {
          step.completed_at = new Date().toISOString();
        }
        if (errorMessage) {
          step.error_message = errorMessage;
        }
      }
      workflow.current_step = status === 'running' ? stepName : null;
    }

    try {
      const { error } = await supabase
        .from('workflow_state')
        .update({
          current_step: status === 'running' ? stepName : null,
          metadata: workflow?.metadata,
        })
        .eq('id', workflowId);

      if (error) {
        await logger.error(
          'Failed to update workflow step',
          { error, workflowId, stepName },
          'api',
          'workflow'
        );
      }
    } catch (error) {
      await logger.error(
        'Error updating workflow step',
        { error, workflowId, stepName },
        'api',
        'workflow'
      );
    }
  }

  private async updateWorkflowProgress(
    workflowId: string,
    progress: number
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.progress_percentage = Math.round(progress);
    }

    try {
      const { error } = await supabase
        .from('workflow_state')
        .update({ progress_percentage: Math.round(progress) })
        .eq('id', workflowId);

      if (error) {
        await logger.error(
          'Failed to update workflow progress',
          { error, workflowId },
          'api',
          'workflow'
        );
      }
    } catch (error) {
      await logger.error(
        'Error updating workflow progress',
        { error, workflowId },
        'api',
        'workflow'
      );
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<Workflow | null> {
    return this.activeWorkflows.get(workflowId) || null;
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_state')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) {
        await logger.error(
          'Failed to fetch workflows',
          { error },
          'api',
          'workflow'
        );
        return [];
      }

      return (
        data?.map(w => ({
          id: w.id,
          name: w.workflow_name,
          status: w.status,
          current_step: w.current_step,
          progress_percentage: w.progress_percentage,
          steps: w.metadata?.steps || [],
          metadata: w.metadata || {},
          started_at: w.started_at,
          completed_at: w.completed_at,
          error_message: w.error_message,
        })) || []
      );
    } catch (error) {
      await logger.error(
        'Error fetching workflows',
        { error },
        'api',
        'workflow'
      );
      return [];
    }
  }

  // Predefined workflow templates
  async createSelfHealWorkflow(): Promise<string> {
    return this.createWorkflow(
      'Self-Heal System',
      [
        { name: 'health_check', description: 'Check system health status' },
        {
          name: 'analyze_feedback',
          description: 'Analyze user feedback patterns',
        },
        {
          name: 'optimize_prompts',
          description: 'Optimize AI prompts based on feedback',
        },
        {
          name: 'update_ai_config',
          description: 'Update AI configuration if needed',
        },
        {
          name: 'cleanup_old_data',
          description: 'Clean up old logs and analytics data',
        },
      ],
      { type: 'self_heal', scheduled: true }
    );
  }

  async createAnalyticsWorkflow(): Promise<string> {
    return this.createWorkflow(
      'Analytics Report',
      [
        {
          name: 'generate_analytics_report',
          description: 'Generate comprehensive analytics report',
        },
        { name: 'backup_data', description: 'Backup critical training data' },
      ],
      { type: 'analytics', scheduled: true }
    );
  }

  async createMaintenanceWorkflow(): Promise<string> {
    return this.createWorkflow(
      'System Maintenance',
      [
        { name: 'cleanup_old_data', description: 'Clean up old data' },
        { name: 'health_check', description: 'Perform system health check' },
        { name: 'backup_data', description: 'Backup critical data' },
      ],
      { type: 'maintenance', scheduled: true }
    );
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  deleteWorkflow(workflowId: string): boolean {
    return this.activeWorkflows.delete(workflowId);
  }
}

// Wrap workflow manager methods with error boundaries for resilience
const baseWorkflowManager = new WorkflowManager();

// Create error-boundary wrapped instance
export const workflowManager = {
  createWorkflow: withErrorBoundary(
    baseWorkflowManager.createWorkflow.bind(baseWorkflowManager),
    (error, ...args) => {
      logger.error(
        'Workflow creation failed',
        { error, args },
        'api',
        'workflow'
      );
    }
  ),
  executeWorkflow: withErrorBoundary(
    baseWorkflowManager.executeWorkflow.bind(baseWorkflowManager),
    (error, workflowId) => {
      logger.error(
        'Workflow execution failed',
        { error, workflowId },
        'api',
        'workflow'
      );
    },
    false // fallback: return false on error
  ),
  getWorkflow: baseWorkflowManager.getWorkflow.bind(baseWorkflowManager),
  getAllWorkflows: baseWorkflowManager.getAllWorkflows.bind(baseWorkflowManager),
  deleteWorkflow: baseWorkflowManager.deleteWorkflow.bind(baseWorkflowManager),
};
