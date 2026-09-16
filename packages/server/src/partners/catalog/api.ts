// @ts-nocheck
/**
 * REST API Catalog Feed Parser
 * Handles paginated JSON API responses
 */

export interface ParsedCatalogItem {
  sku: string;
  title: string;
  brand?: string;
  url: string;
  image_url?: string;
  price_cents?: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued';
  tags?: string[];
}

export interface APIFeedConfig {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  pagination?: {
    type: 'offset' | 'cursor' | 'page';
    limit?: number;
    offsetParam?: string;
    cursorParam?: string;
    pageParam?: string;
    hasMoreField?: string;
    nextCursorField?: string;
  };
  transform?: (item: unknown) => ParsedCatalogItem | null;
}

/**
 * Fetch and parse API feed with pagination
 */
export async function fetchAPIFeed(
  config: APIFeedConfig,
  fetchFn: typeof fetch = fetch,
): Promise<ParsedCatalogItem[]> {
  const items: ParsedCatalogItem[] = [];
  let hasMore = true;
  let offset = 0;
  let cursor: string | null = null;
  let page = 1;

  while (hasMore) {
    const url = new URL(config.url);
    
    // Add pagination params
    if (config.pagination) {
      if (config.pagination.type === 'offset') {
        url.searchParams.set(config.pagination.offsetParam || 'offset', String(offset));
        if (config.pagination.limit) {
          url.searchParams.set('limit', String(config.pagination.limit));
        }
      } else if (config.pagination.type === 'cursor' && cursor) {
        url.searchParams.set(config.pagination.cursorParam || 'cursor', cursor);
        if (config.pagination.limit) {
          url.searchParams.set('limit', String(config.pagination.limit));
        }
      } else if (config.pagination.type === 'page') {
        url.searchParams.set(config.pagination.pageParam || 'page', String(page));
        if (config.pagination.limit) {
          url.searchParams.set('limit', String(config.pagination.limit));
        }
      }
    }

    // Add additional params
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const response = await fetchFn(url.toString(), {
      method: config.method || 'GET',
      headers: config.headers || {},
    });

    if (!response.ok) {
      throw new Error(`API feed fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse items
    let batch: unknown[];
    if (Array.isArray(data)) {
      batch = data;
      hasMore = false; // No pagination info
    } else if (Array.isArray(data.items)) {
      batch = data.items;
      hasMore = data[config.pagination?.hasMoreField || 'has_more'] || false;
      cursor = data[config.pagination?.nextCursorField || 'next_cursor'] || null;
    } else if (Array.isArray(data.products)) {
      batch = data.products;
      hasMore = data.has_more || false;
    } else {
      throw new Error('Unexpected API response format');
    }

    // Transform items
    const transformed = batch
      .map((item) => {
        if (config.transform) {
          return config.transform(item);
        }
        return transformDefault(item);
      })
      .filter((item): item is ParsedCatalogItem => item !== null);

    items.push(...transformed);

    // Update pagination state
    if (config.pagination?.type === 'offset') {
      offset += batch.length;
      if (batch.length === 0) {
        hasMore = false;
      }
    } else if (config.pagination?.type === 'page') {
      page++;
      if (batch.length === 0 || !hasMore) {
        hasMore = false;
      }
    } else if (config.pagination?.type === 'cursor') {
      if (!cursor || batch.length === 0) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }

    // Safety limit
    if (items.length > 10000) {
      break;
    }
  }

  return items;
}

/**
 * Default transformer for common API formats
 */
function transformDefault(item: unknown): ParsedCatalogItem | null {
  if (typeof item !== 'object' || item === null) {
    return null;
  }

  const obj = item as Record<string, unknown>;

  const sku = obj.sku || obj.id || obj.product_id || obj.item_id;
  if (!sku) {
    return null;
  }

  const title = obj.title || obj.name || obj.product_name;
  if (!title) {
    return null;
  }

  const url = obj.url || obj.link || obj.product_url || obj.permalink;
  if (!url) {
    return null;
  }

  // Parse price
  let price_cents: number | undefined;
  let currency = 'USD';
  
  if (obj.price_cents) {
    price_cents = typeof obj.price_cents === 'number' ? obj.price_cents : parseInt(String(obj.price_cents), 10);
  } else if (obj.price) {
    const price = typeof obj.price === 'number' ? obj.price : parseFloat(String(obj.price));
    price_cents = Math.round(price * 100);
  }

  if (obj.currency) {
    currency = String(obj.currency).toUpperCase();
  }

  // Parse availability
  let availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' = 'in_stock';
  if (obj.availability) {
    const avail = String(obj.availability).toLowerCase();
    if (avail.includes('in stock') || avail === 'available') {
      availability = 'in_stock';
    } else if (avail.includes('out of stock') || avail === 'unavailable') {
      availability = 'out_of_stock';
    } else if (avail.includes('preorder')) {
      availability = 'preorder';
    } else if (avail.includes('discontinued')) {
      availability = 'discontinued';
    }
  } else if (obj.in_stock !== undefined) {
    availability = obj.in_stock ? 'in_stock' : 'out_of_stock';
  }

  // Parse tags
  const tags: string[] = [];
  if (obj.tags && Array.isArray(obj.tags)) {
    tags.push(...obj.tags.map(String));
  } else if (obj.category) {
    tags.push(String(obj.category));
  } else if (obj.categories && Array.isArray(obj.categories)) {
    tags.push(...obj.categories.map(String));
  }

  return {
    sku: String(sku),
    title: String(title),
    brand: obj.brand ? String(obj.brand) : undefined,
    url: String(url),
    image_url: obj.image_url || obj.image || obj.thumbnail ? String(obj.image_url || obj.image || obj.thumbnail) : undefined,
    price_cents,
    currency,
    availability,
    tags: tags.length > 0 ? tags : undefined,
  };
}
