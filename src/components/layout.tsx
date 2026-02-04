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
      {/* Linear Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950"></div>

      {/* Fixed Navigation - Clean, no gradient */}
      <nav className="fixed top-0 left-0 right-0 z-[50] border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo/Brand - Clean text */}
            <h1 className="text-xl font-bold text-foreground">NEMCO Library System</h1>
            
            {/* Desktop Navigation - Right Aligned */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      currentPage === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                className="rounded-full"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt="Admin" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar - Clean, no gradient */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle>Library System</SheetTitle>
            <SheetDescription>
              Navigate through the library management system
            </SheetDescription>
          </SheetHeader>
          
          {/* Mobile Profile Section */}
          <div className="mt-6 mb-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="bg-primary text-primary-foreground">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative mt-16">
        {children}
      </main>

      {/* Custom animations for semi-flip card effect */}
      <style>{`
        /* Sticky search bar styling */
        .sticky-search-bar {
          position: -webkit-sticky;
          position: sticky;
          top: 4rem; /* 64px - same as navigation height h-16 */
          z-index: 40;
          background-color: hsl(var(--card) / 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: var(--radius);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .sticky-search-bar.is-stuck {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Semi-flip card animation - Dynamic tilt based on cursor position */
        .stat-card {
          position: relative;
          transition: transform 0.2s ease-out, box-shadow 0.3s;
          transform-style: preserve-3d;
          overflow: hidden;
        }
        
        .stat-card > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255, 255, 255, 0.8) 50%,
            transparent 75%
          );
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card:hover::before {
          animation: shine-sweep 0.8s ease-in-out;
        }
        
        /* Alternative semi-flip on hover - Dynamic tilt */
        .stat-card-flip {
          position: relative;
          perspective: 1000px;
          transition: transform 0.2s ease-out, box-shadow 0.4s ease;
          overflow: hidden;
        }
        
        .stat-card-flip > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-flip::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 20%,
            rgba(255, 255, 255, 0.8) 50%,
            transparent 80%
          );
          transform: rotate(45deg);
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card-flip:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card-flip:hover::before {
          animation: shine-diagonal 1s ease-in-out;
        }
        
        /* Subtle 3D effect - Dynamic tilt */
        .stat-card-3d {
          position: relative;
          transition: transform 0.2s ease-out, box-shadow 0.3s ease;
          overflow: hidden;
        }
        
        .stat-card-3d > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-3d::before {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 80%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.9),
            transparent
          );
          transform: skewX(-25deg);
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card-3d:hover {
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        
        .stat-card-3d:hover::before {
          animation: shine-skew 0.7s ease-in-out;
        }
        
        /* Glass Morphism with depth */
        .stat-card-glass {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease-out;
          transform-style: preserve-3d;
          overflow: hidden;
        }
        
        .stat-card-glass > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-glass::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card-glass::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.2) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 1;
        }
        
        .stat-card-glass:hover::before {
          animation: shine-sweep 0.8s ease-in-out;
        }
        
        .stat-card-glass:hover::after {
          opacity: 1;
        }
        
        /* Floating card with shadow depth */
        .stat-card-float {
          position: relative;
          transition: transform 0.2s ease-out, box-shadow 0.3s ease;
          transform-style: preserve-3d;
          overflow: hidden;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.12),
            0 1px 2px rgba(0, 0, 0, 0.24);
        }
        
        .stat-card-float > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-float::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            110deg,
            transparent,
            rgba(255, 255, 255, 0.8),
            transparent
          );
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card-float:hover {
          box-shadow: 
            0 14px 28px rgba(0, 0, 0, 0.25),
            0 10px 10px rgba(0, 0, 0, 0.22);
        }
        
        .stat-card-float:hover::before {
          animation: shine-sweep 0.6s ease-in-out;
        }
        
        /* Holographic effect */
        .stat-card-holo {
          position: relative;
          transition: transform 0.2s ease-out;
          transform-style: preserve-3d;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05)
          );
        }
        
        .stat-card-holo > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-holo::before {
          content: '';
          position: absolute;
          inset: -50%;
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 100, 200, 0.4) 36%,
            rgba(100, 200, 255, 0.4) 43%,
            rgba(255, 255, 100, 0.4) 50%,
            rgba(100, 255, 200, 0.4) 60%,
            transparent 80%
          );
          transform: translateX(-100%) translateY(-100%) rotate(45deg);
          transition: transform 0.6s;
          z-index: 1;
          pointer-events: none;
        }
        
        .stat-card-holo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.15) 0%,
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 2;
        }
        
        .stat-card-holo:hover::before {
          transform: translateX(100%) translateY(100%) rotate(45deg);
        }
        
        .stat-card-holo:hover::after {
          opacity: 1;
        }
        
        /* Neon glow effect */
        .stat-card-neon {
          position: relative;
          transition: all 0.2s ease-out;
          transform-style: preserve-3d;
          overflow: hidden;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        
        .stat-card-neon > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-neon::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(99, 102, 241, 0.5),
            transparent
          );
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card-neon:hover {
          box-shadow: 
            0 0 20px rgba(99, 102, 241, 0.4),
            0 0 40px rgba(99, 102, 241, 0.2),
            0 10px 30px rgba(0, 0, 0, 0.3);
          border-color: rgba(99, 102, 241, 0.6);
        }
        
        .stat-card-neon:hover::before {
          animation: shine-sweep 0.7s ease-in-out;
        }
        
        /* Metallic shine effect */
        .stat-card-metal {
          position: relative;
          transition: transform 0.2s ease-out, box-shadow 0.3s ease;
          transform-style: preserve-3d;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            rgba(200, 200, 200, 0.1) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(200, 200, 200, 0.1) 100%
          );
        }
        
        .stat-card-metal > * {
          position: relative;
          z-index: 2;
        }
        
        .stat-card-metal::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.9) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          z-index: 10;
          pointer-events: none;
        }
        
        .stat-card-metal:hover {
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        
        .stat-card-metal:hover::before {
          animation: shine-diagonal 0.8s ease-in-out;
        }
        
        @keyframes shine-sweep {
          0% {
            left: -100%;
          }
          100% {
            left: 150%;
          }
        }
        
        @keyframes shine-diagonal {
          0% {
            transform: rotate(45deg) translateX(-150%);
          }
          100% {
            transform: rotate(45deg) translateX(150%);
          }
        }
        
        @keyframes shine-skew {
          0% {
            left: -150%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>
      
      {/* Dynamic tilt script */}
      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Sticky search bar observer
          function setupStickyObserver() {
            const stickyElement = document.querySelector('.sticky-search-bar');
            if (!stickyElement) return;
            
            const observer = new IntersectionObserver(
              ([e]) => {
                if (e.intersectionRatio < 1) {
                  e.target.classList.add('is-stuck');
                } else {
                  e.target.classList.remove('is-stuck');
                }
              },
              { threshold: [1], rootMargin: '-64px 0px 0px 0px' }
            );
            
            observer.observe(stickyElement);
          }
          
          setupStickyObserver();
          
          // Tilt effect for cards
          function handleTilt(e) {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;
            
            // Update CSS variables for effects that need mouse position
            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;
            card.style.setProperty('--mouse-x', percentX + '%');
            card.style.setProperty('--mouse-y', percentY + '%');
            
            card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) translateY(-8px)\`;
          }
          
          function resetTilt(e) {
            const card = e.currentTarget;
            card.style.transform = '';
          }
          
          function attachTiltListeners() {
            const cards = document.querySelectorAll('.stat-card, .stat-card-flip, .stat-card-3d, .stat-card-glass, .stat-card-float, .stat-card-holo, .stat-card-neon, .stat-card-metal');
            cards.forEach(card => {
              card.addEventListener('mousemove', handleTilt);
              card.addEventListener('mouseleave', resetTilt);
            });
          }
          
          attachTiltListeners();
          
          // Re-attach listeners when content changes
          const observer = new MutationObserver(function() {
            attachTiltListeners();
            setupStickyObserver();
          });
          observer.observe(document.body, { childList: true, subtree: true });
        });
      `}} />
    </div>
  )
}