import { Link, useLocation } from "wouter";
import { Radio, Users, Settings, LogOut, Disc, Power } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { title: "Dashboard", url: "/", icon: Radio },
    { title: "Profile", url: "/profile", icon: Settings },
  ];

  return (
    <Sidebar variant="sidebar" className="border-r border-border/50 bg-card">
      <SidebarContent>
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Disc className="w-8 h-8 animate-[spin_4s_linear_infinite] shadow-neon-green rounded-full" />
            <div>
              <h2 className="font-display font-bold text-xl tracking-wider leading-none">Sh2</h2>
              <p className="text-[10px] font-mono text-primary/70 uppercase">Comms Link v2.0</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  >
                    <Link href={item.url} className="flex items-center gap-3 font-medium">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4 bg-background/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/30 shadow-[0_0_10px_rgba(57,255,20,0.15)]">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-secondary text-primary font-mono font-bold">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate text-foreground">{user?.firstName || "Agent"}</span>
              <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                ACTIVE
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Log Out"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
