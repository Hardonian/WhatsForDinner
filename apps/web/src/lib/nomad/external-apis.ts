import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('external-apis');

/**
 * External API Integrations for Nomad
 * - Nutrition APIs (Edamam, Nutritionix, Open Food Facts)
 * - Wearables (Google Fit, Apple Health)
 * - Ad Networks (AdMob)
 */

// ============================================
// NUTRITION APIs
// ============================================

interface NutritionData {
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  servingSize?: string;
  image?: string;
  brand?: string;
}

/**
 * Open Food Facts - Free barcode lookup
 */
export async function getNutritionFromBarcode(
  barcode: string
): Promise<NutritionData | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Open Food Facts');
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      return {
        name: product.product_name || product.product_name_en || 'Unknown',
        calories: product.nutriments?.['energy-kcal_100g'] || null,
        protein: product.nutriments?.['proteins_100g'] || null,
        carbs: product.nutriments?.['carbohydrates_100g'] || null,
        fat: product.nutriments?.['fat_100g'] || null,
        fiber: product.nutriments?.['fiber_100g'] || null,
        image: product.image_url || null,
        brand: product.brands || null,
      };
    }

    return null;
  } catch (error) {
    // Error handled: Open Food Facts API error:
    return null;
  }
}

/**
 * Edamam Nutrition API
 */
export async function getNutritionFromEdamam(
  query: string
): Promise<NutritionData | null> {
  const appId = process.env.NEXT_PUBLIC_EDAMAM_APP_ID;
  const appKey = process.env.NEXT_PUBLIC_EDAMAM_API_KEY;

  if (!appId || !appKey) {
    if (process.env.NODE_ENV === 'development') { _logger.warn('Edamam API credentials not configured'); }
    return null;
  }

  try {
    const response = await fetch(
      `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Edamam');
    }

    const data = await response.json();

    return {
      name: query,
      calories: data.calories || null,
      protein: data.totalNutrients?.PROCNT?.quantity || null,
      carbs: data.totalNutrients?.CHOCDF?.quantity || null,
      fat: data.totalNutrients?.FAT?.quantity || null,
      fiber: data.totalNutrients?.FIBTG?.quantity || null,
    };
  } catch (error) {
    // Error handled: Edamam API error:
    return null;
  }
}

/**
 * Nutritionix API
 */
export async function getNutritionFromNutritionix(
  query: string
): Promise<NutritionData | null> {
  const appId = process.env.NEXT_PUBLIC_NUTRITIONIX_APP_ID;
  const apiKey = process.env.NEXT_PUBLIC_NUTRITIONIX_API_KEY;

  if (!appId || !apiKey) {
    if (process.env.NODE_ENV === 'development') { _logger.warn('Nutritionix API credentials not configured'); }
    return null;
  }

  try {
    const response = await fetch(
      'https://trackapi.nutritionix.com/v2/search/instant',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': appId,
          'x-app-key': apiKey,
        },
        body: JSON.stringify({
          query,
          timezone: 'US/Eastern',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Nutritionix');
    }

    const data = await response.json();

    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      return {
        name: food.food_name,
        calories: food.nf_calories || null,
        protein: food.nf_protein || null,
        carbs: food.nf_total_carbohydrate || null,
        fat: food.nf_total_fat || null,
        fiber: food.nf_dietary_fiber || null,
        servingSize: food.serving_qty
          ? `${food.serving_qty} ${food.serving_unit}`
          : undefined,
      };
    }

    return null;
  } catch (error) {
    // Error handled: Nutritionix API error:
    return null;
  }
}

/**
 * Unified nutrition lookup - tries multiple sources
 */
export async function getNutritionData(
  query: string,
  barcode?: string
): Promise<NutritionData | null> {
  // If barcode provided, try Open Food Facts first
  if (barcode) {
    const barcodeData = await getNutritionFromBarcode(barcode);
    if (barcodeData) return barcodeData;
  }

  // Try Nutritionix (more comprehensive)
  const nutritionixData = await getNutritionFromNutritionix(query);
  if (nutritionixData) return nutritionixData;

  // Fallback to Edamam
  const edamamData = await getNutritionFromEdamam(query);
  if (edamamData) return edamamData;

  return null;
}

// ============================================
// WEARABLES - Google Fit
// ============================================

interface GoogleFitConfig {
  clientId: string;
  apiKey: string;
}

/**
 * Initialize Google Fit OAuth
 */
export function initGoogleFitAuth(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google Fit Client ID not configured');
  }

  const redirectUri = `${window.location.origin}/api/nomad/wearables/google-fit/callback`;
  const scope = 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

  return authUrl;
}

/**
 * Sync Google Fit data
 */
export async function syncGoogleFitData(
  accessToken: string
): Promise<{
  steps?: number;
  calories?: number;
  heartRate?: number;
} | null> {
  try {
    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Fetch steps
    const stepsResponse = await fetch(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startOfDay.getTime(),
          endTimeMillis: endOfDay.getTime(),
        }),
      }
    );

    if (!stepsResponse.ok) {
      throw new Error('Failed to fetch Google Fit data');
    }

    const data = await stepsResponse.json();

    return {
      steps: data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0,
    };
  } catch (error) {
    // Error handled: Google Fit sync error:
    return null;
  }
}

// ============================================
// WEARABLES - Apple Health (Server-side only)
// ============================================

/**
 * Apple Health integration requires native app
 * This is a placeholder for future implementation
 */
export async function syncAppleHealthData(): Promise<null> {
  // Apple HealthKit requires native iOS app
  // Would be implemented in React Native/Expo app
  if (process.env.NODE_ENV === 'development') { _logger.warn('Apple Health sync requires native app'); }
  return null;
}

// ============================================
// AD NETWORKS - Google AdMob
// ============================================

interface AdMobConfig {
  appId: string;
  adUnitId: string;
  type: 'banner' | 'interstitial' | 'rewarded';
}

/**
 * Initialize Google AdMob (client-side only)
 */
export function initAdMob(config: AdMobConfig): void {
  if (typeof window === 'undefined') return;

  // AdMob initialization
  // This would typically use @react-native-google-mobile-ads for React Native
  // For web, we'd use Google AdSense or similar
  const script = document.createElement('script');
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  script.async = true;
  script.setAttribute('data-ad-client', config.appId);
  document.head.appendChild(script);
}

/**
 * Load AdMob banner ad
 */
export function loadAdMobBanner(adUnitId: string): void {
  if (typeof window === 'undefined') return;

  try {
    // @ts-ignore - adsbygoogle is loaded dynamically
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (error) {
    // Error handled: AdMob banner load error:
  }
}

/**
 * Show AdMob interstitial ad
 */
export async function showAdMobInterstitial(adUnitId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Interstitial ads typically require a mobile SDK
  // For web, this would be a placeholder or use AdSense
    return false;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Check if external API is configured
 */
export function isAPIConfigured(apiName: 'edamam' | 'nutritionix' | 'google-fit' | 'admob'): boolean {
  switch (apiName) {
    case 'edamam':
      return !!(
        process.env.NEXT_PUBLIC_EDAMAM_APP_ID &&
        process.env.NEXT_PUBLIC_EDAMAM_API_KEY
      );
    case 'nutritionix':
      return !!(
        process.env.NEXT_PUBLIC_NUTRITIONIX_APP_ID &&
        process.env.NEXT_PUBLIC_NUTRITIONIX_API_KEY
      );
    case 'google-fit':
      return !!process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID;
    case 'admob':
      return !!process.env.NEXT_PUBLIC_ADMOB_APP_ID;
    default:
      return false;
  }
}
