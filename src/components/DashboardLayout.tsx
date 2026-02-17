import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Building2, Clock, CheckCircle, Settings, LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "All Candidates", url: "/dashboard/candidates", icon: Users },
  { title: "Department View", url: "/dashboard/departments", icon: Building2 },
  { title: "Pending", url: "/dashboard/pending", icon: Clock },
  { title: "Verified", url: "/dashboard/verified", icon: CheckCircle },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarContent>
            <div className="flex items-center gap-3 p-4">
              <img
                src="/Gemini_Generated_Image_p5ko5pp5ko5pp5ko.png"
                alt="Logo"
                className="h-9 w-9 rounded-lg object-cover shadow-sm"
              />
              <span className="text-sm font-bold text-sidebar-foreground">People Drive Manager</span>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className="text-sidebar-foreground hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 space-y-2">
              <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-card px-6">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold text-foreground">HR Dashboard</h2>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
