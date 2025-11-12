import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function PayersManagement() {
  const { data: payers, isLoading: payersLoading } = trpc.payers.list.useQuery();
  const { data: plans, isLoading: plansLoading } = trpc.plans.list.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  const isAdmin = user?.role === "admin";
  const isLoading = payersLoading || plansLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getPayerTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Medicare":
        return "default";
      case "Medicaid":
        return "secondary";
      case "Commercial":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payer Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage insurance payers and their associated plans
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={() => toast.info("Feature coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payer
              </Button>
              <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Payers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payers?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Commercial Payers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payers?.filter(p => p.payerType === "Commercial").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payers</CardTitle>
            <CardDescription>
              List of all insurance payers in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Payer Name</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Plans</th>
                    <th className="text-left p-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payers?.map((payer) => {
                    const payerPlans = plans?.filter(p => p.payerId === payer.id) || [];
                    return (
                      <tr key={payer.id} className="border-b hover:bg-accent">
                        <td className="p-3 font-medium">{payer.payerName}</td>
                        <td className="p-3">
                          <Badge variant={getPayerTypeBadgeVariant(payer.payerType)}>
                            {payer.payerType}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {payerPlans.length} plan{payerPlans.length !== 1 ? 's' : ''}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(payer.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Plans Table */}
        {plans && plans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Insurance Plans</CardTitle>
              <CardDescription>
                Specific insurance plans associated with payers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Plan Name</th>
                      <th className="text-left p-3 font-medium">Payer</th>
                      <th className="text-left p-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => {
                      const payer = payers?.find(p => p.id === plan.payerId);
                      return (
                        <tr key={plan.id} className="border-b hover:bg-accent">
                          <td className="p-3 font-medium">{plan.planName}</td>
                          <td className="p-3 text-sm">{payer?.payerName || "Unknown"}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
