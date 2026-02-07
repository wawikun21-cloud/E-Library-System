import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Calendar, 
  User, 
  BookOpen, 
  Search, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  X
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

interface UserData {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  last_login: string | null;
}

interface BorrowedPageProps {
  user?: UserData | null;
}

export default function BorrowedPage({ user }: BorrowedPageProps) {
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    bookTitle: '',
    bookId: '',
    studentName: '',
    studentId: '',
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  })

  // Scroll indicator logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollIndicator(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const handleCreateTransaction = () => {
    // Generate new transaction ID
    const newId = `T${String(borrowedBooks.length + 1).padStart(3, '0')}`
    
    const transaction: BorrowedBook = {
      id: newId,
      bookTitle: newTransaction.bookTitle,
      bookId: newTransaction.bookId,
      studentName: newTransaction.studentName,
      studentId: newTransaction.studentId,
      borrowDate: newTransaction.borrowDate,
      dueDate: newTransaction.dueDate,
      status: 'active'
    }

    setBorrowedBooks([...borrowedBooks, transaction])
    setIsModalOpen(false)
    
    // Reset form
    setNewTransaction({
      bookTitle: '',
      bookId: '',
      studentName: '',
      studentId: '',
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: ''
    })
  }

  const stats = {
    total: borrowedBooks.length,
    active: borrowedBooks.filter(b => b.status === 'active').length,
    overdue: borrowedBooks.filter(b => b.status === 'overdue').length,
    returned: borrowedBooks.filter(b => b.status === 'returned').length,
  }

  // Tilt effect handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  return (
    <div className="space-y-6">
      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="fixed top-20 left-0 right-0 h-1 bg-gradient-to-r from-[#9770FF] to-[#0033FF] z-40 animate-pulse shadow-lg" />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowed Books</h1>
          <p className="text-muted-foreground mt-1">Track and manage all borrowed items</p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc] shadow-lg hover:shadow-xl transition-all"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Transaction
        </Button>
      </div>

      {/* Stats Cards with 3D Tilt Effects */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
            willChange: 'transform'
          }}
          onClick={() => setFilterStatus('all')}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Borrowed</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
            willChange: 'transform'
          }}
          onClick={() => setFilterStatus('active')}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <Clock className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
            willChange: 'transform'
          }}
          onClick={() => setFilterStatus('overdue')}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
            willChange: 'transform'
          }}
          onClick={() => setFilterStatus('returned')}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.returned}</p>
                <p className="text-xs text-muted-foreground">Returned</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-600 opacity-50" />
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

      {/* New Transaction Modal - MINIMIZED */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto custom-scrollbar bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#9770FF]" />
              New Transaction
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in the details below to create a new borrowing transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Book Title */}
            <div className="space-y-1.5">
              <Label htmlFor="bookTitle" className="text-xs font-medium">Book Title *</Label>
              <Input
                id="bookTitle"
                placeholder="Enter book title"
                value={newTransaction.bookTitle}
                onChange={(e) => setNewTransaction({...newTransaction, bookTitle: e.target.value})}
                className="h-9 text-sm bg-white/50 dark:bg-slate-800/50"
                required
              />
            </div>

            {/* Book ID */}
            <div className="space-y-1.5">
              <Label htmlFor="bookId" className="text-xs font-medium">Book ID *</Label>
              <Input
                id="bookId"
                placeholder="e.g., B001"
                value={newTransaction.bookId}
                onChange={(e) => setNewTransaction({...newTransaction, bookId: e.target.value})}
                className="h-9 text-sm bg-white/50 dark:bg-slate-800/50"
                required
              />
            </div>

            {/* Student Name */}
            <div className="space-y-1.5">
              <Label htmlFor="studentName" className="text-xs font-medium">Student Name *</Label>
              <Input
                id="studentName"
                placeholder="Enter student name"
                value={newTransaction.studentName}
                onChange={(e) => setNewTransaction({...newTransaction, studentName: e.target.value})}
                className="h-9 text-sm bg-white/50 dark:bg-slate-800/50"
                required
              />
            </div>

            {/* Student ID */}
            <div className="space-y-1.5">
              <Label htmlFor="studentId" className="text-xs font-medium">Student ID *</Label>
              <Input
                id="studentId"
                placeholder="e.g., S001"
                value={newTransaction.studentId}
                onChange={(e) => setNewTransaction({...newTransaction, studentId: e.target.value})}
                className="h-9 text-sm bg-white/50 dark:bg-slate-800/50"
                required
              />
            </div>

            {/* Dates - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="borrowDate" className="text-xs font-medium">Borrow Date *</Label>
                <Input
                  id="borrowDate"
                  type="date"
                  value={newTransaction.borrowDate}
                  onChange={(e) => setNewTransaction({...newTransaction, borrowDate: e.target.value})}
                  className="h-9 text-sm bg-white/50 dark:bg-slate-800/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-medium">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTransaction.dueDate}
                  onChange={(e) => setNewTransaction({...newTransaction, dueDate: e.target.value})}
                  className="h-9 text-sm bg-white/50 dark:bg-slate-800/50"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="gap-1.5 h-9 text-sm"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTransaction}
              disabled={
                !newTransaction.bookTitle || 
                !newTransaction.bookId || 
                !newTransaction.studentName || 
                !newTransaction.studentId || 
                !newTransaction.dueDate
              }
              className="gap-1.5 h-9 text-sm bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Styles */}
      <style>{`
        .sticky-search-bar {
          position: sticky;
          top: 80px;
          z-index: 10;
        }

        /* Custom scrollbar for modal */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(151, 112, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9770FF, #0033FF);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c5cd6, #0029cc);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9770FF rgba(151, 112, 255, 0.05);
        }

        /* Custom scrollbar for page */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9770FF, #0033FF);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c5cd6, #0029cc);
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #9770FF rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  )
}