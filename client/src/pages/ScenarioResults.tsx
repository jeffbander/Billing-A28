import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
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
    cptBreakdown: Array<{
      cptCode: string;
      cptDescription: string;
      quantity: number;
      fpaRevenue: number;
      article28Revenue: number;
      article28Prof: number;
      article28Tech: number;
    }>;
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
    cptBreakdown: [],
  };

  const isPositiveDifference = result.difference > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with just title */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{scenario.providerName}</h1>
            <p className="text-muted-foreground mt-1">
              {scenario.totalPatients} patients • {scenario.medicarePercent}% Medicare, {scenario.commercialPercent}% Commercial, {scenario.medicaidPercent}% Medicaid
            </p>
          </div>
        </div>

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

        {/* CPT Code Breakdown */}
        {result.cptBreakdown && result.cptBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by CPT Code</CardTitle>
              <CardDescription>
                Detailed breakdown showing revenue contribution for each procedure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.cptBreakdown.map((cpt, index) => {
                  const cptDifference = cpt.article28Revenue - cpt.fpaRevenue;
                  const cptIsPositive = cptDifference > 0;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-lg">{cpt.cptCode}</div>
                          <div className="text-sm text-muted-foreground">{cpt.cptDescription}</div>
                          <div className="text-xs text-muted-foreground mt-1">Quantity: {cpt.quantity}</div>
                        </div>
                        <div className={`text-right ${cptIsPositive ? "text-green-600" : "text-red-600"}`}>
                          <div className="text-sm font-medium flex items-center gap-1">
                            {cptIsPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {formatCurrency(Math.abs(cptDifference))}
                          </div>
                          <div className="text-xs">difference</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">FPA Revenue</div>
                          <div className="font-semibold text-blue-600">{formatCurrency(cpt.fpaRevenue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Article 28 Revenue</div>
                          <div className="font-semibold text-purple-600">{formatCurrency(cpt.article28Revenue)}</div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <div>Prof: {formatCurrency(cpt.article28Prof)}</div>
                            <div>Tech: {formatCurrency(cpt.article28Tech)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visual Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Comparison</CardTitle>
            <CardDescription>
              Visual comparison of total reimbursement between site types
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
                <div className="h-8 bg-purple-100 rounded-lg overflow-hidden flex">
                  {result.article28Professional > 0 && result.article28Technical > 0 ? (
                    <>
                      <div
                        className="h-full bg-purple-600"
                        style={{
                          width: `${(result.article28Professional / Math.max(result.fpaTotal, result.article28Total)) * 100}%`,
                        }}
                        title={`Professional: ${formatCurrency(result.article28Professional)}`}
                      />
                      <div
                        className="h-full bg-purple-400"
                        style={{
                          width: `${(result.article28Technical / Math.max(result.fpaTotal, result.article28Total)) * 100}%`,
                        }}
                        title={`Technical: ${formatCurrency(result.article28Technical)}`}
                      />
                    </>
                  ) : (
                    <div
                      className="h-full bg-purple-600"
                      style={{
                        width: `${(result.article28Total / Math.max(result.fpaTotal, result.article28Total)) * 100}%`,
                      }}
                    />
                  )}
                </div>
                {result.article28Professional > 0 && result.article28Technical > 0 && (
                  <div className="flex gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-600 rounded"></div>
                      <span className="text-muted-foreground">Professional: {formatCurrency(result.article28Professional)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-400 rounded"></div>
                      <span className="text-muted-foreground">Technical: {formatCurrency(result.article28Technical)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
