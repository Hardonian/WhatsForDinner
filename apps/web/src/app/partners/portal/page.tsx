'use client';

export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Globe,
  BarChart3,
  Settings,
  ExternalLink,
  Download,
} from 'lucide-react';

interface PartnerStats {
  totalRevenue: number;
  totalRequests: number;
  activeUsers: number;
  conversionRate: number;
  revenueGrowth: number;
  requestGrowth: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  requests: number;
  users: number;
}

interface TopPartner {
  name: string;
  revenue: number;
  requests: number;
  growth: number;
  status: 'active' | 'pending' | 'suspended';
}

export default function PartnerPortalPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topPartners, setTopPartners] = useState<TopPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    try {
      setLoading(true);

      // Load partner statistics
      const statsResponse = await fetch('/api/partners/stats');
      const statsData = await statsResponse.json();
      setStats(statsData.stats);

      // Load revenue data
      const revenueResponse = await fetch('/api/partners/revenue');
      const revenueData = await revenueResponse.json();
      setRevenueData(revenueData.data || []);

      // Load top partners
      const partnersResponse = await fetch('/api/partners/top');
      const partnersData = await partnersResponse.json();
      setTopPartners(partnersData.partners || []);
    } catch (error) {
      // Error handled: Error loading partner data:
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-muted"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Partner Portal</h1>
        <p className="text-xl text-muted-foreground">
          Manage your ecosystem partnerships and track performance
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalRevenue.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.revenueGrowth.toFixed(1) || '0'}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalRequests.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.requestGrowth.toFixed(1) || '0'}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.activeUsers.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all partners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.conversionRate * 100).toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Partner to paid conversion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue growth over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12" />
                  <span className="ml-2">Revenue chart would go here</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Partners</CardTitle>
                <CardDescription>
                  Highest performing partners this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPartners.slice(0, 5).map((partner, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {partner.requests.toLocaleString()} requests
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${partner.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          +{partner.growth.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Detailed revenue breakdown and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">$12,450</div>
                    <div className="text-sm text-muted-foreground">
                      This Month
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">$8,230</div>
                    <div className="text-sm text-muted-foreground">
                      Last Month
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <div className="text-2xl font-bold">+51.2%</div>
                    <div className="text-sm text-muted-foreground">Growth</div>
                  </div>
                </div>

                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12" />
                  <span className="ml-2">Revenue chart would go here</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Partner Type</CardTitle>
              <CardDescription>
                Breakdown of revenue by integration type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: 'Shopify',
                    revenue: 4520,
                    percentage: 36.3,
                    color: 'bg-green-500',
                  },
                  {
                    type: 'Zapier',
                    revenue: 3120,
                    percentage: 25.1,
                    color: 'bg-blue-500',
                  },
                  {
                    type: 'Voice (Alexa/Google)',
                    revenue: 2890,
                    percentage: 23.2,
                    color: 'bg-purple-500',
                  },
                  {
                    type: 'Social (TikTok/Instagram)',
                    revenue: 1920,
                    percentage: 15.4,
                    color: 'bg-pink-500',
                  },
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-sm text-muted-foreground">
                        ${item.revenue.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Directory</CardTitle>
              <CardDescription>
                Manage your ecosystem partners and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Shopify Integration',
                    type: 'E-commerce',
                    status: 'active',
                    revenue: 4520,
                    requests: 12500,
                  },
                  {
                    name: 'Zapier Automation',
                    type: 'Workflow',
                    status: 'active',
                    revenue: 3120,
                    requests: 8900,
                  },
                  {
                    name: 'Alexa Skills',
                    type: 'Voice',
                    status: 'pending',
                    revenue: 0,
                    requests: 0,
                  },
                  {
                    name: 'Google Home',
                    type: 'Voice',
                    status: 'pending',
                    revenue: 0,
                    requests: 0,
                  },
                  {
                    name: 'TikTok API',
                    type: 'Social',
                    status: 'active',
                    revenue: 1920,
                    requests: 5600,
                  },
                  {
                    name: 'Instagram API',
                    type: 'Social',
                    status: 'active',
                    revenue: 1450,
                    requests: 4200,
                  },
                ].map((partner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {partner.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge
                        variant={
                          partner.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {partner.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">
                          ${partner.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {partner.requests.toLocaleString()} requests
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>API requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12" />
                  <span className="ml-2">
                    Request volume chart would go here
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Partner activity by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      region: 'North America',
                      percentage: 45,
                      requests: 12500,
                    },
                    { region: 'Europe', percentage: 30, requests: 8300 },
                    { region: 'Asia Pacific', percentage: 25, requests: 6900 },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.region}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.requests.toLocaleString()} requests (
                          {item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for partner ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <div className="text-2xl font-bold">98.5%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <div className="text-2xl font-bold">245ms</div>
                  <div className="text-sm text-muted-foreground">
                    Avg Response Time
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <div className="text-2xl font-bold">99.2%</div>
                  <div className="text-sm text-muted-foreground">
                    Success Rate
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">
                    Active Partners
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Settings</CardTitle>
              <CardDescription>
                Configure your partner account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Revenue Share Percentage
                  </label>
                  <div className="text-2xl font-bold">5.0%</div>
                  <p className="text-sm text-muted-foreground">
                    Your current revenue share rate
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">API Rate Limits</label>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Requests per minute:</span>
                      <span className="font-mono">100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requests per hour:</span>
                      <span className="font-mono">1,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requests per day:</span>
                      <span className="font-mono">10,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Webhook URL</label>
                  <div className="text-sm text-muted-foreground">
                    https://your-domain.com/webhooks/whats-for-dinner
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Update Settings
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
