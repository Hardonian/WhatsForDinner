// @ts-nocheck
/**
 * CSV Catalog Feed Parser
 * Parses CSV feeds (Google Merchant format compatible)
 */
import { parse } from 'csv-parse/sync';
import { createComponentLogger } from '@whats-for-dinner/utils';
const logger = createComponentLogger('csv-ts');
/**
 * Parse CSV content into catalog items
 */
export function parseCSVFeed(csvContent, options) {
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: options?.skipEmptyLines ?? true,
        delimiter: options?.delimiter || ',',
    });
    return records
        .map((row) => {
        try {
            return parseCSVRow(row);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                logger.warn('Failed to parse CSV row', { error, row });
            }
            return null;
        }
    })
        .filter((item) => item !== null);
}
/**
 * Parse a single CSV row into a catalog item
 */
function parseCSVRow(row) {
    // Support Google Merchant format fields:
    // id, title, description, link, image_link, price, availability, brand, etc.
    const sku = row.id || row.sku || row['item_id'] || row['product_id'];
    if (!sku) {
        return null;
    }
    const title = row.title || row.name || '';
    if (!title) {
        return null;
    }
    const url = row.link || row.url || '';
    if (!url) {
        return null;
    }
    // Parse price
    let price_cents;
    let currency = 'USD';
    if (row.price) {
        // Google format: "USD 19.99" or "19.99 USD" or just "19.99"
        const priceMatch = row.price.match(/([\d.]+)\s*([A-Z]{3})?/i);
        if (priceMatch) {
            const amount = parseFloat(priceMatch[1]);
            price_cents = Math.round(amount * 100);
            currency = priceMatch[2]?.toUpperCase() || 'USD';
        }
    }
    // Parse availability
    const availability = parseAvailability(row.availability || row.stock_status || 'in stock');
    // Parse tags (from category, product_type, etc.)
    const tags = [];
    if (row.category)
        tags.push(row.category);
    if (row.product_type)
        tags.push(row.product_type);
    if (row.tags) {
        const tagList = row.tags.split(',').map((t) => t.trim());
        tags.push(...tagList);
    }
    return {
        sku,
        title,
        brand: row.brand || undefined,
        url,
        image_url: row.image_link || row.image_url || row.image || undefined,
        price_cents,
        currency,
        availability,
        tags: tags.length > 0 ? tags : undefined,
    };
}
/**
 * Parse availability string to enum
 */
function parseAvailability(avail) {
    const normalized = avail.toLowerCase().trim();
    if (normalized.includes('in stock') || normalized === 'available') {
        return 'in_stock';
    }
    if (normalized.includes('out of stock') || normalized === 'unavailable') {
        return 'out_of_stock';
    }
    if (normalized.includes('preorder') || normalized.includes('pre-order')) {
        return 'preorder';
    }
    if (normalized.includes('discontinued')) {
        return 'discontinued';
    }
    return 'in_stock'; // Default
}
