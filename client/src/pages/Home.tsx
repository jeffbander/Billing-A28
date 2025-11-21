import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import { Calculator, BarChart3, Database, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { startGuestSession, isGuestMode } from "@/lib/guestSession";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated || isGuestMode()) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  // Handler to go to auth page
  const goToAuth = () => setLocation("/auth");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <Button onClick={goToAuth}>Sign In</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold text-foreground leading-tight">
            Model Healthcare Reimbursement with Confidence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compare revenue outcomes between Article 28 (hospital outpatient) and FPA (freestanding office) sites.
            Make data-driven decisions with comprehensive scenario analysis and payer mix modeling.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={goToAuth}>Sign In</Button>
            <Button size="lg" variant="outline" onClick={() => {
              startGuestSession();
              setLocation('/dashboard');
            }}>
              Continue as Guest
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Guest mode: Full access, session-only data (not saved)
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to model and compare healthcare reimbursement scenarios
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Rate Database</CardTitle>
              <CardDescription>
                Centralized rate management with verified Providerloop data and Medicare references
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Calculator className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Scenario Builder</CardTitle>
              <CardDescription>
                Create custom scenarios with payer mix, procedure mix, and site type selections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Visual Analytics</CardTitle>
              <CardDescription>
                Compare outcomes with interactive charts and detailed breakdowns by payer and CPT
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Revenue Modeling</CardTitle>
              <CardDescription>
                Simulate total revenue under different payer and procedure mixes with precision
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">How It Works</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to comprehensive reimbursement analysis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="text-xl font-semibold">Set Up Rates</h4>
              <p className="text-muted-foreground">
                Configure CPT codes, payers, and rates. Use verified data or default multipliers.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="text-xl font-semibold">Build Scenarios</h4>
              <p className="text-muted-foreground">
                Define patient volume, payer mix, procedure mix, and site type for your scenario.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h4 className="text-xl font-semibold">Compare Results</h4>
              <p className="text-muted-foreground">
                View detailed comparisons between FPA and Article 28 with visual analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-gradient-to-br from-primary to-teal-700 text-white border-0">
          <CardContent className="p-12 text-center space-y-6">
            <h3 className="text-3xl font-bold">Ready to Optimize Your Reimbursement?</h3>
            <p className="text-lg text-teal-50 max-w-2xl mx-auto">
              Start modeling scenarios today and make informed decisions about your site-of-service strategy.
            </p>
            <Button size="lg" variant="secondary" onClick={goToAuth}>
              Sign In to Get Started
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2025 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
