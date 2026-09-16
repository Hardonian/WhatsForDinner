// @ts-nocheck
/**
 * XML Catalog Feed Parser
 * Parses XML feeds (Google Merchant, RSS, custom formats)
 */

import { XMLParser } from 'fast-xml-parser';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('xml-ts');
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

interface XMLNode {
  [key: string]: unknown;
}

/**
 * Parse XML feed content
 */
export function parseXMLFeed(xmlContent: string): ParsedCatalogItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: true,
    parseNodeValue: true,
  });

  const parsed = parser.parse(xmlContent);
  
  // Support multiple formats
  if (parsed.feed?.entry) {
    // Atom feed format
    return parseAtomFeed(parsed);
  } else if (parsed.rss?.channel?.item) {
    // RSS format
    return parseRSSFeed(parsed);
  } else if (parsed.rss?.channel?.['rss:item']) {
    // RSS with namespace
    return parseRSSFeed({ rss: { channel: { item: parsed.rss.channel['rss:item'] } } });
  } else if (parsed.products?.product || Array.isArray(parsed.products)) {
    // Custom products format
    return parseProductsFormat(parsed);
  } else {
    // Try Google Merchant format
    return parseGoogleMerchantFormat(parsed);
  }
}

/**
 * Parse Atom feed format
 */
function parseAtomFeed(parsed: XMLNode): ParsedCatalogItem[] {
  const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
  
  return entries
    .map((entry: XMLNode) => {
      try {
        return parseAtomEntry(entry);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') { logger.warn('Failed to parse Atom entry', { error }); }
        return null;
      }
    })
    .filter((item): item is ParsedCatalogItem => item !== null);
}

function parseAtomEntry(entry: XMLNode): ParsedCatalogItem | null {
  const sku = entry.id?.['#text'] || entry['g:id'] || entry['g:sku'] || entry.id;
  if (!sku) return null;

  const title = entry.title?.['#text'] || entry['g:title'] || entry.title || '';
  if (!title) return null;

  const link = entry.link?.['@_href'] || entry.link || entry['g:link'];
  if (!link) return null;

  const price = entry['g:price'] || entry.price;
  let price_cents: number | undefined;
  let currency = 'USD';
  if (typeof price === 'string') {
    const match = price.match(/([\d.]+)\s*([A-Z]{3})?/i);
    if (match) {
      price_cents = Math.round(parseFloat(match[1]) * 100);
      currency = match[2]?.toUpperCase() || 'USD';
    }
  }

  const availability = parseAvailability(entry['g:availability'] || entry.availability || 'in stock');

  return {
    sku: String(sku),
    title: String(title),
    brand: entry['g:brand'] ? String(entry['g:brand']) : undefined,
    url: String(link),
    image_url: entry['g:image_link'] ? String(entry['g:image_link']) : undefined,
    price_cents,
    currency,
    availability,
    tags: entry['g:product_type'] ? [String(entry['g:product_type'])] : undefined,
  };
}

/**
 * Parse RSS feed format
 */
function parseRSSFeed(parsed: XMLNode): ParsedCatalogItem[] {
  const items = Array.isArray(parsed.rss.channel.item) 
    ? parsed.rss.channel.item 
    : [parsed.rss.channel.item];
  
  return items
    .map((item: XMLNode) => {
      try {
        const sku = item.guid?.['#text'] || item['g:id'] || item.guid || item.id;
        if (!sku) return null;

        const title = item.title?.['#text'] || item.title || '';
        if (!title) return null;

        const link = item.link?.['#text'] || item.link;
        if (!link) return null;

        const price = item['g:price'] || item.price;
        let price_cents: number | undefined;
        let currency = 'USD';
        if (typeof price === 'string') {
          const match = price.match(/([\d.]+)\s*([A-Z]{3})?/i);
          if (match) {
            price_cents = Math.round(parseFloat(match[1]) * 100);
            currency = match[2]?.toUpperCase() || 'USD';
          }
        }

        return {
          sku: String(sku),
          title: String(title),
          brand: item['g:brand'] ? String(item['g:brand']) : undefined,
          url: String(link),
          image_url: item['g:image_link'] || item.enclosure?.['@_url'] ? String(item['g:image_link'] || item.enclosure?.['@_url']) : undefined,
          price_cents,
          currency,
          availability: parseAvailability(item['g:availability'] || 'in stock'),
          tags: item.category ? [String(item.category)] : undefined,
        };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') { logger.warn('Failed to parse RSS item', { error }); }
        return null;
      }
    })
    .filter((item): item is ParsedCatalogItem => item !== null);
}

/**
 * Parse custom products format
 */
function parseProductsFormat(parsed: XMLNode): ParsedCatalogItem[] {
  const products = Array.isArray(parsed.products) 
    ? parsed.products 
    : parsed.products?.product 
    ? (Array.isArray(parsed.products.product) ? parsed.products.product : [parsed.products.product])
    : [];

  return products
    .map((product: XMLNode) => {
      try {
        const sku = product.sku || product.id || product['@_id'];
        if (!sku) return null;

        const title = product.title || product.name || '';
        if (!title) return null;

        const url = product.url || product.link;
        if (!url) return null;

        return {
          sku: String(sku),
          title: String(title),
          brand: product.brand ? String(product.brand) : undefined,
          url: String(url),
          image_url: product.image_url || product.image ? String(product.image_url || product.image) : undefined,
          price_cents: product.price_cents ? parseInt(String(product.price_cents), 10) : undefined,
          currency: (product.currency as string) || 'USD',
          availability: parseAvailability(product.availability || 'in stock'),
          tags: product.tags ? (Array.isArray(product.tags) ? product.tags.map(String) : [String(product.tags)]) : undefined,
        };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') { logger.warn('Failed to parse product', { error }); }
        return null;
      }
    })
    .filter((item): item is ParsedCatalogItem => item !== null);
}

/**
 * Parse Google Merchant XML format
 */
function parseGoogleMerchantFormat(parsed: XMLNode): ParsedCatalogItem[] {
  // Try to find items in various locations
  let items: XMLNode[] = [];
  
  if (parsed.channel?.item) {
    items = Array.isArray(parsed.channel.item) ? parsed.channel.item : [parsed.channel.item];
  } else if (parsed.item) {
    items = Array.isArray(parsed.item) ? parsed.item : [parsed.item];
  }

  return items
    .map((item: XMLNode) => parseAtomEntry(item))
    .filter((item): item is ParsedCatalogItem => item !== null);
}

/**
 * Parse availability string
 */
function parseAvailability(avail: string | unknown): 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' {
  const str = String(avail || '').toLowerCase().trim();
  
  if (str.includes('in stock') || str === 'available') {
    return 'in_stock';
  }
  if (str.includes('out of stock') || str === 'unavailable') {
    return 'out_of_stock';
  }
  if (str.includes('preorder') || str.includes('pre-order')) {
    return 'preorder';
  }
  if (str.includes('discontinued')) {
    return 'discontinued';
  }
  
  return 'in_stock';
}
