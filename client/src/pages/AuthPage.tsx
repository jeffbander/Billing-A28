import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function AuthPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Welcome to {APP_TITLE}</CardTitle>
          <CardDescription>
            Sign in to save your work, or continue as a guest to explore with session-only data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            size="lg"
            asChild
          >
            <a href={getLoginUrl()}>
              Sign In with Manus
            </a>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            size="lg"
            asChild
          >
            <a href="/guest">
              Continue as Guest
            </a>
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            <strong>Guest Mode:</strong> Full access to all features. Your data will only exist during this session and won't be saved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
