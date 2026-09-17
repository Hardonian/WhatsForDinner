export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Compare What\'s for Dinner vs Competitors | Pantry-First Meal Planning',
  description: 'See how What\'s for Dinner compares to Yummly, AllRecipes, Mealime, and Paprika. Our pantry-first approach is unique.',
};

export default function ComparePage() {
  const competitors = [
    {
      name: 'Yummly',
      description: 'Recipe search and meal planning',
      pros: ['Large recipe database', 'Recipe ratings', 'Meal planning'],
      cons: ['Requires shopping trips', 'No pantry management', 'No waste reduction'],
      ourAdvantage: 'We start with your pantry, not a shopping list',
    },
    {
      name: 'AllRecipes',
      description: 'Recipe database and community',
      pros: ['Huge recipe collection', 'Community reviews', 'Free to use'],
      cons: ['No meal planning', 'No pantry integration', 'Manual recipe search'],
      ourAdvantage: 'AI generates recipes from your pantry automatically',
    },
    {
      name: 'Mealime',
      description: 'Meal planning app',
      pros: ['Meal plan templates', 'Shopping lists', 'Recipe collection'],
      cons: ['Limited pantry integration', 'No expiration tracking', 'No cost tracking'],
      ourAdvantage: 'Full pantry-first approach with expiration and cost tracking',
    },
    {
      name: 'Paprika',
      description: 'Recipe manager and meal planner',
      pros: ['Recipe import', 'Calendar planning', 'Shopping lists'],
      cons: ['Manual meal planning', 'No AI assistance', 'No pantry management'],
      ourAdvantage: 'AI-powered meal planning with pantry intelligence',
    },
  ];

  const features = [
    {
      feature: 'Pantry-First Approach',
      us: '✅ Core feature',
      competitors: '❌ Not available',
    },
    {
      feature: 'AI Recipe Generation',
      us: '✅ From pantry items',
      competitors: '❌ Recipe search only',
    },
    {
      feature: 'Expiration Tracking',
      us: '✅ With alerts',
      competitors: '❌ Not available',
    },
    {
      feature: 'Cost Calculator',
      us: '✅ Per recipe & per serving',
      competitors: '❌ Not available',
    },
    {
      feature: 'Waste Reduction',
      us: '✅ Dashboard & metrics',
      competitors: '❌ Not a focus',
    },
    {
      feature: 'Nutrition Tracking',
      us: '✅ USDA-verified (Premium)',
      competitors: '⚠️ Basic or none',
    },
    {
      feature: 'Weekly Meal Plans',
      us: '✅ AI-generated',
      competitors: '⚠️ Templates or manual',
    },
    {
      feature: 'Preference Learning',
      us: '✅ AI-powered',
      competitors: '❌ Not available',
    },
    {
      feature: 'Grocery Integration',
      us: '✅ Coming soon',
      competitors: '⚠️ Limited',
    },
    {
      feature: 'Mobile App',
      us: '✅ Native experience',
      competitors: '⚠️ Web or limited',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How We Compare to Competitors
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're not just another recipe app. We're the only pantry-first meal planning platform that helps you use what you have, reduce waste, and save money.
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold">What's for Dinner</th>
                  <th className="text-center py-3 px-4 font-semibold">Competitors</th>
                </tr>
              </thead>
              <tbody>
                {features.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.feature}</td>
                    <td className="py-3 px-4 text-center text-green-600">{item.us}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{item.competitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitor Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {competitors.map((competitor, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-2">{competitor.name}</h3>
              <p className="text-gray-600 mb-4">{competitor.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-green-600">Pros:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {competitor.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-red-600">Cons:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {competitor.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-orange-900">Our Advantage:</h4>
                <p className="text-sm text-orange-800">{competitor.ourAdvantage}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Our Unique Value */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6">What Makes Us Unique</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Pantry-First Approach</h3>
              <p className="text-white/90">
                We're the only platform that starts with what you already have. Others make you buy ingredients; we help you use what you have.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">AI That Learns</h3>
              <p className="text-white/90">
                Our AI learns your preferences over time, making better recipe suggestions as you use the platform.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Waste Reduction</h3>
              <p className="text-white/90">
                Expiration tracking and smart suggestions help you reduce food waste by up to 40%.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Cost Savings</h3>
              <p className="text-white/90">
                See cost per serving for every recipe and track savings vs. eating out.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Join thousands of users who've discovered the power of pantry-first meal planning.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/blog/competitive-differentiation"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
