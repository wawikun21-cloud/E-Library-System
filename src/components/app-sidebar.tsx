import {
  BookOpen,
  BookMarked,
  Home,
  Search,
  BarChart3,
  User,
  Lock,
} from "lucide-react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { authService } from "@/lib/api";

export function AppSidebar({ currentPage, setCurrentPage }: { 
  currentPage: string
  setCurrentPage: (page: string) => void 
}) {
  const { state } = useSidebar();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Profile form state
  const [fullName, setFullName] = useState(userData.full_name || '');
  const [username, setUsername] = useState(userData.username || '');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const mainMenuItems = [
    { name: "Dashboard", page: "dashboard", icon: Home },
    { name: "Books", page: "books", icon: BookOpen },
    { name: "Borrowed", page: "borrowed", icon: BookMarked },
  ];

  const reportsMenuItems = [
    { name: "Analytics", page: "analytics", icon: BarChart3 },
  ];

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setError("");
    setSuccess("");
    // Reset form to current user data
    setFullName(userData.full_name || '');
    setUsername(userData.username || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Validate inputs
      if (!fullName.trim() || !username.trim()) {
        setError("Full name and username are required");
        setIsLoading(false);
        return;
      }

      // Update profile
      const response = await authService.updateProfile(
        userData.user_id,
        fullName.trim(),
        username.trim()
      );

      if (response.success) {
        // Update localStorage
        const updatedUser = {
          ...userData,
          full_name: fullName.trim(),
          username: username.trim(),
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccess("Profile updated successfully!");
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setIsProfileModalOpen(false);
          window.location.reload(); // Reload to reflect changes
        }, 1500);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Validate inputs
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("All password fields are required");
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        setIsLoading(false);
        return;
      }

      // Update password
      const response = await authService.updatePassword(
        userData.user_id,
        currentPassword,
        newPassword
      );

      if (response.success) {
        setSuccess("Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setIsProfileModalOpen(false);
        }, 1500);
      } else {
        setError(response.message || "Failed to update password");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
            <SidebarGroupLabel>Reports</SidebarGroupLabel>
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
              <SidebarMenuButton 
                tooltip="Profile"
                onClick={handleProfileClick}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {userData.full_name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  {state === "expanded" && (
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{userData.full_name || 'Admin User'}</span>
                      <span className="text-xs text-muted-foreground truncate">{userData.email || 'admin@library.com'}</span>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Profile Edit Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and change your password
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Profile Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="h-4 w-4" />
                <span>Profile Information</span>
              </div>
              
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Change Password Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </div>
              
              <div className="space-y-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  onClick={handleUpdatePassword}
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsProfileModalOpen(false)}
              disabled={isLoading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}