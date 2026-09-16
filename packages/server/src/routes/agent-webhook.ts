// @ts-nocheck
/**
 * Agent Integration Webhook Router
 * Handles webhooks from AI agents (MindStudio, Zapier, n8n, etc.)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash, createHmac } from 'crypto';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('agent-webhook-ts');
interface WebhookPayload {
  source: string;
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

interface AgentConfig {
  name: string;
  webhookSecret: string;
  enabled: boolean;
  events: string[];
}

export class AgentWebhookRouter {
  private agents: Map<string, AgentConfig> = new Map();

  constructor() {
    this.initializeAgents();
  }

  /**
   * Initialize agent configurations
   */
  private initializeAgents(): void {
    // MindStudio
    this.agents.set('mindstudio', {
      name: 'MindStudio',
      webhookSecret: process.env.MINDSTUDIO_WEBHOOK_SECRET || '',
      enabled: process.env.MINDSTUDIO_ENABLED === 'true',
      events: ['meal.suggested', 'recipe.generated', 'user.feedback'],
    });

    // Zapier
    this.agents.set('zapier', {
      name: 'Zapier',
      webhookSecret: process.env.ZAPIER_WEBHOOK_SECRET || '',
      enabled: process.env.ZAPIER_ENABLED === 'true',
      events: ['meal.plan.created', 'grocery.list.updated'],
    });

    // n8n
    this.agents.set('n8n', {
      name: 'n8n',
      webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
      enabled: process.env.N8N_ENABLED === 'true',
      events: ['recipe.viewed', 'user.action'],
    });
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' = 'sha256'
  ): boolean {
    const hmac = createHmac(algorithm, secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Handle different signature formats
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    return expectedSignature === cleanSignature;
  }

  /**
 * Handle incoming webhook
 */
  async handleWebhook(
    request: FastifyRequest<{ Body: WebhookPayload; Querystring: { agent?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const agentName = request.query.agent || request.body.source;
    const agent = this.agents.get(agentName.toLowerCase());

    if (!agent) {
      reply.code(400).send({ error: 'Unknown agent' });
      return;
    }

    if (!agent.enabled) {
      reply.code(403).send({ error: 'Agent webhooks disabled' });
      return;
    }

    // Verify signature
    const rawBody = JSON.stringify(request.body);
    const signature = request.headers['x-webhook-signature'] as string || request.body.signature;

    if (signature && agent.webhookSecret) {
      const isValid = this.verifySignature(rawBody, signature, agent.webhookSecret);
      if (!isValid) {
        reply.code(401).send({ error: 'Invalid signature' });
        return;
      }
    }

    // Validate event type
    if (!agent.events.includes(request.body.event)) {
      reply.code(400).send({ error: `Event ${request.body.event} not allowed for ${agent.name}` });
      return;
    }

    // Route to appropriate handler
    try {
      await this.routeEvent(agent.name, request.body);
      reply.code(200).send({ success: true });
    } catch (error) {
      logger.error('Webhook processing failed for ${agent.name}:', { error });
      reply.code(500).send({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Route event to appropriate handler
   */
  private async routeEvent(agentName: string, payload: WebhookPayload): Promise<void> {
    const { event, data } = payload;

    // Event router
    switch (event) {
      case 'meal.suggested':
        await this.handleMealSuggestion(agentName, data);
        break;
      case 'recipe.generated':
        await this.handleRecipeGeneration(agentName, data);
        break;
      case 'meal.plan.created':
        await this.handleMealPlanCreated(agentName, data);
        break;
      case 'grocery.list.updated':
        await this.handleGroceryListUpdated(agentName, data);
        break;
      default:
        logger.info('Unhandled event: ${event} from ${agentName}');
    }
  }

  /**
   * Handle meal suggestion from agent
   */
  private async handleMealSuggestion(agentName: string, data: any): Promise<void> {
    logger.info('Meal suggestion from ${agentName}:', { data });
    // Implement meal suggestion handling
  }

  /**
   * Handle recipe generation from agent
   */
  private async handleRecipeGeneration(agentName: string, data: any): Promise<void> {
    logger.info('Recipe generation from ${agentName}:', { data });
    // Implement recipe generation handling
  }

  /**
   * Handle meal plan created event
   */
  private async handleMealPlanCreated(agentName: string, data: any): Promise<void> {
    logger.info('Meal plan created event from ${agentName}:', { data });
    // Implement meal plan handling
  }

  /**
   * Handle grocery list updated event
   */
  private async handleGroceryListUpdated(agentName: string, data: any): Promise<void> {
    logger.info('Grocery list updated event from ${agentName}:', { data });
    // Implement grocery list handling
  }

  /**
   * Register webhook endpoint
   */
  registerRoutes(app: any): void {
    app.post('/api/webhooks/agent', async (request: FastifyRequest, reply: FastifyReply) => {
      await this.handleWebhook(request as any, reply);
    });

    app.post('/api/webhooks/agent/:agent', async (request: FastifyRequest, reply: FastifyReply) => {
      await this.handleWebhook(request as any, reply);
    });
  }
}

export const agentWebhookRouter = new AgentWebhookRouter();
