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
  const [loginKey, setLoginKey] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem('lexora-theme') as 'light' | 'dark' | null
    if (savedTheme) setTheme(savedTheme)

    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('lexora-theme') as 'light' | 'dark' | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // ── Session check on app load ────────────────────────────────────────────────
  // F-05 FIX: removed isAuthenticated() pre-check — that checked in-memory state
  // which is always null on page refresh. Now we ALWAYS call verifySession() and
  // let the server-side httpOnly cookie decide if the session is valid.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.verifySession()

        if (response.success && response.user) {
          setIsAuthenticated(true)
          setUser(response.user)
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error: any) {
        // 401 means no valid cookie — not an error, just not logged in
        // Any other error (network down etc.) also means we show login
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // ── Listen for auth:logout events from API interceptor ───────────────────────
  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason

      if (reason === 'TOKEN_EXPIRED') {
        toast.warning('Your session has expired. Please login again.')
      } else if (reason === 'INVALID_TOKEN') {
        toast.error('Invalid session. Please login again.')
      }

      handleLogout()
    }

    window.addEventListener('auth:logout', handleAuthLogout as EventListener)
    return () => window.removeEventListener('auth:logout', handleAuthLogout as EventListener)
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────────
  const handleLogin = (userData: User) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await authService.logout() // clears httpOnly cookie via server
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      setUser(null)
      setCurrentPage('dashboard')
      setLoginKey(prev => prev + 1)
    }
  }

  // ── Page renderer ─────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <HomePage user={user} />
      case 'books':     return <BooksPage user={user} />
      case 'borrowed':  return <BorrowedPage user={user} />
      default:          return <HomePage user={user} />
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
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

  // ── Unauthenticated ───────────────────────────────────────────────────────────
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

  // ── Authenticated ─────────────────────────────────────────────────────────────
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