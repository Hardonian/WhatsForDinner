import { NextResponse } from 'next/server';

export async function GET() {
  // Pre-configured insight packages
  const insights = [
    {
      id: 'user-behavior',
      name: 'User Behavior Patterns',
      description: 'Aggregated user behavior and engagement patterns',
      price: 500,
      dataPoints: ['Login frequency', 'Feature usage', 'Session duration', 'Engagement trends'],
      sampleSize: '10,000+ users',
      updateFrequency: 'Monthly',
    },
    {
      id: 'market-segmentation',
      name: 'Market Segmentation Analysis',
      description: 'Demographic and psychographic segmentation data',
      price: 1000,
      dataPoints: ['Age groups', 'Geographic distribution', 'Usage patterns', 'Feature preferences'],
      sampleSize: '50,000+ users',
      updateFrequency: 'Monthly',
    },
    {
      id: 'feature-adoption',
      name: 'Feature Adoption Trends',
      description: 'Which features are most popular and why',
      price: 750,
      dataPoints: ['Feature usage rates', 'Adoption curves', 'Churn by feature', 'ROI by feature'],
      sampleSize: '25,000+ users',
      updateFrequency: 'Weekly',
    },
    {
      id: 'predictive-analytics',
      name: 'Predictive Analytics Package',
      description: 'ML-powered predictions on user behavior and trends',
      price: 2000,
      dataPoints: ['Churn prediction', 'LTV prediction', 'Feature demand forecast', 'Market trends'],
      sampleSize: '100,000+ users',
      updateFrequency: 'Daily',
    },
  ];

  return NextResponse.json({
    insights,
    totalPackages: insights.length,
    note: 'All data is anonymized and GDPR/CCPA compliant',
  });
}

export const dynamic = "force-dynamic";
