import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BarChart3, Database, Calculator, Users, UserCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: scenarios, isLoading: scenariosLoading } = trpc.scenarios.list.useQuery();
  const { data: rates, isLoading: ratesLoading } = trpc.rates.list.useQuery();
  const { data: payers, isLoading: payersLoading } = trpc.payers.list.useQuery();
  const { data: cptCodes, isLoading: cptLoading } = trpc.cptCodes.list.useQuery();

  const stats = [
    {
      title: "Total Scenarios",
      value: scenarios?.length || 0,
      icon: Calculator,
      description: "Created scenarios",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Rate Records",
      value: rates?.length || 0,
      icon: Database,
      description: "Configured rates",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Payers",
      value: payers?.length || 0,
      icon: Users,
      description: "Insurance payers",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "CPT Codes",
      value: cptCodes?.length || 0,
      icon: BarChart3,
      description: "Procedure codes",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your reimbursement modeling data
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setLocation("/scenarios")}
          >
            <CardHeader>
              <Calculator className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Create New Scenario</CardTitle>
              <CardDescription>
                Build a new reimbursement scenario with custom payer mix and procedure selection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setLocation("/rates")}
          >
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Manage Rates</CardTitle>
              <CardDescription>
                View and edit reimbursement rates for different CPT codes, payers, and site types
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <UserCheck className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Provider Valuations</CardTitle>
              <CardDescription>
                Analyze provider RVU productivity and revenue attribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={() => setLocation("/valuations/new")}
                  className="flex-1"
                >
                  Create New
                </Button>
                <Button 
                  onClick={() => setLocation("/valuations")}
                  variant="outline"
                  className="flex-1"
                >
                  View All
                </Button>
              </div>
              <Button 
                onClick={() => setLocation("/valuations/analytics")}
                variant="secondary"
                className="w-full"
              >
                📊 View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scenarios */}
        {scenarios && scenarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Scenarios</CardTitle>
              <CardDescription>
                Your most recently created reimbursement scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.slice(0, 5).map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setLocation(`/scenarios/${scenario.id}`)}
                  >
                    <div>
                      <p className="font-medium">{scenario.providerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {scenario.totalPatients} patients • {scenario.siteType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(scenario.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
