import { 
  BookOpen, 
  Users, 
  BookMarked, 
  Home,
  Search,
  Settings,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function AppSidebar({ currentPage, setCurrentPage }: { 
  currentPage: string
  setCurrentPage: (page: string) => void 
}) {
  const { state } = useSidebar();
  
  const mainMenuItems = [
    { name: "Dashboard", page: "dashboard", icon: Home },
    { name: "Students", page: "students", icon: Users },
    { name: "Books", page: "books", icon: BookOpen },
    { name: "Borrowed", page: "borrowed", icon: BookMarked },
  ];

  const reportsMenuItems = [
    { name: "Analytics", page: "analytics", icon: BarChart3 },
    { name: "Settings", page: "settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          {state === "expanded" && (
            <h2 className="text-lg font-bold">Library System</h2>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Search Input - Only visible when expanded */}
        {state === "expanded" && (
          <SidebarGroup>
            <SidebarGroupContent className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8"
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Separator className="my-2" />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.page;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      tooltip={item.name}
                      isActive={isActive}
                      onClick={() => setCurrentPage(item.page)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Reports Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Reports & Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.page;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      tooltip={item.name}
                      isActive={isActive}
                      onClick={() => setCurrentPage(item.page)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Profile">
              <div className="flex items-center gap-3 w-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  A
                </div>
                {state === "expanded" && (
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">Admin User</span>
                    <span className="text-xs text-muted-foreground truncate">admin@library.com</span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}