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
        <div className="absolute inset-0 bg-gradient-to-br from-[#F2E6EE] via-[#FFCCF3] to-[#0033FF] dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]">
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
        <div className="container mx-auto px-10">
          <div className="flex h-20 items-center justify-between">
            {/* Mobile Menu Button + Logo - LEFT SIDE */}
            <div className="flex items-center gap-3">
              {/* Animated Hamburger Menu - Mobile Only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-black dark:text-white hover:bg-white/10 transition-all duration-200"
              >
                <div className="relative w-5 h-5 flex flex-col justify-center gap-1">
                  <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
                <span className="sr-only">Open menu</span>
              </Button>

              {/* Logo */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 1500 1500" 
                className="h-10 w-10"
              >
                <defs>
                  <filter x="0%" y="0%" width="100%" height="100%" id="04cefa66ed">
                    <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" colorInterpolationFilters="sRGB"/>
                  </filter>
                </defs>
                <g transform="matrix(1, 0, 0, 1, 367, 147)">
                  <g fill="#ffcc00" fillOpacity="1">
                    <g transform="translate(0.352463, 823.196833)">
                      <path d="M 401.578125 -767.578125 C 361.796875 -767.578125 333.300781 -761.265625 316.09375 -748.640625 C 298.882812 -736.023438 290.28125 -710.597656 290.28125 -672.359375 L 290.28125 -96.375 C 290.28125 -80.3125 293.53125 -68.835938 300.03125 -61.953125 C 306.53125 -55.066406 317.429688 -51.625 332.734375 -51.625 L 503.6875 -51.625 C 543.46875 -51.625 576.359375 -56.785156 602.359375 -67.109375 C 628.367188 -77.441406 650.742188 -94.269531 669.484375 -117.59375 C 688.222656 -140.925781 706.390625 -174.007812 723.984375 -216.84375 L 743.484375 -209.96875 L 676.9375 0 L 48.1875 0 L 48.1875 -20.65625 L 56.21875 -20.65625 C 95.226562 -20.65625 123.335938 -27.535156 140.546875 -41.296875 C 157.753906 -55.066406 166.359375 -79.929688 166.359375 -115.890625 L 166.359375 -673.5 C 166.359375 -708.6875 157.367188 -733.160156 139.390625 -746.921875 C 121.421875 -760.691406 93.316406 -767.578125 55.078125 -767.578125 L 48.1875 -767.578125 L 48.1875 -788.234375 L 401.578125 -788.234375 Z M 401.578125 -767.578125"/>
                    </g>
                  </g>
                </g>
                <path fill="#ffcc00" d="M 93.988281 1137.414062 L 128.601562 1177.882812 L 147.8125 1231.527344 C 147.8125 1231.527344 306.3125 1211.273438 456.9375 1255.898438 C 607.5625 1300.535156 750.304688 1410.054688 750.304688 1410.054688 C 750.304688 1410.054688 643.519531 1278.933594 479.441406 1210.777344 C 315.355469 1142.617188 93.988281 1137.414062 93.988281 1137.414062"/>
                <path fill="#ffcc00" d="M 1406.351562 1137.414062 L 1371.742188 1177.882812 L 1352.53125 1231.527344 C 1352.53125 1231.527344 1194.03125 1211.273438 1043.40625 1255.898438 C 892.777344 1300.535156 750.039062 1410.054688 750.039062 1410.054688 C 750.039062 1410.054688 856.824219 1278.933594 1020.902344 1210.777344 C 1184.984375 1142.617188 1406.351562 1137.414062 1406.351562 1137.414062"/>
                <path fill="#ffcc00" d="M 148.414062 1001.59375 C 148.414062 1001.59375 164.109375 1028.214844 172.835938 1055.007812 C 181.566406 1081.804688 183.328125 1108.777344 183.328125 1108.777344 C 183.328125 1108.777344 345.933594 1119.007812 487.609375 1194.324219 C 629.289062 1269.640625 750.039062 1410.054688 750.039062 1410.054688 C 750.039062 1410.054688 658.234375 1256.855469 507.832031 1154.742188 C 357.425781 1052.628906 148.414062 1001.59375 148.414062 1001.59375"/>
                <path fill="#ffcc00" d="M 1351.664062 1001.59375 C 1351.664062 1001.59375 1335.964844 1028.214844 1327.238281 1055.007812 C 1318.515625 1081.804688 1316.746094 1108.777344 1316.746094 1108.777344 C 1316.746094 1108.777344 1154.144531 1119.007812 1012.46875 1194.324219 C 870.789062 1269.640625 750.039062 1410.054688 750.039062 1410.054688 C 750.039062 1410.054688 841.84375 1256.855469 992.246094 1154.742188 C 1142.648438 1052.628906 1351.664062 1001.59375 1351.664062 1001.59375"/>
                <path fill="#ffcc00" d="M 232.304688 899.429688 C 232.304688 899.429688 243.832031 925.25 247.566406 953.1875 C 251.300781 981.117188 247.238281 1011.160156 247.238281 1011.160156 C 247.238281 1011.160156 405.300781 1050.65625 531 1150.378906 C 656.703125 1250.101562 750.039062 1410.054688 750.039062 1410.054688 C 750.039062 1410.054688 699.085938 1242.511719 569.652344 1114.859375 C 440.214844 987.195312 232.304688 899.429688 232.304688 899.429688"/>
                <path fill="#ffcc00" d="M 1267.773438 899.429688 C 1267.773438 899.429688 1256.242188 925.25 1252.507812 953.1875 C 1248.78125 981.117188 1252.832031 1011.160156 1252.832031 1011.160156 C 1252.832031 1011.160156 1094.773438 1050.65625 969.078125 1150.378906 C 843.375 1250.101562 750.039062 1410.054688 750.039062 1410.054688 C 750.039062 1410.054688 800.992188 1242.511719 930.425781 1114.859375 C 1059.863281 987.195312 1267.773438 899.429688 1267.773438 899.429688"/>
              </svg>
              <h1 className="font-['Times'] text-2xl font-bold text-black dark:text-white drop-shadow-lg">
                Lexora Sub-System
              </h1>
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
            <SheetTitle>
              <div className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 1500 1500" 
                  className="h-8 w-8"
                >
                  <g transform="matrix(1, 0, 0, 1, 367, 147)">
                    <g fill="#ffcc00" fillOpacity="1">
                      <g transform="translate(0.352463, 823.196833)">
                        <path d="M 401.578125 -767.578125 C 361.796875 -767.578125 333.300781 -761.265625 316.09375 -748.640625 C 298.882812 -736.023438 290.28125 -710.597656 290.28125 -672.359375 L 290.28125 -96.375 C 290.28125 -80.3125 293.53125 -68.835938 300.03125 -61.953125 C 306.53125 -55.066406 317.429688 -51.625 332.734375 -51.625 L 503.6875 -51.625 C 543.46875 -51.625 576.359375 -56.785156 602.359375 -67.109375 C 628.367188 -77.441406 650.742188 -94.269531 669.484375 -117.59375 C 688.222656 -140.925781 706.390625 -174.007812 723.984375 -216.84375 L 743.484375 -209.96875 L 676.9375 0 L 48.1875 0 L 48.1875 -20.65625 L 56.21875 -20.65625 C 95.226562 -20.65625 123.335938 -27.535156 140.546875 -41.296875 C 157.753906 -55.066406 166.359375 -79.929688 166.359375 -115.890625 L 166.359375 -673.5 C 166.359375 -708.6875 157.367188 -733.160156 139.390625 -746.921875 C 121.421875 -760.691406 93.316406 -767.578125 55.078125 -767.578125 L 48.1875 -767.578125 L 48.1875 -788.234375 L 401.578125 -788.234375 Z M 401.578125 -767.578125"/>
                      </g>
                    </g>
                  </g>
                  <path fill="#ffcc00" d="M 93.988281 1137.414062 L 128.601562 1177.882812 L 147.8125 1231.527344 C 147.8125 1231.527344 306.3125 1211.273438 456.9375 1255.898438 C 607.5625 1300.535156 750.304688 1410.054688 750.304688 1410.054688 C 750.304688 1410.054688 643.519531 1278.933594 479.441406 1210.777344 C 315.355469 1142.617188 93.988281 1137.414062 93.988281 1137.414062"/>
                  <path fill="#ffcc00" d="M 1406.351562 1137.414062 L 1371.742188 1177.882812 L 1352.53125 1231.527344 C 1352.53125 1231.527344 1194.03125 1211.273438 1043.40625 1255.898438 C 892.777344 1300.535156 750.039062 1410.054688 750.039062 1410.054688 C 750.039062 1410.054688 856.824219 1278.933594 1020.902344 1210.777344 C 1184.984375 1142.617188 1406.351562 1137.414062 1406.351562 1137.414062"/>
                </svg>
                <span>Lexora Sub-System</span>
              </div>
            </SheetTitle>
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