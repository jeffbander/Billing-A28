import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, DollarSign, Activity, Building2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ValuationResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const valuationId = id ? parseInt(id) : 0;

  const { data: results, isLoading } = trpc.valuations.calculate.useQuery(
    { id: valuationId },
    { enabled: valuationId > 0 }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading valuation results...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!results) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Valuation not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const { valuation, provider, institution, activityResults, summary } = results;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{valuation.name}</h1>
              <p className="text-muted-foreground mt-1">
                Provider Valuation Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Provider Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Provider Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Provider Name</p>
                <p className="font-medium">{provider.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provider Type</p>
                <Badge variant={
                  provider.providerType === 'Type1' ? 'default' :
                  provider.providerType === 'Type2' ? 'secondary' : 'outline'
                }>
                  {provider.providerType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Home Institution</p>
                <p className="font-medium">{institution?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Patients</p>
                <p className="font-medium">{valuation.monthlyPatients}</p>
              </div>
            </div>
            {valuation.description && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{valuation.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Site Information */}
        {results.site && (
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Site Name</p>
                  <p className="font-medium">{results.site.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Site Type</p>
                  <Badge variant={results.site.siteType === "FPA" ? "default" : "secondary"}>
                    {results.site.siteType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Institution</p>
                  <p className="font-medium">{results.valuationInstitution?.name || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Earned Revenue Summary */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Earned Revenue & RVUs</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Actual revenue and RVUs that go to institutions and sites
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earned RVUs</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(summary.earnedProfessionalRvus)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Work RVUs from reading/performing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earned Prof. Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.earnedProfessionalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  → {summary.earnedProfessionalDestination}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earned Tech. Revenue</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.earnedTechnicalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  → {summary.earnedTechnicalDestination}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attributed Revenue Summary */}
        {summary.attributedProfessionalRvus > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Attributed Revenue & RVUs</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Revenue and RVUs tracked for ordering physician (not actual payment)
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attributed RVUs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(summary.attributedProfessionalRvus)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From ordering studies
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attributed Prof. Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.attributedProfessionalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracked for {summary.attributedToProvider}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attributed Tech. Revenue</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summary.attributedTechnicalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracked for {summary.attributedToProvider}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Activity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown by CPT Code</CardTitle>
            <CardDescription>
              Detailed analysis of each procedure type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CPT Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Reads</TableHead>
                  <TableHead className="text-right">Performs</TableHead>
                  <TableHead className="text-right">RVUs</TableHead>
                  <TableHead className="text-right">Prof. Revenue</TableHead>
                  <TableHead className="text-right">Tech. Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityResults.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.cptCode}</TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell className="text-right">
                      {activity.procedureType === 'imaging' ? activity.monthlyOrders : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.procedureType === 'imaging' ? activity.monthlyReads : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.procedureType !== 'imaging' ? activity.monthlyPerforms : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(activity.earnedProfRvus)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(activity.earnedProfRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(activity.earnedTechRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={5}>Total Earned</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(summary.earnedProfessionalRvus)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.earnedProfessionalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.earnedTechnicalRevenue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
