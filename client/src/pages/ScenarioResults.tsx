import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function ScenarioResults() {
  const [, params] = useRoute("/scenarios/:id");
  const [, setLocation] = useLocation();
  const scenarioId = params?.id ? parseInt(params.id) : 0;
  
  const { data: scenario, isLoading } = trpc.scenarios.getWithDetails.useQuery({ id: scenarioId });
  const [calculationResult, setCalculationResult] = useState<{
    fpaTotal: number;
    article28Total: number;
    article28Professional: number;
    article28Technical: number;
    difference: number;
    percentDifference: number;
  } | null>(null);
  
  const calculateMutation = trpc.scenarios.calculate.useMutation({
    onSuccess: (data) => {
      setCalculationResult(data);
      toast.success("Calculation completed!");
    },
    onError: (error) => {
      toast.error(`Calculation failed: ${error.message}`);
    },
  });

  useEffect(() => {
    if (scenarioId) {
      calculateMutation.mutate({ scenarioId });
    }
  }, [scenarioId]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading || !scenario) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const result = calculationResult || {
    fpaTotal: scenario.fpaTotal || 0,
    article28Total: scenario.article28Total || 0,
    article28Professional: 0,
    article28Technical: 0,
    difference: (scenario.article28Total || 0) - (scenario.fpaTotal || 0),
    percentDifference: scenario.fpaTotal ? (((scenario.article28Total || 0) - (scenario.fpaTotal || 0)) / (scenario.fpaTotal || 1)) * 100 : 0,
  };

  const isPositiveDifference = result.difference > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Scenario Results</h1>
            <p className="text-muted-foreground mt-1">{scenario.providerName}</p>
          </div>
        </div>

        {/* Scenario Details */}
        <Card>
          <CardHeader>
            <CardTitle>Scenario Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Provider:</dt>
                    <dd className="font-medium">{scenario.providerName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Patients:</dt>
                    <dd className="font-medium">{scenario.totalPatients}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Site Type:</dt>
                    <dd className="font-medium">{scenario.siteType}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Payer Mix</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Medicare:</dt>
                    <dd className="font-medium">{scenario.medicarePercent}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Commercial:</dt>
                    <dd className="font-medium">{scenario.commercialPercent}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Medicaid:</dt>
                    <dd className="font-medium">{scenario.medicaidPercent}%</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">FPA Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(result.fpaTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Freestanding Office</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Article 28 Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(result.article28Total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hospital Outpatient</p>
              {result.article28Professional > 0 && result.article28Technical > 0 && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Professional (26):</span>
                    <span className="font-medium">{formatCurrency(result.article28Professional)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Technical (TC):</span>
                    <span className="font-medium">{formatCurrency(result.article28Technical)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={isPositiveDifference ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Difference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${isPositiveDifference ? "text-green-600" : "text-red-600"}`}>
                {isPositiveDifference ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {formatCurrency(Math.abs(result.difference))}
              </div>
              <p className={`text-xs mt-1 ${isPositiveDifference ? "text-green-700" : "text-red-700"}`}>
                {formatPercent(Math.abs(result.percentDifference))} {isPositiveDifference ? "higher" : "lower"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Comparison</CardTitle>
            <CardDescription>
              Visual comparison of reimbursement between site types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">FPA (Freestanding Office)</span>
                  <span className="text-sm font-medium">{formatCurrency(result.fpaTotal)}</span>
                </div>
                <div className="h-8 bg-blue-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${(result.fpaTotal / Math.max(result.fpaTotal, result.article28Total)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Article 28 (Hospital Outpatient)</span>
                  <span className="text-sm font-medium">{formatCurrency(result.article28Total)}</span>
                </div>
                <div className="h-8 bg-purple-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-purple-600"
                    style={{
                      width: `${(result.article28Total / Math.max(result.fpaTotal, result.article28Total)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Procedure Details */}
        <Card>
          <CardHeader>
            <CardTitle>Procedure Mix</CardTitle>
            <CardDescription>
              CPT codes and quantities used in this scenario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">CPT Code</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.details.map((detail) => (
                    <tr key={detail.id} className="border-b">
                      <td className="p-3 font-mono text-sm">{detail.cptCode}</td>
                      <td className="p-3 text-sm">{detail.cptDescription}</td>
                      <td className="p-3 text-right font-medium">{detail.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Analysis Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Based on the payer mix and procedure volumes in this scenario, Article 28 (Hospital Outpatient) 
                  reimbursement is <strong>{formatCurrency(Math.abs(result.difference))}</strong> ({formatPercent(Math.abs(result.percentDifference))}) 
                  {isPositiveDifference ? " higher" : " lower"} than FPA (Freestanding Office) reimbursement. 
                  This difference is primarily driven by the technical component rates in Article 28 settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
