import { useState } from 'react'
import Layout from './components/layout'
import HomePage from './components/pages/dashboard'
import BooksPage from './components/pages/books'
import BorrowedPage from './components/pages/borrowed'
import LoginPage from './components/pages/login'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentPage('dashboard')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <HomePage />
      case 'books':
        return <BooksPage />
      case 'borrowed':
        return <BorrowedPage />
      default:
        return <HomePage />
    }
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Show main app if authenticated
  return (
    <Layout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  )
}

export default App