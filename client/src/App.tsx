import { useState, useEffect } from 'react';
import Layout from './components/layout/layout';
import HomePage from './components/pages/dashboard';
import BooksPage from './components/pages/books';
import BorrowedPage from './components/pages/borrowed';
import LoginPage from './components/pages/login';
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

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('isAuthenticated')
      const savedUser = localStorage.getItem('user')
      
      if (savedAuth === 'true' && savedUser) {
        setIsAuthenticated(true)
        setUser(JSON.parse(savedUser))
      }
      setIsLoading(false)
    }

    checkAuth()
  }, []) // Run only once on mount

  // Handle successful login
  const handleLogin = (userData: User) => {
    setIsAuthenticated(true)
    setUser(userData)
    // localStorage is already set in login component
  }

  // Handle logout
  const handleLogout = () => {
    // Clear authentication state
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('dashboard')
    
    // Clear localStorage
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    
    // Force login component to remount with fresh state
    setLoginKey(prev => prev + 1)
    
    console.log('User logged out successfully')
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  // key={loginKey} forces component to fully remount after logout
  if (!isAuthenticated) {
    return <LoginPage key={loginKey} onLogin={handleLogin} />
  }

  // Show main app if authenticated
  return (
    <Layout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      onLogout={handleLogout}
      user={user}
    >
      {renderPage()}
    </Layout>
  )
}

export default App