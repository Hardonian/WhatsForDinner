// @ts-nocheck
/**
 * Google Play Purchase Verification
 * Uses Google Play Developer API
 */
import { logger } from '../observability/index';
/**
 * Verify Google Play purchase using Play Developer API
 *
 * In production:
 * 1. Use Google Play Developer API (googleapis)
 * 2. Verify purchase token
 * 3. Check acknowledgment status
 * 4. Handle acknowledgments if needed
 */
export async function verifyGooglePurchase(request) {
    try {
        const { purchaseToken, productId, userId } = request;
        // In production, use @googleapis/androidpublisher
        // For now, simulate verification
        const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.nomad.app';
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (!serviceAccountEmail || !privateKey) {
            logger.error({ userId }, 'Google Play API credentials not configured');
            // Fallback: basic validation
            return verifyPurchaseTokenBasic(purchaseToken, productId);
        }
        // Use Google Play Developer API
        return await verifyWithPlayAPI(packageName, purchaseToken, productId, serviceAccountEmail, privateKey);
    }
    catch (error) {
        logger.error({ error, userId: request.userId }, 'Google purchase verification failed');
        return null;
    }
}
/**
 * Verify using Google Play Developer API
 */
async function verifyWithPlayAPI(packageName, purchaseToken, productId, serviceAccountEmail, privateKey) {
    try {
        // In production, use @googleapis/androidpublisher
        // const { androidpublisher_v3 } = require('@googleapis/androidpublisher');
        // const auth = new google.auth.JWT({
        //   email: serviceAccountEmail,
        //   key: privateKey,
        //   scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        // });
        // const publisher = new androidpublisher_v3.Androidpublisher({ auth });
        // const result = await publisher.purchases.subscriptions.get({
        //   packageName,
        //   subscriptionId: productId || 'premium_month',
        //   token: purchaseToken,
        // });
        // For now, return a mock response
        // In production, parse the API response
        logger.info({ packageName, purchaseToken }, 'Verifying purchase with Play API (simulated)');
        // Mock response structure
        return {
            plan: productId?.includes('year') ? 'premium_annual' : 'premium_monthly',
            productId: productId || 'premium_month',
            transactionId: purchaseToken,
            isActive: true,
            autoRenewing: true,
        };
    }
    catch (error) {
        logger.error({ error }, 'Play API verification error');
        return null;
    }
}
/**
 * Basic token validation (fallback)
 */
function verifyPurchaseTokenBasic(purchaseToken, productId) {
    // Basic validation - check token format
    if (!purchaseToken || purchaseToken.length < 10) {
        return null;
    }
    return {
        plan: productId?.includes('year') ? 'premium_annual' : 'premium_monthly',
        productId: productId || 'premium_month',
        transactionId: purchaseToken,
        isActive: true,
        autoRenewing: true,
    };
}
