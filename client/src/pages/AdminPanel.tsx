import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Shield, ShieldOff, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const { data: calcSettings, refetch: refetchSettings } = trpc.admin.getCalculationSettings.useQuery();
  
  const [commercialMultiplier, setCommercialMultiplier] = useState<string>("1.50");
  const [medicaidMultiplier, setMedicaidMultiplier] = useState<string>("0.80");
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (calcSettings) {
      setCommercialMultiplier((calcSettings.commercialTechnicalMultiplier / 100).toFixed(2));
      setMedicaidMultiplier((calcSettings.medicaidTechnicalMultiplier / 100).toFixed(2));
    }
  }, [calcSettings]);
  
  const setRoleMutation = trpc.admin.setRole.useMutation({
    onSuccess: (_, variables) => {
      const targetUser = users?.find(u => u.id === variables.userId);
      const newRole = variables.role === 'admin' ? 'an admin' : 'a user';
      toast.success(`✅ ${targetUser?.name || targetUser?.email} is now ${newRole}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
  
  const updateSettingsMutation = trpc.admin.updateCalculationSettings.useMutation({
    onSuccess: () => {
      toast.success("✅ Calculation settings updated successfully");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const handleSetRole = (userId: number, role: 'admin' | 'user') => {
    setRoleMutation.mutate({ userId, role });
  };
  
  const handleSaveSettings = () => {
    const commercial = parseFloat(commercialMultiplier);
    const medicaid = parseFloat(medicaidMultiplier);
    
    if (isNaN(commercial) || commercial < 0.5 || commercial > 3.0) {
      toast.error("Commercial multiplier must be between 0.5 and 3.0");
      return;
    }
    
    if (isNaN(medicaid) || medicaid < 0.5 || medicaid > 3.0) {
      toast.error("Medicaid multiplier must be between 0.5 and 3.0");
      return;
    }
    
    updateSettingsMutation.mutate({
      commercialTechnicalMultiplier: Math.round(commercial * 100),
      medicaidTechnicalMultiplier: Math.round(medicaid * 100),
    });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-8">
        {/* Calculation Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>Rate Calculation Settings</CardTitle>
            </div>
            <CardDescription>
              Configure multipliers for calculated rate mode. These multipliers are applied to Medicare Technical rates to calculate Commercial and Medicaid Technical rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commercial-multiplier">
                  Commercial Technical Multiplier
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="commercial-multiplier"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={commercialMultiplier}
                    onChange={(e) => setCommercialMultiplier(e.target.value)}
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">
                    × Medicare Technical Rate
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Range: 0.5x to 3.0x (e.g., 1.5 = 150% of Medicare rate)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicaid-multiplier">
                  Medicaid Technical Multiplier
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="medicaid-multiplier"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={medicaidMultiplier}
                    onChange={(e) => setMedicaidMultiplier(e.target.value)}
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">
                    × Medicare Technical Rate
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Range: 0.5x to 3.0x (e.g., 0.8 = 80% of Medicare rate)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <p className="font-medium">How Calculated Rates Work:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Professional & Global components:</strong> Always use manually entered rates</li>
                  <li><strong>Technical component:</strong> Medicare rate is manually entered (source of truth)</li>
                  <li><strong>Commercial Technical:</strong> Medicare Technical × Commercial Multiplier</li>
                  <li><strong>Medicaid Technical:</strong> Medicare Technical × Medicaid Multiplier</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
        
        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Management Panel</CardTitle>
            <CardDescription>
              Manage user roles and permissions. All logged-in users can promote or demote admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell>{u.email || "—"}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetRole(u.id, 'user')}
                          disabled={setRoleMutation.isPending}
                        >
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Remove Admin
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSetRole(u.id, 'admin')}
                          disabled={setRoleMutation.isPending}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
