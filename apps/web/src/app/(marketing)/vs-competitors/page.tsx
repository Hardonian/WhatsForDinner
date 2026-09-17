export const dynamic = 'force-dynamic';

import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'What\'s for Dinner vs Competitors: Why We\'re Different',
  description: 'Compare What\'s for Dinner with Yummly, AllRecipes, Mealime, and other meal planning apps. See why our pantry-first approach makes us unique.',
  keywords: ['meal planning app comparison', 'recipe app comparison', 'yummly vs whats for dinner', 'allrecipes alternative', 'pantry-first meal planner'],
}

export default function VsCompetitorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What's for Dinner vs Competitors
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            See how we compare to Yummly, AllRecipes, Mealime, and other meal planning apps. 
            Our pantry-first approach makes us unique.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    <div className="flex flex-col items-center">
                      <span className="text-blue-600 font-bold">What's for Dinner</span>
                      <span className="text-xs text-gray-500 mt-1">(Us)</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Yummly</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">AllRecipes</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Mealime</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Paprika</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">Pantry-First Approach</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      ✅ Unique
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">AI Personalization</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      ✅ Advanced
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">✅ Basic</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">✅ Basic</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">Time-to-Value</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      ✅ &lt;30 seconds
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">5+ min</td>
                  <td className="px-6 py-4 text-center text-gray-500">3+ min</td>
                  <td className="px-6 py-4 text-center text-gray-500">10+ min</td>
                  <td className="px-6 py-4 text-center text-gray-500">5+ min</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">Grocery Integration</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      🔜 Coming Soon
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">Voice Interface</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      🔜 Coming Soon
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">Recipe Database</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-800 font-semibold">AI-Generated</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">2M+</td>
                  <td className="px-6 py-4 text-center text-gray-600">50M+</td>
                  <td className="px-6 py-4 text-center text-gray-600">10K+</td>
                  <td className="px-6 py-4 text-center text-gray-600">User-created</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">Meal Planning</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">Mobile App</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">Free Tier</td>
                  <td className="px-6 py-4 text-center text-green-600">✅</td>
                  <td className="px-6 py-4 text-center text-green-600">✅ (ads)</td>
                  <td className="px-6 py-4 text-center text-green-600">✅ (ads)</td>
                  <td className="px-6 py-4 text-center text-green-600">✅ (limited)</td>
                  <td className="px-6 py-4 text-center text-gray-500">❌</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-900">Pricing</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-gray-800 font-semibold">$9.99/mo</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">$5.99/mo</td>
                  <td className="px-6 py-4 text-center text-gray-600">Free</td>
                  <td className="px-6 py-4 text-center text-gray-600">$6.99/mo</td>
                  <td className="px-6 py-4 text-center text-gray-600">$4.99 one-time</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Differentiators */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why What's for Dinner is Different
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🥘</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pantry-First Approach</h3>
              <p className="text-gray-600">
                Start with what you have, not what you need. No competitor offers this unique approach. 
                Simply enter your ingredients and get personalized recipes in seconds.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fastest Time-to-Value</h3>
              <p className="text-gray-600">
                Get your first recipe in under 30 seconds. Competitors require 3-10+ minutes of setup. 
                We're the fastest in the market.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced AI Personalization</h3>
              <p className="text-gray-600">
                Our AI learns your preferences over time. More advanced than competitors' basic AI, 
                providing truly personalized recipe suggestions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Try What's for Dinner?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Experience the only pantry-first meal planner. Get personalized recipes from ingredients 
            you already have in under 30 seconds.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try Free
            </Link>
            <Link
              href="/pricing"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                What makes What's for Dinner different from Yummly?
              </h3>
              <p className="text-gray-600">
                We're the only pantry-first meal planner. Yummly is recipe-first, meaning you browse 
                recipes and then buy ingredients. We start with what you have and generate personalized 
                recipes instantly. Plus, we have the fastest time-to-value in the market (&lt;30 seconds).
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                How do you compare to AllRecipes?
              </h3>
              <p className="text-gray-600">
                AllRecipes is a recipe database with 50M+ recipes, but it's recipe-first (you browse 
                recipes). We use AI to generate personalized recipes from your ingredients. AllRecipes 
                has no meal planning, no AI personalization, and outdated UX. We're modern, fast, and 
                pantry-first.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                What about Mealime?
              </h3>
              <p className="text-gray-600">
                Mealime is meal planning focused and requires planning ahead. We're spontaneous—use 
                what you have right now. Mealime takes 10+ minutes to set up, we take &lt;30 seconds. 
                We're also adding grocery integration and voice interface, which Mealime doesn't have.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
