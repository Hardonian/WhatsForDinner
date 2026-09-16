import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('walmart-adapter');

/**
 * Walmart Canada Grocery Store Adapter
 * Integration for Walmart Canada grocery delivery
 * 
 * API Keys Required:
 * - WALMART_API_KEY (Walmart Open API - free tier available)
 * - WALMART_AFFILIATE_ID (Walmart Affiliate Program)
 * 
 * Note: Walmart has a public API with free tier
 * https://developer.walmartlabs.com/
 */

import { BaseGroceryAdapter } from './base-adapter';
import { GroceryStore, ProductSearchParams, ProductSearchResult, GroceryCart, GroceryCartItem, GroceryCategory, GroceryStoreFeature } from '../types';

export class WalmartAdapter extends BaseGroceryAdapter {
  private readonly apiBaseUrl = 'https://api.walmartlabs.com/v1';

  constructor() {
    super({
      id: 'walmart',
      name: 'walmart',
      displayName: 'Walmart Canada',
      baseUrl: 'https://www.walmart.ca',
      enabled: !!process.env.NEXT_PUBLIC_WALMART_ENABLED,
      requiresAuth: false,
      apiKey: process.env.NEXT_PUBLIC_WALMART_API_KEY,
      supportedFeatures: [
        GroceryStoreFeature.PRODUCT_SEARCH,
        GroceryStoreFeature.CART_ADD,
        GroceryStoreFeature.PRICE_COMPARISON,
      ],
      region: 'CA',
      affiliateId: process.env.NEXT_PUBLIC_WALMART_AFFILIATE_ID,
      commissionRate: 4.0,
    });
  }

  async searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
    if (!this.store.apiKey) {
      throw new Error('Walmart API key is required. Get free key at https://developer.walmartlabs.com/');
    }

    try {
      const url = new URL(`${this.apiBaseUrl}/search`);
      url.searchParams.set('apiKey', this.store.apiKey);
      url.searchParams.set('query', params.query);
      url.searchParams.set('format', 'json');
      if (params.limit) {
        url.searchParams.set('numItems', params.limit.toString());
      }

      const response = await this.makeRequest(url.toString());
      if (!response.ok) {
        throw new Error(`Walmart API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const products = (data.items || []).map((item: any) => ({
        id: `walmart-${item.itemId}`,
        storeId: this.store.id,
        name: item.name,
        brand: item.brandName,
        description: item.shortDescription,
        price: item.salePrice || item.msrp || 0,
        currency: 'CAD',
        imageUrl: item.largeImage || item.mediumImage,
        category: {
          id: item.categoryPath?.split('/').pop() || 'general',
          name: item.categoryPath?.split('/').pop() || 'general',
          displayName: item.categoryPath?.split('/').pop() || 'General',
        },
        inStock: item.availableOnline,
        stockLevel: item.availableOnline ? 'in_stock' : 'out_of_stock',
        salePrice: item.salePrice,
      }));

      return {
        products,
        total: data.totalResults || products.length,
        page: data.pageNumber || 1,
        pageSize: params.limit || 20,
      };
    } catch (error) {
      _logger.error('Walmart API error:', { error: error instanceof Error ? error.message : String(error) });
      // Fallback to affiliate link generation
      return this.searchViaAffiliate(params);
    }
  }

  private async searchViaAffiliate(params: ProductSearchParams): Promise<ProductSearchResult> {
    const searchUrl = `${this.store.baseUrl}/en/search?q=${encodeURIComponent(params.query)}`;
    
    return {
      products: [
        {
          id: `walmart-${params.query}-1`,
          storeId: this.store.id,
          name: params.query,
          price: 0,
          currency: 'CAD',
          category: {
            id: 'general',
            name: 'general',
            displayName: 'General',
          },
          inStock: true,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 1,
    };
  }

  async addToCart(items: GroceryCartItem[]): Promise<GroceryCart> {
    const cartId = `walmart-${Date.now()}`;
    const itemIds = items.map(item => item.productId.replace('walmart-', ''));
    const affiliateParam = this.store.affiliateId ? `&affiliate=${this.store.affiliateId}` : '';
    const checkoutUrl = `${this.store.baseUrl}/en/cart?items=${itemIds.join(',')}${affiliateParam}`;

    return {
      id: cartId,
      storeId: this.store.id,
      userId: '',
      items,
      total: items.reduce((sum, item) => sum + item.totalPrice, 0),
      currency: 'CAD',
      checkoutUrl,
      createdAt: new Date().toISOString(),
    };
  }

  async getCart(cartId: string): Promise<GroceryCart> {
    // Walmart API doesn't support cart retrieval without user session
    throw new Error('Cart retrieval requires user authentication');
  }

  async getCategories(): Promise<GroceryCategory[]> {
    return [
      { id: 'produce', name: 'produce', displayName: 'Produce', icon: '🥬', color: '#4CAF50' },
      { id: 'meat', name: 'meat', displayName: 'Meat & Seafood', icon: '🥩', color: '#F44336' },
      { id: 'dairy', name: 'dairy', displayName: 'Dairy & Eggs', icon: '🥛', color: '#2196F3' },
      { id: 'bakery', name: 'bakery', displayName: 'Bakery', icon: '🍞', color: '#FF9800' },
      { id: 'frozen', name: 'frozen', displayName: 'Frozen Foods', icon: '❄️', color: '#00BCD4' },
      { id: 'pantry', name: 'pantry', displayName: 'Pantry Staples', icon: '🥫', color: '#9C27B0' },
      { id: 'snacks', name: 'snacks', displayName: 'Snacks & Beverages', icon: '🍪', color: '#FF5722' },
      { id: 'health', name: 'health', displayName: 'Health & Beauty', icon: '💊', color: '#E91E63' },
    ];
  }

  async validateConnection(): Promise<boolean> {
    if (this.store.apiKey) {
      try {
        // Test API connection with a simple search
        const result = await this.searchProducts({ query: 'test', limit: 1 });
        return result.products.length >= 0; // API responded
      } catch {
        return false;
      }
    }
    return !!this.store.affiliateId;
  }
}
