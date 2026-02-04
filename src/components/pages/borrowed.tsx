import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  User, 
  BookOpen, 
  Search, 
  // Filter,
  // ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus
} from "lucide-react"

interface BorrowedBook {
  id: string
  bookTitle: string
  bookId: string
  studentName: string
  studentId: string
  borrowDate: string
  dueDate: string
  status: 'active' | 'overdue' | 'returned'
}

export default function BorrowedPage() {
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([
    {
      id: "T001",
      bookTitle: "The Great Gatsby",
      bookId: "B001",
      studentName: "Alice Johnson",
      studentId: "S001",
      borrowDate: "2024-01-15",
      dueDate: "2024-02-15",
      status: "active"
    },
    {
      id: "T002",
      bookTitle: "1984",
      bookId: "B003",
      studentName: "Bob Smith",
      studentId: "S002",
      borrowDate: "2024-01-10",
      dueDate: "2024-02-10",
      status: "overdue"
    },
    {
      id: "T003",
      bookTitle: "Pride and Prejudice",
      bookId: "B004",
      studentName: "Charlie Brown",
      studentId: "S003",
      borrowDate: "2024-01-20",
      dueDate: "2024-02-20",
      status: "active"
    },
    {
      id: "T004",
      bookTitle: "To Kill a Mockingbird",
      bookId: "B002",
      studentName: "Diana Prince",
      studentId: "S004",
      borrowDate: "2024-01-18",
      dueDate: "2024-02-18",
      status: "active"
    },
    {
      id: "T005",
      bookTitle: "The Catcher in the Rye",
      bookId: "B005",
      studentName: "Edward Norton",
      studentId: "S005",
      borrowDate: "2024-01-05",
      dueDate: "2024-02-05",
      status: "overdue"
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue' | 'returned'>('all')
  // const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and search logic
  const filteredBooks = borrowedBooks.filter(book => {
    const matchesSearch = 
      book.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || book.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            Active
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </Badge>
        )
      case "returned":
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Returned
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays <= 3) {
      return `${diffDays} days left (Due soon!)`
    } else {
      return `${diffDays} days remaining`
    }
  }

  const handleReturn = (id: string) => {
    setBorrowedBooks(borrowedBooks.map(book => 
      book.id === id ? { ...book, status: 'returned' as const } : book
    ))
  }

  const handleExtend = (id: string) => {
    setBorrowedBooks(borrowedBooks.map(book => {
      if (book.id === id) {
        const newDueDate = new Date(book.dueDate)
        newDueDate.setDate(newDueDate.getDate() + 14) // Extend by 14 days
        return { ...book, dueDate: newDueDate.toISOString().split('T')[0] }
      }
      return book
    }))
  }

  const stats = {
    total: borrowedBooks.length,
    active: borrowedBooks.filter(b => b.status === 'active').length,
    overdue: borrowedBooks.filter(b => b.status === 'overdue').length,
    returned: borrowedBooks.filter(b => b.status === 'returned').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowed Books</h1>
          <p className="text-muted-foreground mt-1">Track and manage all borrowed items</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Transaction
        </Button>
      </div>

      {/* Stats Cards with 3D Effects */}
      <div className="grid gap-4 md:grid-cols-4" style={{ perspective: '1000px' }}>
        <Card 
          className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s ease-out'
          }}
          onClick={() => setFilterStatus('all')}
          onMouseEnter={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(-5deg) rotateX(5deg) translateY(-8px) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(0deg) rotateX(0deg) translateY(0px) scale(1)'
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Borrowed</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground opacity-50 transition-transform duration-300 hover:scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s ease-out'
          }}
          onClick={() => setFilterStatus('active')}
          onMouseEnter={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(-5deg) rotateX(5deg) translateY(-8px) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(0deg) rotateX(0deg) translateY(0px) scale(1)'
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <Clock className="h-8 w-8 text-green-600 opacity-50 transition-transform duration-300 hover:scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s ease-out'
          }}
          onClick={() => setFilterStatus('overdue')}
          onMouseEnter={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(-5deg) rotateX(5deg) translateY(-8px) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(0deg) rotateX(0deg) translateY(0px) scale(1)'
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-50 transition-transform duration-300 hover:scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s ease-out'
          }}
          onClick={() => setFilterStatus('returned')}
          onMouseEnter={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(-5deg) rotateX(5deg) translateY(-8px) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget
            card.style.transform = 'rotateY(0deg) rotateX(0deg) translateY(0px) scale(1)'
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.returned}</p>
                <p className="text-xs text-muted-foreground">Returned</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600 opacity-50 transition-transform duration-300 hover:scale-110" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar - STICKY */}
      <Card className="sticky-search-bar shadow-md">
        <CardContent className="pt-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by book, student, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('overdue')}
              >
                Overdue
              </Button>
              <Button
                variant={filterStatus === 'returned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('returned')}
              >
                Returned
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredBooks.length} of {borrowedBooks.length} transactions
        </p>
      </div>

      {/* Borrowed Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start by creating a new transaction'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {filteredBooks.map((transaction) => {
            const daysInfo = getDaysRemaining(transaction.dueDate)
            const isOverdue = transaction.status === 'overdue'
            const isReturned = transaction.status === 'returned'
            
            return (
              <Card 
                key={transaction.id} 
                className={`hover:shadow-lg transition-all ${
                  isOverdue ? 'border-destructive/50' : ''
                } ${isReturned ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 mb-1">
                        <BookOpen className="h-5 w-5 text-primary shrink-0" />
                        <span className="truncate">{transaction.bookTitle}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>ID: {transaction.id}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>Book: {transaction.bookId}</span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.studentName}</p>
                        <p className="text-xs text-muted-foreground">Student ID: {transaction.studentId}</p>
                      </div>
                    </div>
                    
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">Borrowed</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {new Date(transaction.borrowDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`rounded-md p-3 ${
                        isOverdue ? 'bg-destructive/10' : 'bg-muted/30'
                      }`}>
                        <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`h-3.5 w-3.5 ${
                            isOverdue ? 'text-destructive' : 'text-muted-foreground'
                          }`} />
                          <p className={`text-sm font-medium ${
                            isOverdue ? 'text-destructive' : ''
                          }`}>
                            {new Date(transaction.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Days Remaining */}
                    {!isReturned && (
                      <div className={`text-center py-2 px-3 rounded-md text-sm font-medium ${
                        isOverdue 
                          ? 'bg-destructive/10 text-destructive' 
                          : daysInfo.includes('Due soon')
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}>
                        {daysInfo}
                      </div>
                    )}

                    {/* Actions */}
                    {!isReturned && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleReturn(transaction.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Return Book
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleExtend(transaction.id)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Extend
                        </Button>
                      </div>
                    )}

                    {isReturned && (
                      <div className="text-center py-2 px-3 rounded-md text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium">
                        ✓ Book Returned
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}