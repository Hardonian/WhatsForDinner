// @ts-nocheck
import { GET as mealPlanGet, POST as mealPlanPost } from '../meal-plan/generate/route';
import { GET as invoiceGet, POST as invoicePost } from '../billing/invoice/route';
import { GET as refundGet, POST as refundPost } from '../billing/refund/route';
import { GET as recipesGet, POST as recipesPost } from '../recipes/route';
import { GET as pantryGet, POST as pantryPost, PUT as pantryPut, DELETE as pantryDelete } from '../pantry/route';

describe('SaaS Platform Productization API Routes', () => {
  describe('Meal Plan Generation API (/api/meal-plan/generate)', () => {
    it('generates a full 7-day meal plan with shopping list on POST', async () => {
      const req = new Request('http://localhost:3000/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            familySize: 3,
            dietaryRestrictions: ['gluten-free'],
          },
        }),
      });
      const res = await mealPlanPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.mealPlan).toBeDefined();
      expect(data.mealPlan.days.length).toBe(7);
      expect(data.mealPlan.shoppingList.length).toBeGreaterThan(0);
      expect(data.mealPlan.totalCost).toBeGreaterThan(0);
    });

    it('generates single recipe with quickMode for surprise-me', async () => {
      const req = new Request('http://localhost:3000/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: 'quick',
          quickMode: true,
        }),
      });
      const res = await mealPlanPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBeDefined();
      expect(data.ingredients.length).toBeGreaterThan(0);
      expect(data.instructions.length).toBeGreaterThan(0);
      expect(data.cookTime).toBeDefined();
    });
  });

  describe('Billing Invoices API (/api/billing/invoice)', () => {
    it('returns list of invoices on GET', async () => {
      const req = new Request('http://localhost:3000/api/billing/invoice', {
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await invoiceGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.invoices.length).toBeGreaterThan(0);
      expect(data.invoices[0].amount).toBeDefined();
      expect(data.invoices[0].status).toBe('paid');
    });

    it('downloads PDF receipt when format=pdf', async () => {
      const req = new Request('http://localhost:3000/api/billing/invoice?format=pdf', {
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await invoiceGet(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toContain('attachment');
    });

    it('creates new invoice on POST', async () => {
      const req = new Request('http://localhost:3000/api/billing/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 19.99,
          customer_email: 'newuser@chef.com',
          plan_name: 'WhatsForDinner Family Tier',
        }),
      });
      const res = await invoicePost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.invoice.amount).toBe(19.99);
    });
  });

  describe('Billing Refunds API (/api/billing/refund)', () => {
    it('returns refund history on GET', async () => {
      const req = new Request('http://localhost:3000/api/billing/refund', {
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await refundGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.refunds)).toBe(true);
    });

    it('submits a refund request on POST', async () => {
      const req = new Request('http://localhost:3000/api/billing/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: 'sub_test_123',
          reason: 'Switching to annual plan',
          amount: 9.99,
        }),
      });
      const res = await refundPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.refund.status).toBe('pending');
      expect(data.refund.amount).toBe(9.99);
    });
  });

  describe('Recipes API (/api/recipes)', () => {
    it('returns curated recipes list with pagination', async () => {
      const req = new Request('http://localhost:3000/api/recipes?limit=5');
      const res = await recipesGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipes.length).toBeGreaterThan(0);
      expect(data.pagination.page).toBe(1);
    });

    it('searches recipes by keyword query', async () => {
      const req = new Request('http://localhost:3000/api/recipes?q=salmon');
      const res = await recipesGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recipes.some(r => r.title.toLowerCase().includes('salmon'))).toBe(true);
    });

    it('creates a custom community recipe on POST', async () => {
      const req = new Request('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Lemon Herb Butter Ribeye',
          ingredients: ['Ribeye steak', 'Butter', 'Fresh rosemary', 'Garlic'],
          instructions: ['Sear in smoking cast iron skillet for 4 minutes per side.', 'Baste with herb butter.'],
          cookTime: '15 min',
          servings: 2,
        }),
      });
      const res = await recipesPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recipe.title).toBe('Lemon Herb Butter Ribeye');
    });
  });

  describe('Pantry API (/api/pantry)', () => {
    it('returns pantry items list on GET', async () => {
      const req = new Request('http://localhost:3000/api/pantry');
      const res = await pantryGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.metrics.totalItems).toBeGreaterThan(0);
    });

    it('adds a new ingredient to pantry on POST', async () => {
      const req = new Request('http://localhost:3000/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Shallots',
          quantity: 4,
          unit: 'bulbs',
          category: 'Produce',
          daysRemaining: 14,
        }),
      });
      const res = await pantryPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.item.name).toBe('Shallots');
    });

    it('updates item quantity on PUT', async () => {
      const req = new Request('http://localhost:3000/api/pantry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          quantity: 5,
        }),
      });
      const res = await pantryPut(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.item.quantity).toBe(5);
    });

    it('deletes item from pantry on DELETE', async () => {
      const req = new Request('http://localhost:3000/api/pantry?id=1', {
        method: 'DELETE',
      });
      const res = await pantryDelete(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.removedItem).toBeDefined();
    });
  });
});
