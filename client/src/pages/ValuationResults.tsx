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

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RVUs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.totalRvus)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Work RVUs earned per month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professional Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalProfessionalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                → {summary.professionalRevenueDestination}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Technical Revenue</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalTechnicalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                → {summary.technicalRevenueDestination}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Attribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Attribution</CardTitle>
            <CardDescription>
              Where the revenue flows based on provider type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Professional Revenue</p>
                  <p className="text-sm text-muted-foreground">
                    From reading/performing procedures
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.totalProfessionalRevenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → {summary.professionalRevenueRecipient}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Technical Revenue</p>
                  <p className="text-sm text-muted-foreground">
                    From facility services
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.totalTechnicalRevenue)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → Mount Sinai West Article 28
                  </p>
                </div>
              </div>

              {provider.providerType === 'Type3' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>Type 3 Provider Note:</strong> This provider generates technical revenue for the facility
                    but does not earn RVUs or professional revenue (referring provider only).
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                      {formatNumber(activity.rvusEarned)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(activity.professionalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(activity.technicalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={5}>Total</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(summary.totalRvus)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalProfessionalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.totalTechnicalRevenue)}
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
