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


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/rates"} component={RatesManagement} />
      <Route path={"/payers"} component={PayersManagement} />

      <Route path={"/scenarios"} component={ScenarioBuilder} />
      <Route path={"/scenarios/:id"} component={ScenarioResults} />
      <Route path={"/admin"} component={AdminPanel} />
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
