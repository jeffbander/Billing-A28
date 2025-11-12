import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function RatesManagement() {
  const utils = trpc.useUtils();
  const { data: ratesWithDetails, isLoading } = trpc.rates.listWithDetails.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  const isAdmin = user?.role === "admin";

  const formatCurrency = (cents: number | null) => {
    if (cents === null) return "N/A";
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rate Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage reimbursement rates for CPT codes
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => toast.info("Feature coming soon")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratesWithDetails?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verified Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {ratesWithDetails?.filter(r => r.verified).length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assumed Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {ratesWithDetails?.filter(r => !r.verified).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Rates</CardTitle>
            <CardDescription>
              Comprehensive list of reimbursement rates by CPT code, payer, and site type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">CPT Code</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-left p-3 font-medium">Payer</th>
                    <th className="text-left p-3 font-medium">Site Type</th>
                    <th className="text-left p-3 font-medium">Component</th>
                    <th className="text-right p-3 font-medium">Rate</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ratesWithDetails?.map((rate) => (
                    <tr key={rate.id} className="border-b hover:bg-accent">
                      <td className="p-3 font-mono text-sm">{rate.cptCode}</td>
                      <td className="p-3 text-sm max-w-xs truncate">{rate.cptDescription}</td>
                      <td className="p-3 text-sm">
                        {rate.planName || rate.payerName || "Medicare"}
                      </td>
                      <td className="p-3">
                        <Badge variant={rate.siteType === "FPA" ? "default" : "secondary"}>
                          {rate.siteType}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{rate.component}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(rate.rate)}</td>
                      <td className="p-3 text-center">
                        {rate.verified ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Assumed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
