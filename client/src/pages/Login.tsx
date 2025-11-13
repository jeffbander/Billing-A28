import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { startGuestSession } from "@/lib/guestSession";
import { Calculator } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleGuestMode = () => {
    startGuestSession();
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className="h-16 w-16 rounded-md object-cover ring-1 ring-border"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
            <CardDescription className="mt-2">
              Model healthcare reimbursement scenarios with confidence
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <a href={getLoginUrl()}>
              Sign In with Manus
            </a>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGuestMode}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Continue as Guest
          </Button>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
            <p className="font-medium mb-1">Guest Mode Notice</p>
            <p className="text-xs text-amber-800">
              Guest sessions are temporary. Your data will not be saved after you close your browser.
              Sign in to save your scenarios permanently.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
