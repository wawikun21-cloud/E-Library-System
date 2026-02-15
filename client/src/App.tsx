import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/layout/layout';
import HomePage from './components/pages/dashboard';
import BooksPage from './components/pages/books';
import BorrowedPage from './components/pages/borrowed';
import LoginPage from './components/pages/login';
import { authService } from './services/api';
import './index.css'

// Define user type
interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  last_login: string | null;
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginKey, setLoginKey] = useState(0) // Force login component to remount
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Check theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('lexora-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // Listen for theme changes
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('lexora-theme') as 'light' | 'dark' | null
      if (newTheme) {
        setTheme(newTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Check if token exists
      if (!authService.isAuthenticated()) {
        setIsAuthenticated(false)
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        // Verify token with backend
        const response = await authService.verifySession()
        
        if (response.success && response.user) {
          setIsAuthenticated(true)
          setUser(response.user)
        } else {
          // Token invalid
          setIsAuthenticated(false)
          setUser(null)
          // Clear invalid token
          await authService.logout()
        }
      } catch (error) {
        console.error('Session verification failed:', error)
        setIsAuthenticated(false)
        setUser(null)
        // Clear invalid token
        await authService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Listen for auth:logout event from API interceptor
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason
      
      // Show appropriate message
      if (reason === 'TOKEN_EXPIRED') {
        toast.warning('Your session has expired. Please login again.')
      } else if (reason === 'INVALID_TOKEN') {
        toast.error('Invalid session. Please login again.')
      }
      
      // Trigger logout
      handleLogout()
    }

    window.addEventListener('auth:logout', handleAuthLogout as EventListener)
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener)
    }
  }, [])

  // Handle successful login
  const handleLogin = (userData: User) => {
    setIsAuthenticated(true)
    setUser(userData)
    // Token and localStorage already set in authService.login
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear authentication state
      setIsAuthenticated(false)
      setUser(null)
      setCurrentPage('dashboard')
      
      // Force login component to remount with fresh state
      setLoginKey(prev => prev + 1)
      
      console.log('User logged out successfully')
    }
  }

  // Render different pages
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <HomePage user={user} />
      case 'books':
        return <BooksPage user={user} />
      case 'borrowed':
        return <BorrowedPage user={user} />
      default:
        return <HomePage user={user} />
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  // key={loginKey} forces component to fully remount after logout
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage key={loginKey} onLogin={handleLogin} />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme}
        />
      </>
    )
  }

  // Show main app if authenticated
  return (
    <>
      <Layout 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        user={user}
      >
        {renderPage()}
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </>
  )
}

export default App