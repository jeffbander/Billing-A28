import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

export default function ValuationComparison() {
  const [, setLocation] = useLocation();
  const [valuationIds, setValuationIds] = useState<number[]>([]);

  // Parse IDs from URL query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idsParam = params.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter(Boolean);
      setValuationIds(ids);
    }
  }, []);

  // Fetch all selected valuations using useQueries to avoid hooks in loop
  const trpcClient = trpc.useUtils().client;
  const valuationQueries = useQueries({
    queries: valuationIds.map((id) => ({
      queryKey: [["valuations", "calculate"], { input: { id }, type: "query" }],
      queryFn: () => trpcClient.valuations.calculate.query({ id }),
      enabled: !!id,
    })),
  });

  const isLoading = valuationQueries.some((q) => q.isLoading);
  const hasError = valuationQueries.some((q) => q.isError);
  const valuations = valuationQueries.map((q) => q.data).filter((v): v is NonNullable<typeof v> => v !== undefined && v !== null);

  if (valuationIds.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/valuations")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No valuations selected for comparison</p>
              <Button onClick={() => setLocation("/valuations")} className="mt-4">
                Go to Valuation List
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading comparison...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasError || valuations.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/valuations")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">Error loading valuations</p>
              <Button onClick={() => setLocation("/valuations")}>
                Go to Valuation List
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const chartData = valuations.map((v) => ({
    name: v.valuation.name.length > 20 
      ? v.valuation.name.substring(0, 20) + "..." 
      : v.valuation.name,
    RVUs: v.summary.totalRvus,
    "Prof. Revenue": v.summary.totalProfessionalRevenue / 1000, // Convert to thousands
    "Tech. Revenue": v.summary.totalTechnicalRevenue / 1000,
  }));

  // Calculate differences (compared to first valuation)
  const baseline = valuations[0];
  const differences = valuations.slice(1).map((v) => ({
    valuation: v,
    rvuDiff: v.summary.totalRvus - baseline.summary.totalRvus,
    rvuDiffPercent: baseline.summary.totalRvus > 0 
      ? ((v.summary.totalRvus - baseline.summary.totalRvus) / baseline.summary.totalRvus) * 100 
      : 0,
    profRevDiff: v.summary.totalProfessionalRevenue - baseline.summary.totalProfessionalRevenue,
    profRevDiffPercent: baseline.summary.totalProfessionalRevenue > 0
      ? ((v.summary.totalProfessionalRevenue - baseline.summary.totalProfessionalRevenue) / baseline.summary.totalProfessionalRevenue) * 100
      : 0,
    techRevDiff: v.summary.totalTechnicalRevenue - baseline.summary.totalTechnicalRevenue,
    techRevDiffPercent: baseline.summary.totalTechnicalRevenue > 0
      ? ((v.summary.totalTechnicalRevenue - baseline.summary.totalTechnicalRevenue) / baseline.summary.totalTechnicalRevenue) * 100
      : 0,
  }));

  const DiffIndicator = ({ value, percent }: { value: number; percent: number }) => {
    if (Math.abs(value) < 0.01) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="w-4 h-4" />
          <span>No change</span>
        </div>
      );
    }
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>
          {isPositive ? "+" : ""}
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          {" "}
          ({isPositive ? "+" : ""}
          {percent.toFixed(1)}%)
        </span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/valuations")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Valuation Comparison</h1>
              <p className="text-muted-foreground mt-1">
                Comparing {valuations.length} valuation{valuations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {valuations.map((v, idx) => (
            <Card key={v.valuation.id} className={idx === 0 ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{v.valuation.name}</CardTitle>
                  {idx === 0 && <Badge variant="outline">Baseline</Badge>}
                </div>
                <CardDescription>{v.provider.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">RVUs</p>
                  <p className="text-2xl font-bold">{v.summary.totalRvus.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prof. Revenue</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${v.summary.totalProfessionalRevenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tech. Revenue</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ${v.summary.totalTechnicalRevenue.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Visual Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Comparison</CardTitle>
            <CardDescription>RVUs and revenue across valuations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="RVUs" fill="#0d9488" name="Total RVUs" />
                <Bar yAxisId="right" dataKey="Prof. Revenue" fill="#10b981" name="Prof. Revenue ($K)" />
                <Bar yAxisId="right" dataKey="Tech. Revenue" fill="#3b82f6" name="Tech. Revenue ($K)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Comparison Table */}
        {differences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
              <CardDescription>
                Differences compared to baseline: {baseline.valuation.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valuation</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>RVU Difference</TableHead>
                    <TableHead>Prof. Revenue Difference</TableHead>
                    <TableHead>Tech. Revenue Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {differences.map((diff) => (
                    <TableRow key={diff.valuation.valuation.id}>
                      <TableCell className="font-medium">
                        {diff.valuation.valuation.name}
                      </TableCell>
                      <TableCell>{diff.valuation.provider.name}</TableCell>
                      <TableCell>
                        <DiffIndicator value={diff.rvuDiff} percent={diff.rvuDiffPercent} />
                      </TableCell>
                      <TableCell>
                        <DiffIndicator value={diff.profRevDiff} percent={diff.profRevDiffPercent} />
                      </TableCell>
                      <TableCell>
                        <DiffIndicator value={diff.techRevDiff} percent={diff.techRevDiffPercent} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Activity Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Comparison</CardTitle>
            <CardDescription>CPT code activities across valuations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPT Code</TableHead>
                  {valuations.map((v) => (
                    <TableHead key={v.valuation.id} className="text-center">
                      {v.valuation.name.length > 15
                        ? v.valuation.name.substring(0, 15) + "..."
                        : v.valuation.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Get all unique CPT codes */}
                {Array.from(
                  new Set(
                    valuations.flatMap((v) =>
                      v.activityResults.map((a) => `${a.cptCode}-${a.description}`)
                    )
                  )
                ).map((cptKey) => {
                  const separatorIndex = cptKey.indexOf("-");
                  const code = cptKey.substring(0, separatorIndex);
                  const description = cptKey.substring(separatorIndex + 1);
                  return (
                    <TableRow key={cptKey}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{code}</p>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </TableCell>
                      {valuations.map((v) => {
                        const activity = v.activityResults.find((a) => a.cptCode === code);
                        if (!activity) {
                          return (
                            <TableCell key={v.valuation.id} className="text-center text-muted-foreground">
                              —
                            </TableCell>
                          );
                        }
                        const quantity =
                          activity.procedureType === "imaging"
                            ? (activity.monthlyReads || 0)
                            : (activity.monthlyPerforms || 0);
                        return (
                          <TableCell key={v.valuation.id} className="text-center">
                            <div>
                              <p className="font-mono font-medium">{quantity}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.rvusEarned.toFixed(2)} RVUs
                              </p>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
