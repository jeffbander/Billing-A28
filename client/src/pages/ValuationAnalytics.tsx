import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowLeft, BarChart3, DollarSign, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ValuationAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const { data: analytics, isLoading } = trpc.valuations.analytics.useQuery(undefined, {
    enabled: !!user,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Prepare revenue trend chart data
  const revenueTrendData = useMemo(() => {
    if (!analytics?.revenueTrends) return [];
    return analytics.revenueTrends.map((trend) => ({
      month: new Date(trend.month + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      "Professional Revenue": trend.professionalRevenue / 1000, // Convert to thousands
      "Technical Revenue": trend.technicalRevenue / 1000,
      RVUs: trend.totalRvus,
    }));
  }, [analytics]);

  // Prepare CPT code usage chart data
  const cptCodeData = useMemo(() => {
    if (!analytics?.topCptCodes) return [];
    return analytics.topCptCodes.map((cpt) => ({
      code: cpt.code,
      usage: cpt.usageCount,
      rvus: cpt.totalRvus,
    }));
  }, [analytics]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available</p>
          <Link href="/valuations/new">
            <Button className="mt-4">Create Your First Valuation</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { summary, providerProductivity, topCptCodes } = analytics;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/valuations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Valuation Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights across all your provider valuations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RVUs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalRvus)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatNumber(summary.avgRvusPerValuation)} per valuation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Prof: {formatCurrency(summary.totalProfessionalRevenue)} | Tech:{" "}
                {formatCurrency(summary.totalTechnicalRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeProviders}</div>
              <p className="text-xs text-muted-foreground">
                Across {summary.totalValuations} valuations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg RVUs/Valuation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.avgRvusPerValuation)}
              </div>
              <p className="text-xs text-muted-foreground">Work RVU productivity metric</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trends Chart */}
        {revenueTrendData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends Over Time</CardTitle>
              <CardDescription>
                Professional and technical revenue by month (in thousands)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(0)}K`, ""]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Professional Revenue"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="Technical Revenue"
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* RVU Trends Chart */}
        {revenueTrendData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>RVU Trends Over Time</CardTitle>
              <CardDescription>Work RVU productivity by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="RVUs"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Provider Productivity Table */}
        {providerProductivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Provider Productivity</CardTitle>
              <CardDescription>
                Performance metrics by provider (sorted by total RVUs)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Total RVUs</TableHead>
                    <TableHead className="text-right">Prof. Revenue</TableHead>
                    <TableHead className="text-right">Tech. Revenue</TableHead>
                    <TableHead className="text-right">Valuations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerProductivity.map((provider) => (
                    <TableRow key={provider.providerId}>
                      <TableCell className="font-medium">{provider.providerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                          {provider.providerType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(provider.totalRvus)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(provider.totalProfRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(provider.totalTechRevenue)}
                      </TableCell>
                      <TableCell className="text-right">{provider.valuationCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Top CPT Codes Chart */}
        {cptCodeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top CPT Codes by Usage</CardTitle>
              <CardDescription>Most frequently used procedure codes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cptCodeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="code" type="category" width={80} />
                  <Tooltip
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="usage" fill="hsl(var(--primary))" name="Usage Count" />
                  <Bar dataKey="rvus" fill="hsl(var(--chart-2))" name="Total RVUs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
