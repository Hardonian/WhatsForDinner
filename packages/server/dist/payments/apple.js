// @ts-nocheck
/**
 * Apple App Store Receipt Verification
 * Uses App Store Server API (JWT/JWS) for validation
 */
import { logger } from '../observability/index';
/**
 * Verify Apple receipt using App Store Server API
 *
 * In production:
 * 1. Exchange receipt for validation token (App Store Server API v2)
 * 2. Verify JWT signature
 * 3. Parse transaction data
 * 4. Check subscription status
 */
export async function verifyAppleReceipt(request) {
    try {
        const { receipt, transactionId, productId, userId } = request;
        // Determine if receipt is legacy (base64) or JWT (new API)
        const isJWT = receipt.includes('.') && receipt.split('.').length === 3;
        if (isJWT) {
            // Use App Store Server API v2 (JWT)
            return await verifyJWTReceipt(receipt, transactionId, productId, userId);
        }
        else {
            // Legacy receipt validation
            return await verifyLegacyReceipt(receipt, transactionId, productId, userId);
        }
    }
    catch (error) {
        logger.error({ error, userId: request.userId }, 'Apple receipt verification failed');
        return null;
    }
}
/**
 * Verify JWT receipt (App Store Server API v2)
 */
async function verifyJWTReceipt(receipt, transactionId, productId, userId) {
    try {
        // In production, use @apple/app-store-server-library
        // For now, decode JWT manually
        const [header, payload, signature] = receipt.split('.');
        // Decode payload
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
        // Verify signature (in production, use proper JWT verification)
        // For now, we'll trust the payload structure
        // Extract transaction data
        const transactionInfo = decodedPayload.transactionInfo || decodedPayload.signedTransactionInfo;
        if (!transactionInfo) {
            logger.warn({ userId }, 'No transaction info in JWT receipt');
            return null;
        }
        // Decode transaction info if it's nested
        let transaction;
        if (typeof transactionInfo === 'string') {
            transaction = JSON.parse(Buffer.from(transactionInfo, 'base64url').toString('utf-8'));
        }
        else {
            transaction = transactionInfo;
        }
        // Verify transaction matches request
        if (transactionId && transaction.transactionId !== transactionId) {
            logger.warn({ userId, expected: transactionId, actual: transaction.transactionId }, 'Transaction ID mismatch');
            return null;
        }
        if (productId && transaction.productId !== productId) {
            logger.warn({ userId, expected: productId, actual: transaction.productId }, 'Product ID mismatch');
            return null;
        }
        // Check subscription status
        const expiresDate = transaction.expiresDate;
        const isActive = expiresDate ? new Date(expiresDate).getTime() > Date.now() : false;
        return {
            plan: mapProductIdToPlan(transaction.productId),
            productId: transaction.productId,
            transactionId: transaction.transactionId,
            isActive,
            expiresAt: expiresDate ? new Date(expiresDate).getTime() : undefined,
            originalTransactionId: transaction.originalTransactionId,
        };
    }
    catch (error) {
        logger.error({ error, userId }, 'JWT receipt verification error');
        return null;
    }
}
/**
 * Verify legacy receipt (base64)
 */
async function verifyLegacyReceipt(receipt, transactionId, productId, userId) {
    try {
        // In production, use App Store Server API or verifyReceipt endpoint
        // For sandbox: https://sandbox.itunes.apple.com/verifyReceipt
        // For production: https://buy.itunes.apple.com/verifyReceipt
        const sharedSecret = process.env.APPLE_SHARED_SECRET;
        if (!sharedSecret) {
            logger.error({ userId }, 'APPLE_SHARED_SECRET not configured');
            return null;
        }
        const verifyUrl = process.env.NODE_ENV === 'production'
            ? 'https://buy.itunes.apple.com/verifyReceipt'
            : 'https://sandbox.itunes.apple.com/verifyReceipt';
        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'receipt-data': receipt,
                password: sharedSecret,
                'exclude-old-transactions': true,
            }),
        });
        if (!response.ok) {
            logger.error({ userId, status: response.status }, 'Receipt verification request failed');
            return null;
        }
        const data = await response.json();
        if (data.status !== 0) {
            logger.warn({ userId, status: data.status }, 'Receipt verification failed');
            return null;
        }
        // Find latest receipt info
        const latestReceiptInfo = data.latest_receipt_info || data.receipt?.in_app?.[0];
        if (!latestReceiptInfo) {
            logger.warn({ userId }, 'No receipt info found');
            return null;
        }
        // Get most recent transaction
        const receipts = Array.isArray(latestReceiptInfo) ? latestReceiptInfo : [latestReceiptInfo];
        const sortedReceipts = receipts.sort((a, b) => parseInt(b.purchase_date_ms || '0', 10) - parseInt(a.purchase_date_ms || '0', 10));
        const transaction = sortedReceipts[0];
        // Verify transaction matches
        if (transactionId && transaction.transaction_id !== transactionId) {
            return null;
        }
        if (productId && transaction.product_id !== productId) {
            return null;
        }
        // Check expiration
        const expiresMs = parseInt(transaction.expires_date_ms || '0', 10);
        const isActive = expiresMs > Date.now();
        return {
            plan: mapProductIdToPlan(transaction.product_id),
            productId: transaction.product_id,
            transactionId: transaction.transaction_id,
            isActive,
            expiresAt: expiresMs || undefined,
            originalTransactionId: transaction.original_transaction_id,
        };
    }
    catch (error) {
        logger.error({ error, userId }, 'Legacy receipt verification error');
        return null;
    }
}
/**
 * Map product ID to plan
 */
function mapProductIdToPlan(productId) {
    if (productId.includes('month')) {
        return 'premium_monthly';
    }
    if (productId.includes('year')) {
        return 'premium_annual';
    }
    return 'premium_monthly'; // default
}
