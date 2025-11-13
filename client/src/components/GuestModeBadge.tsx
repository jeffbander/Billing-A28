import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { isGuestMode } from "@/lib/guestSession";

export function GuestModeBadge() {
  if (!isGuestMode()) {
    return null;
  }

  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <Eye className="h-3 w-3" />
      Guest Mode
    </Badge>
  );
}
