import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

import { LayoutWrapper } from "@/components/layout-wrapper";
import { LandingPage } from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard";
import { ProfilePage } from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { Disc } from "lucide-react";

function ProtectedRoutes() {
  return (
    <LayoutWrapper>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </LayoutWrapper>
  );
}

function Main() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-primary">
        <Disc className="w-12 h-12 animate-[spin_2s_linear_infinite] shadow-neon-green rounded-full mb-4" />
        <p className="font-mono text-sm tracking-widest animate-pulse">ESTABLISHING UPLINK...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <ProtectedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Main />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
