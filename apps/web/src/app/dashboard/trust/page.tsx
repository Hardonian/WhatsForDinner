/**
 * Trust Dashboard Page
 * User-facing transparency dashboard showing Guardian activity
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { TrustReport } from '@whats-for-dinner/utils/guardian';

export default function TrustDashboard() {
  const [user, setUser] = useState<unknown>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [supabase]);
  const [report, setReport] = useState<TrustReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (!user) return;

    fetch(`/api/guardian/events?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.report);
        setLoading(false);
      })
      .catch(err => {
        _logger.error('Failed to load trust report:', { err });
        setLoading(false);
      });
  }, [user, period]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading trust report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">No trust data available</div>
      </div>
    );
  }

  const riskPercentage = {
    low: report.totalEvents > 0 
      ? Math.round((report.eventsByRisk.low / report.totalEvents) * 100)
      : 0,
    medium: report.totalEvents > 0
      ? Math.round((report.eventsByRisk.medium / report.totalEvents) * 100)
      : 0,
    high: report.totalEvents > 0
      ? Math.round((report.eventsByRisk.high / report.totalEvents) * 100)
      : 0,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Guardian Trust Dashboard</h1>
        <p className="text-gray-600">
          Transparency report showing how your data is protected
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 rounded ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          This Week
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`px-4 py-2 rounded ${period === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All Time
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Events</h3>
          <p className="text-3xl font-bold">{report.totalEvents}</p>
          <p className="text-sm text-gray-600 mt-2">
            Data access operations monitored
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Trust Score</h3>
          <p className="text-3xl font-bold">{report.trustScore}/100</p>
          <p className="text-sm text-gray-600 mt-2">
            Based on risk assessment
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Confidence</h3>
          <p className="text-3xl font-bold">{report.confidenceScore}%</p>
          <p className="text-sm text-gray-600 mt-2">
            Safe operations percentage
          </p>
        </div>
      </div>

      {/* Risk Meter */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Risk Distribution</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-green-600">Low Risk</span>
              <span className="text-sm text-gray-600">{report.eventsByRisk.low} ({riskPercentage.low}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${riskPercentage.low}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-yellow-600">Medium Risk</span>
              <span className="text-sm text-gray-600">{report.eventsByRisk.medium} ({riskPercentage.medium}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${riskPercentage.medium}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-red-600">High Risk</span>
              <span className="text-sm text-gray-600">{report.eventsByRisk.high} ({riskPercentage.high}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${riskPercentage.high}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events by Data Class */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Events by Data Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(report.eventsByClass).map(([dataClass, count]) => (
            <div key={dataClass} className="text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{dataClass.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Taken */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Actions Taken</h2>
        <div className="space-y-2">
          {Object.entries(report.actionsTaken).map(([action, count]) => (
            <div key={action} className="flex justify-between items-center">
              <span className="capitalize">{action}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      {report.anomalies.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-800">Anomalies Detected</h2>
          <ul className="space-y-2">
            {report.anomalies.map((anomaly, idx) => (
              <li key={idx} className="text-yellow-700">
                <strong>{anomaly.type}:</strong> {anomaly.description}
                <span className="text-sm text-yellow-600 ml-2">
                  ({new Date(anomaly.timestamp).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          View Details
        </button>
        <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Adjust Trust Level
        </button>
        <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Export Report
        </button>
      </div>
    </div>
  );
}
