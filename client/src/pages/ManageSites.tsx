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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ManageSites() {
  const { user, loading: authLoading } = useAuth();
  const { data: sites, isLoading: sitesLoading, refetch } = trpc.admin.listSites.useQuery();
  const { data: institutions, isLoading: institutionsLoading } = trpc.admin.listInstitutions.useQuery();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    siteType: "FPA" as "FPA" | "Article28",
    institutionId: 0,
    active: true,
    notes: "",
  });

  const createMutation = trpc.admin.createSite.useMutation({
    onSuccess: () => {
      toast.success("✅ Site created successfully");
      refetch();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create site: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.updateSite.useMutation({
    onSuccess: () => {
      toast.success("✅ Site updated successfully");
      refetch();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update site: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.deleteSite.useMutation({
    onSuccess: () => {
      toast.success("✅ Site deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete site: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", siteType: "FPA", institutionId: 0, active: true, notes: "" });
    setEditingId(null);
  };

  const handleOpenDialog = (site?: any) => {
    if (site) {
      setEditingId(site.id);
      setFormData({
        name: site.name,
        siteType: site.siteType,
        institutionId: site.institutionId,
        active: site.active,
        notes: site.notes || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Site name is required");
      return;
    }
    if (!formData.institutionId) {
      toast.error("Institution is required");
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

  if (authLoading || sitesLoading || institutionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading sites...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Sites</h1>
            <p className="text-muted-foreground mt-1">
              Manage practice sites (FPA and Article 28) for revenue attribution
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Sites
            </CardTitle>
            <CardDescription>
              {sites?.length || 0} site{sites?.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sites || sites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sites configured yet. Click "Add Site" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Site Type</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <Badge variant={site.siteType === "FPA" ? "default" : "secondary"}>
                          {site.siteType}
                        </Badge>
                      </TableCell>
                      <TableCell>{getInstitutionName(site.institutionId)}</TableCell>
                      <TableCell>
                        <Badge variant={site.active ? "default" : "outline"}>
                          {site.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                        {site.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(site)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(site.id, site.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Site" : "Add New Site"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the site information below"
                : "Create a new practice site for revenue attribution"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mount Sinai West"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteType">Site Type *</Label>
              <Select
                value={formData.siteType}
                onValueChange={(value: "FPA" | "Article28") =>
                  setFormData({ ...formData, siteType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FPA">FPA (Freestanding Office)</SelectItem>
                  <SelectItem value="Article28">Article 28 (Hospital Outpatient)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.siteType === "FPA" 
                  ? "FPA sites use global payment rates"
                  : "Article 28 sites split professional and technical components"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution *</Label>
              <Select
                value={formData.institutionId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, institutionId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions?.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id.toString()}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this site..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Active</Label>
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
    </DashboardLayout>
  );
}
