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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { UserCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const PROVIDER_TYPE_LABELS = {
  Type1: "Type 1 - Article 28 Provider",
  Type2: "Type 2 - Visiting Provider",
  Type3: "Type 3 - Referring Provider",
};

const PROVIDER_TYPE_DESCRIPTIONS = {
  Type1: "Professional $ + RVUs stay at home institution (Article 28)",
  Type2: "Professional $ + RVUs go to home institution, Technical $ to facility",
  Type3: "Generates referrals only, no direct patient care",
};

export default function ManageProviders() {
  const { user, loading: authLoading } = useAuth();
  const { data: providers, isLoading, refetch } = trpc.admin.listProviders.useQuery();
  const { data: institutions } = trpc.admin.listActiveInstitutions.useQuery();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    providerType: "Type1" as "Type1" | "Type2" | "Type3",
    homeInstitutionId: 0,
    active: true,
    notes: "",
  });

  const createMutation = trpc.admin.createProvider.useMutation({
    onSuccess: () => {
      toast.success("✅ Provider created successfully");
      refetch();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create provider: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.updateProvider.useMutation({
    onSuccess: () => {
      toast.success("✅ Provider updated successfully");
      refetch();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update provider: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.deleteProvider.useMutation({
    onSuccess: () => {
      toast.success("✅ Provider deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete provider: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      providerType: "Type1",
      homeInstitutionId: institutions?.[0]?.id || 0,
      active: true,
      notes: "",
    });
    setEditingId(null);
  };

  const handleOpenDialog = (provider?: any) => {
    if (provider) {
      setEditingId(provider.id);
      setFormData({
        name: provider.name,
        providerType: provider.providerType,
        homeInstitutionId: provider.homeInstitutionId,
        active: provider.active,
        notes: provider.notes || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Provider name is required");
      return;
    }

    if (!formData.homeInstitutionId) {
      toast.error("Home institution is required");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getInstitutionName = (institutionId: number) => {
    return institutions?.find(i => i.id === institutionId)?.name || "Unknown";
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading providers...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Providers</h1>
            <p className="text-muted-foreground mt-1">
              Manage physician profiles and their relationship with Mount Sinai West
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} disabled={!institutions || institutions.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>

        {!institutions || institutions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Please create at least one institution before adding providers.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Providers
              </CardTitle>
              <CardDescription>
                Track provider types and home institutions for revenue and RVU attribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providers && providers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Home Institution</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {provider.providerType}
                          </Badge>
                        </TableCell>
                        <TableCell>{getInstitutionName(provider.homeInstitutionId)}</TableCell>
                        <TableCell>
                          {provider.active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(provider)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(provider.id, provider.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No providers found. Add your first provider to get started.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Provider" : "Add New Provider"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update provider details below"
                  : "Add a new provider to track revenue and RVU attribution"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Provider Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dr. Jeffrey Bander"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="providerType">Provider Type *</Label>
                <Select
                  value={formData.providerType}
                  onValueChange={(value: "Type1" | "Type2" | "Type3") =>
                    setFormData({ ...formData, providerType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {PROVIDER_TYPE_DESCRIPTIONS[value as keyof typeof PROVIDER_TYPE_DESCRIPTIONS]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="homeInstitutionId">Home Institution *</Label>
                <Select
                  value={formData.homeInstitutionId.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, homeInstitutionId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions?.map((institution) => (
                      <SelectItem key={institution.id} value={institution.id.toString()}>
                        {institution.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this provider..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
