import { ReactNode, useState } from 'react'
import { Menu, LayoutDashboard, BookOpen, BookMarked, User, LogOut, Settings, Sun, Moon } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from '@/components/ui/theme-provider'

interface LayoutProps {
  children: ReactNode
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function Layout({ children, currentPage, setCurrentPage }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'borrowed', label: 'Borrowed', icon: BookMarked },
  ]

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId)
    setIsMobileMenuOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen relative">
      {/* Altitude Gradient Background */}
      <div className="fixed inset-0 -z-10">
        {/* Light Mode: Gradient 1 → 2 → 3 → 4 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F2E6EE] via-[#FFCCF3] via-[#9770FF] to-[#0033FF] dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]">
          {/* Animated gradient orbs for depth */}
          <div className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-60 dark:opacity-40 animate-blob"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #FFCCF3 100%)' }}></div>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-60 dark:opacity-40 animate-blob animation-delay-2000"
               style={{ background: 'linear-gradient(135deg, #0033FF 0%, #0D33FF 100%)' }}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-60 dark:opacity-40 animate-blob animation-delay-4000"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #0033FF 100%)' }}></div>
        </div>
      </div>

      {/* Fixed Navigation - Always stays at top */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Brand - Black in light mode, White in dark mode */}
            <h1 className="text-xl font-bold text-black dark:text-white drop-shadow-lg">
              NEMCO Library System
            </h1>
            
            {/* Desktop Navigation - Right Aligned */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-white/20 text-black dark:text-white backdrop-blur-sm shadow-lg'
                        : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
              
              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full text-black dark:text-white hover:bg-white/10"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                    <Avatar className="h-9 w-9 ring-2 ring-black/30 dark:ring-white/30">
                      <AvatarImage src="" alt="Admin" />
                      <AvatarFallback className="bg-gradient-to-br from-[#9770FF] to-[#0033FF] text-white">
                        AD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Admin User</p>
                      <p className="text-xs text-muted-foreground">admin@library.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Mobile Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-black dark:text-white hover:bg-white/10"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-black dark:text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20">
          <SheetHeader>
            <SheetTitle>Library System</SheetTitle>
            <SheetDescription>
              Navigate through the library management system
            </SheetDescription>
          </SheetHeader>
          
          {/* Mobile Profile Section */}
          <div className="mt-6 mb-4 p-4 rounded-lg bg-gradient-to-r from-[#9770FF]/10 to-[#0033FF]/10 border border-[#9770FF]/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-[#9770FF]/50">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="bg-gradient-to-br from-[#9770FF] to-[#0033FF] text-white">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@library.com</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-left ${
                    currentPage === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
            
            {/* Mobile Profile Links */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <button className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-left w-full text-muted-foreground hover:text-foreground hover:bg-accent">
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-left w-full text-muted-foreground hover:text-foreground hover:bg-accent">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-left w-full text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log out</span>
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content - Add padding top to prevent content from hiding under fixed nav */}
      <main className="container mx-auto px-4 py-8 pt-24 relative">
        {children}
      </main>

      {/* Custom animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}