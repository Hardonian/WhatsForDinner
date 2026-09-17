// @ts-nocheck
/**
 * Agent Integration Webhook Router
 * Handles webhooks from AI agents (MindStudio, Zapier, n8n, etc.)
 */
import { createHmac } from 'crypto';
import { createComponentLogger } from '@whats-for-dinner/utils';
const logger = createComponentLogger('agent-webhook-ts');
export class AgentWebhookRouter {
    agents = new Map();
    constructor() {
        this.initializeAgents();
    }
    /**
     * Initialize agent configurations
     */
    initializeAgents() {
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
    verifySignature(payload, signature, secret, algorithm = 'sha256') {
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
    async handleWebhook(request, reply) {
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
        const signature = request.headers['x-webhook-signature'] || request.body.signature;
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
        }
        catch (error) {
            logger.error('Webhook processing failed for ${agent.name}:', { error });
            reply.code(500).send({ error: 'Webhook processing failed' });
        }
    }
    /**
     * Route event to appropriate handler
     */
    async routeEvent(agentName, payload) {
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
    async handleMealSuggestion(agentName, data) {
        logger.info('Meal suggestion from ${agentName}:', { data });
        // Implement meal suggestion handling
    }
    /**
     * Handle recipe generation from agent
     */
    async handleRecipeGeneration(agentName, data) {
        logger.info('Recipe generation from ${agentName}:', { data });
        // Implement recipe generation handling
    }
    /**
     * Handle meal plan created event
     */
    async handleMealPlanCreated(agentName, data) {
        logger.info('Meal plan created event from ${agentName}:', { data });
        // Implement meal plan handling
    }
    /**
     * Handle grocery list updated event
     */
    async handleGroceryListUpdated(agentName, data) {
        logger.info('Grocery list updated event from ${agentName}:', { data });
        // Implement grocery list handling
    }
    /**
     * Register webhook endpoint
     */
    registerRoutes(app) {
        app.post('/api/webhooks/agent', async (request, reply) => {
            await this.handleWebhook(request, reply);
        });
        app.post('/api/webhooks/agent/:agent', async (request, reply) => {
            await this.handleWebhook(request, reply);
        });
    }
}
export const agentWebhookRouter = new AgentWebhookRouter();
