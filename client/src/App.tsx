import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RatesManagement from "./pages/RatesManagement";
import PayersManagement from "./pages/PayersManagement";
import ScenarioBuilder from "./pages/ScenarioBuilder";
import ScenarioResults from "./pages/ScenarioResults.tsx";
import AdminPanel from "./pages/AdminPanel";
import AuthPage from "./pages/AuthPage";
import GuestRedirect from "./pages/GuestRedirect";
import ManageInstitutions from "./pages/ManageInstitutions";
import ManageProviders from "./pages/ManageProviders";
import ManageSites from "./pages/ManageSites";
import ValuationBuilder from "./pages/ValuationBuilder";
import ValuationResults from "./pages/ValuationResults";
import ValuationList from "./pages/ValuationList";
import ValuationComparison from "@/pages/ValuationComparison";
import ValuationAnalytics from "@/pages/ValuationAnalytics";
import EditValuation from "./pages/EditValuation";
import BulkEditValuations from "./pages/BulkEditValuations";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/auth"} component={AuthPage} />
      <Route path={"/guest"} component={GuestRedirect} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/rates"} component={RatesManagement} />
      <Route path={"/payers"} component={PayersManagement} />

      <Route path={"/scenarios"} component={ScenarioBuilder} />
      <Route path={"/scenarios/:id"} component={ScenarioResults} />
      <Route path={"/valuations"} component={ValuationList} />
        <Route path="/valuations/compare" component={ValuationComparison} />
      <Route path="/valuations/analytics" component={ValuationAnalytics} />
      <Route path={"/valuations/:id/edit"} component={EditValuation} />
      <Route path={"/valuations/bulk-edit"} component={BulkEditValuations} />
      <Route path={"/valuations/new"} component={ValuationBuilder} />
      <Route path={"/valuations/:id"} component={ValuationResults} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/admin/institutions"} component={ManageInstitutions} />
      <Route path={"/admin/sites"} component={ManageSites} />
      <Route path={"/admin/providers"} component={ManageProviders} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
