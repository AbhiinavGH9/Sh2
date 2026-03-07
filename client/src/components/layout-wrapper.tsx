import { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Activity } from "lucide-react";

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{children}</>;

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 relative">
          <header className="absolute top-0 w-full flex items-center justify-between p-4 z-50 pointer-events-none">
            <SidebarTrigger className="pointer-events-auto bg-card border border-border text-foreground hover:text-primary hover:border-primary/50 transition-all shadow-lg" />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur border border-white/5 shadow-xl">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-mono text-primary font-bold">VIBECODE SYS_ONLINE</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto w-full pt-16">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
