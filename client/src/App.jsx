import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";
import OfflineIndicator from "./components/OfflineIndicator";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import History from "./pages/History";
import Metrics from "./pages/Metrics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import "./lib/i18n";

const SHOW_NAV_PATHS = ["/", "/scan", "/history", "/metrics"];

function Router() {
  return (
    <Switch>
      <Route path="/"         component={Home} />
      <Route path="/scan"     component={Scanner} />
      <Route path="/history"  component={History} />
      <Route path="/metrics"  component={Metrics} />
      <Route path="/login"    component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/404"      component={NotFound} />
      <Route                  component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [location] = useLocation();
  const showNav = SHOW_NAV_PATHS.includes(location);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <OfflineIndicator />
      <TopBar />
      <Router />
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SupabaseAuthProvider>
          <TooltipProvider>
            <Toaster position="top-center" />
            <AppShell />
          </TooltipProvider>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
