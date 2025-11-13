import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { isGuestMode } from "@/lib/guestSession";
import { AlertCircle } from "lucide-react";

export default function GuestModeBanner() {
  if (!isGuestMode()) {
    return null;
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-900">
          <strong>Guest Mode Active:</strong> Your data will not be saved after this session ends.
        </span>
        <Button size="sm" variant="default" asChild>
          <a href={getLoginUrl()}>Sign In to Save Progress</a>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
