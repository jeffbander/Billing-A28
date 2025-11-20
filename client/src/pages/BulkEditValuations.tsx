import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActivityChange {
  cptCodeId: number;
  monthlyPerforms: number;
}

export default function BulkEditValuations() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  
  // Get valuation IDs from URL query params
  const params = new URLSearchParams(window.location.search);
  const valuationIds = params.get("ids")?.split(",").map(Number) || [];
  
  const [activityChanges, setActivityChanges] = useState<ActivityChange[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { data: valuations } = trpc.valuations.list.useQuery();
  const { data: cptCodes } = trpc.cptCodes.list.useQuery();
  
  const selectedValuations = valuations?.filter((v) => valuationIds.includes(v.id));
  
  const bulkUpdate = trpc.valuations.update.useMutation({
    onSuccess: () => {
      toast.success("Bulk update completed successfully");
      navigate("/valuations");
    },
    onError: (error) => {
      toast.error(`Failed to update valuations: ${error.message}`);
    },
  });
  
  const addActivityChange = () => {
    setActivityChanges([
      ...activityChanges,
      { cptCodeId: 0, monthlyPerforms: 0 },
    ]);
  };
  
  const removeActivityChange = (index: number) => {
    setActivityChanges(activityChanges.filter((_, i) => i !== index));
  };
  
  const updateActivityChange = (index: number, field: keyof ActivityChange, value: number) => {
    const updated = [...activityChanges];
    updated[index] = { ...updated[index], [field]: value };
    setActivityChanges(updated);
  };
  
  const handleBulkUpdate = async () => {
    if (activityChanges.length === 0) {
      toast.error("Please add at least one CPT code change");
      return;
    }
    
    if (activityChanges.some((a) => a.cptCodeId === 0)) {
      toast.error("Please select a CPT code for all activities");
      return;
    }
    
    setShowConfirmDialog(true);
  };
  
  const confirmBulkUpdate = async () => {
    setShowConfirmDialog(false);
    
    // Apply changes to each valuation
    for (const valuationId of valuationIds) {
      try {
        await bulkUpdate.mutateAsync({
          id: valuationId,
          activities: activityChanges.map((change) => ({
            cptCodeId: change.cptCodeId,
            monthlyOrders: 0,
            monthlyReads: 0,
            monthlyPerforms: change.monthlyPerforms,
          })),
        });
      } catch (error) {
        console.error(`Failed to update valuation ${valuationId}:`, error);
      }
    }
  };
  
  if (valuationIds.length === 0) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>No Valuations Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please select valuations from the list to bulk edit.
              </p>
              <Button onClick={() => navigate("/valuations")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/valuations")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Bulk Edit Valuations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Apply CPT code changes to {valuationIds.length} selected valuation{valuationIds.length !== 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Valuations */}
            <div>
              <Label>Selected Valuations</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedValuations?.map((v) => (
                  <Badge key={v.id} variant="secondary">
                    {v.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* CPT Code Changes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>CPT Code Changes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addActivityChange}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add CPT Code
                </Button>
              </div>
              
              <div className="space-y-3">
                {activityChanges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No CPT code changes added yet. Click "Add CPT Code" to start.
                  </p>
                ) : (
                  activityChanges.map((change, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Label htmlFor={`cpt-${index}`}>CPT Code</Label>
                            <Select
                              value={change.cptCodeId.toString()}
                              onValueChange={(value) =>
                                updateActivityChange(index, "cptCodeId", parseInt(value))
                              }
                            >
                              <SelectTrigger id={`cpt-${index}`}>
                                <SelectValue placeholder="Select CPT code" />
                              </SelectTrigger>
                              <SelectContent>
                                {cptCodes?.map((cpt: any) => (
                                  <SelectItem key={cpt.id} value={cpt.id.toString()}>
                                    {cpt.code} - {cpt.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="w-32">
                            <Label htmlFor={`performs-${index}`}>Performs/Month</Label>
                            <Input
                              id={`performs-${index}`}
                              type="number"
                              value={change.monthlyPerforms}
                              onChange={(e) =>
                                updateActivityChange(
                                  index,
                                  "monthlyPerforms",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeActivityChange(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate("/valuations")} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                disabled={activityChanges.length === 0 || bulkUpdate.isPending}
              >
                {bulkUpdate.isPending ? "Updating..." : "Apply Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all CPT activities in {valuationIds.length} valuation
              {valuationIds.length !== 1 ? "s" : ""} with the changes you specified.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkUpdate}>
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
