import { ReactNode, useState, useEffect } from 'react'
import { LayoutDashboard, BookOpen, BookMarked, User, LogOut, Settings, Sun, Moon } from 'lucide-react'
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

// User type definition
interface UserData {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  last_login: string | null;
}

interface LayoutProps {
  children: ReactNode
  currentPage: string
  setCurrentPage: (page: string) => void
  onLogout: () => void
  user: UserData | null  // Added user prop
}

export default function Layout({ children, currentPage, setCurrentPage, onLogout, user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('lexora-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('lexora-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U'
    const names = user.full_name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.full_name.substring(0, 2).toUpperCase()
  }

  // Get display name (fallback if user is null)
  const displayName = user?.full_name || 'User'
  const displayEmail = user?.email || 'user@library.com'
  const displayRole = user?.role || 'user'

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'borrowed', label: 'Borrowed', icon: BookMarked },
  ]

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen relative">
      {/* Altitude Gradient Background - Light/Dark Mode */}
      <div className="fixed inset-0 -z-10">
        {/* Light Mode Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F2E6EE] via-[#FFCCF3] to-[#0033FF] opacity-100 dark:opacity-0 transition-opacity duration-500">
          {/* Animated gradient orbs for depth - Light Mode */}
          <div className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #FFCCF3 100%)' }}></div>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"
               style={{ background: 'linear-gradient(135deg, #0033FF 0%, #0D33FF 100%)' }}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #0033FF 100%)' }}></div>
        </div>
        
        {/* Dark Mode Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#525269] via-[#495d94] to-[#174277] opacity-0 dark:opacity-100 transition-opacity duration-500">
          {/* Animated gradient orbs for depth - Dark Mode */}
          <div className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #FFCCF3 100%)' }}></div>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-2000"
               style={{ background: 'linear-gradient(135deg, #0033FF 0%, #0D33FF 100%)' }}></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-blob animation-delay-4000"
               style={{ background: 'linear-gradient(135deg, #9770FF 0%, #0033FF 100%)' }}></div>
        </div>
      </div>

      {/* Fixed Navigation - Always stays at top */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-0">
          <div className="flex h-20 items-center justify-between">
            {/* Mobile Menu Button + Logo - LEFT SIDE */}
            <div className="flex items-center gap-3">
              {/* Animated Hamburger Menu - Mobile Only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-foreground hover:bg-white/10 transition-all duration-200"
              >
                <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
                  <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
                <span className="sr-only">Open menu</span>
              </Button>

              {/* Logo */}
              <img 
                src="../public/lexora-icon.svg" 
                alt="Lexora" 
                className="h-10 w-auto"
              />
              <div className="flex flex-col">
                <h1 className="text-1xl md:text-3xl font-bold tracking-wide text-[#2B4C7E] dark:text-[#dbe8fc] transition-colors duration-300" style={{ fontFamily: 'Times, serif' }}>L E X O R A</h1>
                <p className="text-[9px] md:text-[10px] font-semibold tracking-[0.15em] text-[#1f437a] dark:text-[#dbe8fc] uppercase">
                Words That Open Worlds
              </p>
              </div>
            </div>
            
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
                        ? 'bg-white/20 text-foreground backdrop-blur-sm shadow-lg'
                        : 'text-foreground/70 hover:text-foreground hover:bg-white/10'
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
                className="rounded-full text-foreground hover:bg-white/10"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              {/* Profile Dropdown - Now with real user data */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                    <Avatar className="h-9 w-9 ring-2 ring-foreground/30">
                      <AvatarImage src="" alt={displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-[#9770FF] to-[#0033FF] text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{displayEmail}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {displayRole}
                        </span>
                      </p>
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
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:text-destructive" 
                    onClick={onLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile - Theme Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:bg-white/10"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar - Now with real user data */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-card/95 backdrop-blur-xl border-border">
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center gap-2">
                <img 
                  src="./public/Lexora-logo.svg" 
                  alt="Lexora" 
                  className="h-8 w-auto brightness-90 dark:brightness-200 transition-all duration-300"
                />
              </div>
            </SheetTitle>
            <SheetDescription>
              Navigate through the library management system
            </SheetDescription>
          </SheetHeader>
          
          {/* Mobile Profile Section - Now with real user data */}
          <div className="mt-6 mb-4 p-4 rounded-lg bg-gradient-to-r from-[#9770FF]/10 to-[#0033FF]/10 border border-[#9770FF]/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-[#9770FF]/50">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-[#9770FF] to-[#0033FF] text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1 capitalize">
                  {displayRole}
                </span>
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
              <button 
                className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-left w-full text-destructive hover:bg-destructive/10"
                onClick={onLogout}
              >
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