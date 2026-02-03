import { useState } from 'react'
import Layout from '@/components/layout'
import DashboardPage from '@/components/pages/dashboard'
import StudentsPage from '@/components/pages/students'
import BooksPage from '@/components/pages/books'
import BorrowedPage from '@/components/pages/borrowed'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'students':
        return <StudentsPage />
      case 'books':
        return <BooksPage />
      case 'borrowed':
        return <BorrowedPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App