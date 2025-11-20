import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";

interface ActivityInput {
  id?: number; // Include ID for existing activities
  cptCodeId: number;
  monthlyOrders: number;
  monthlyReads: number;
  monthlyPerforms: number;
}

export default function EditValuation() {
  const [, params] = useRoute("/valuations/:id/edit");
  const valuationId = params?.id ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [monthlyPatients, setMonthlyPatients] = useState(0);
  const [activities, setActivities] = useState<ActivityInput[]>([]);

  // Fetch existing valuation data
  const { data: valuation, isLoading: loadingValuation } = trpc.valuations.getById.useQuery(
    { id: valuationId },
    { enabled: valuationId > 0 }
  );

  // Fetch existing activities
  const { data: existingActivities, isLoading: loadingActivities } =
    trpc.valuations.getActivities.useQuery(
      { valuationId },
      { enabled: valuationId > 0 }
    );

  // Fetch providers and CPT codes
  const { data: providers } = trpc.admin.listActiveProviders.useQuery();
  const { data: cptCodes } = trpc.cptCodes.list.useQuery();

  // Pre-populate form when data loads
  useEffect(() => {
    if (valuation) {
      setName(valuation.name);
      setDescription(valuation.description || "");
      setProviderId(valuation.providerId);
      setMonthlyPatients(valuation.monthlyPatients || 0);
    }
  }, [valuation]);

  useEffect(() => {
    if (existingActivities && existingActivities.length > 0) {
      setActivities(
        existingActivities.map((a: any) => ({
          id: a.id,
          cptCodeId: a.cptCodeId,
          monthlyOrders: a.monthlyOrders || 0,
          monthlyReads: a.monthlyReads || 0,
          monthlyPerforms: a.monthlyPerforms || 0,
        }))
      );
    }
  }, [existingActivities]);

  const updateMutation = trpc.valuations.update.useMutation({
    onSuccess: (data) => {
      toast.success("Valuation updated successfully");
      navigate(`/valuations/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to update valuation: ${error.message}`);
    },
  });

  const selectedProvider = providers?.find((p: any) => p.id === providerId);

  const addActivity = () => {
    setActivities([
      ...activities,
      { cptCodeId: 0, monthlyOrders: 0, monthlyReads: 0, monthlyPerforms: 0 },
    ]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const updateActivity = (index: number, field: keyof ActivityInput, value: number) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a valuation name");
      return;
    }

    if (!providerId) {
      toast.error("Please select a provider");
      return;
    }

    if (activities.length === 0) {
      toast.error("Please add at least one CPT code activity");
      return;
    }

    // Validate all activities have a CPT code selected
    const invalidActivity = activities.find((a) => a.cptCodeId === 0);
    if (invalidActivity) {
      toast.error("Please select a CPT code for all activities");
      return;
    }

    updateMutation.mutate({
      id: valuationId,
      name: name.trim(),
      description: description.trim() || undefined,
      providerId,
      monthlyPatients,
      activities: activities.map((a) => ({
        cptCodeId: a.cptCodeId,
        monthlyOrders: a.monthlyOrders || 0,
        monthlyReads: a.monthlyReads || 0,
        monthlyPerforms: a.monthlyPerforms || 0,
      })),
    });
  };

  if (loadingValuation || loadingActivities) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!valuation) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Valuation Not Found</CardTitle>
            <CardDescription>The requested valuation could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/valuations")}>Back to List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Provider Valuation</h1>
        <p className="text-muted-foreground">
          Modify CPT code activities and provider details
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Valuation name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Valuation Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dr. Bander Monthly Analysis"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this valuation..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Provider Selection
            </CardTitle>
            <CardDescription>Select the provider to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Provider *</Label>
              <Select
                value={providerId?.toString()}
                onValueChange={(value) => setProviderId(parseInt(value))}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                          {providers?.map((provider: any) => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name} ({provider.providerType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProvider && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Provider Type:</div>
                  <div className="font-medium">{selectedProvider.providerType}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Home Institution:</div>
                  <div className="font-medium">{selectedProvider.homeInstitutionId}</div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="monthlyPatients">Monthly Patient Visits</Label>
              <Input
                id="monthlyPatients"
                type="number"
                value={monthlyPatients}
                onChange={(e) => setMonthlyPatients(parseInt(e.target.value) || 0)}
                placeholder="e.g., 200"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Number of patient visits per month (for context)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CPT Code Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              CPT Code Activities
            </CardTitle>
            <CardDescription>Specify monthly volumes for each CPT code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities added yet.
                <br />
                Click "Add CPT Code" to get started.
              </div>
            ) : (
              activities.map((activity, index) => {
                const selectedCpt = cptCodes?.find((c) => c.id === activity.cptCodeId);
                const isImaging = selectedCpt?.procedureType === "imaging";

                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">CPT Code #{index + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>CPT Code</Label>
                        <Select
                          value={activity.cptCodeId.toString()}
                          onValueChange={(value) =>
                            updateActivity(index, "cptCodeId", parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CPT code" />
                          </SelectTrigger>
                          <SelectContent>
                            {cptCodes?.map((cpt) => (
                              <SelectItem key={cpt.id} value={cpt.id.toString()}>
                                {cpt.code} - {cpt.description}
                                {cpt.procedureType === "imaging" && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Imaging)
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {isImaging ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Orders/Month</Label>
                            <Input
                              type="number"
                              value={activity.monthlyOrders}
                              onChange={(e) =>
                                updateActivity(
                                  index,
                                  "monthlyOrders",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="How many ordered"
                            />
                          </div>
                          <div>
                            <Label>Reads/Month</Label>
                            <Input
                              type="number"
                              value={activity.monthlyReads}
                              onChange={(e) =>
                                updateActivity(
                                  index,
                                  "monthlyReads",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="How many read"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label>Performs/Month</Label>
                          <Input
                            type="number"
                            value={activity.monthlyPerforms}
                            onChange={(e) =>
                              updateActivity(
                                index,
                                "monthlyPerforms",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="How many performed"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            How many performed
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}

            <Button variant="outline" onClick={addActivity} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add CPT Code
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/valuations")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Valuation
          </Button>
        </div>
      </div>
    </div>
  );
}
