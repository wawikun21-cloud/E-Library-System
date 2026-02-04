import { useState } from 'react'
import Layout from './components/layout'
import HomePage from './components/pages/dashboard'
import BooksPage from './components/pages/books'
import BorrowedPage from './components/pages/borrowed'
import { ThemeProvider } from './components/ui/theme-provider'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

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

  return (
    <ThemeProvider defaultTheme="system" storageKey="nemco-library-theme">
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </Layout>
    </ThemeProvider>
  )
}

export default App