import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('grocery-manager');

/**
 * Grocery Manager
 * Central manager for all grocery store integrations
 */

import { GroceryStoreAdapter, GroceryStore, ProductSearchParams, ProductSearchResult, GroceryCart, GroceryCartItem, GroceryCategory, GroceryConfig } from './types';
import { LoblawsAdapter } from './stores/loblaws-adapter';
import { MetroAdapter } from './stores/metro-adapter';
import { SobeysAdapter } from './stores/sobeys-adapter';
import { WalmartAdapter } from './stores/walmart-adapter';

export class GroceryManager {
  private adapters: Map<string, GroceryStoreAdapter> = new Map();
  private config: GroceryConfig;

  constructor(config?: Partial<GroceryConfig>) {
    // Initialize adapters
    const loblaws = new LoblawsAdapter();
    const metro = new MetroAdapter();
    const sobeys = new SobeysAdapter();
    const walmart = new WalmartAdapter();

    this.adapters.set('loblaws', loblaws);
    this.adapters.set('metro', metro);
    this.adapters.set('sobeys', sobeys);
    this.adapters.set('walmart', walmart);

    // Load config from API or use defaults
    this.config = {
      stores: Array.from(this.adapters.values()).map(a => a.store),
      defaultStore: config?.defaultStore || 'walmart',
      enablePriceComparison: config?.enablePriceComparison ?? true,
      enableNotifications: config?.enableNotifications ?? true,
      syncFrequency: config?.syncFrequency || 'hourly',
    };
  }

  async initialize(): Promise<void> {
    // Validate all store connections
    for (const [id, adapter] of this.adapters) {
      try {
        const isValid = await adapter.validateConnection();
        if (!isValid) {
          _logger.warn('Store ${id} connection validation failed');
        }
      } catch (error) {
        _logger.error('Error validating store ${id}:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  getStores(): GroceryStore[] {
    return Array.from(this.adapters.values())
      .map(a => a.store)
      .filter(s => s.enabled);
  }

  getStore(storeId: string): GroceryStoreAdapter | undefined {
    return this.adapters.get(storeId);
  }

  async searchAllStores(params: ProductSearchParams): Promise<Map<string, ProductSearchResult>> {
    const results = new Map<string, ProductSearchResult>();
    
    const searchPromises = Array.from(this.adapters.entries())
      .filter(([_, adapter]) => adapter.store.enabled)
      .map(async ([storeId, adapter]) => {
        try {
          const result = await adapter.searchProducts(params);
          results.set(storeId, result);
        } catch (error) {
          _logger.error('Error searching ${storeId}:', { error: error instanceof Error ? error.message : String(error) });
        }
      });

    await Promise.allSettled(searchPromises);
    return results;
  }

  async comparePrices(query: string): Promise<Map<string, ProductSearchResult>> {
    if (!this.config.enablePriceComparison) {
      throw new Error('Price comparison is disabled');
    }

    return this.searchAllStores({ query, limit: 5 });
  }

  async addToCart(storeId: string, items: GroceryCartItem[]): Promise<GroceryCart> {
    const adapter = this.adapters.get(storeId);
    if (!adapter) {
      throw new Error(`Store ${storeId} not found`);
    }

    return adapter.addToCart(items);
  }

  async getCategories(storeId?: string): Promise<GroceryCategory[]> {
    if (storeId) {
      const adapter = this.adapters.get(storeId);
      if (!adapter) {
        throw new Error(`Store ${storeId} not found`);
      }
      return adapter.getCategories();
    }

    // Return merged categories from all stores
    const allCategories = new Map<string, GroceryCategory>();
    
    for (const adapter of this.adapters.values()) {
      if (adapter.store.enabled) {
        const categories = await adapter.getCategories();
        categories.forEach(cat => {
          if (!allCategories.has(cat.id)) {
            allCategories.set(cat.id, cat);
          }
        });
      }
    }

    return Array.from(allCategories.values());
  }

  getConfig(): GroceryConfig {
    return this.config;
  }

  async updateConfig(updates: Partial<GroceryConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Save to API/database
    // TODO: Implement config persistence
  }
}

export const groceryManager = new GroceryManager();
