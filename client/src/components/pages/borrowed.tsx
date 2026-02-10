import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Hash,
  GraduationCap,
  Eye,
  X
} from "lucide-react"
import { transactionService } from '@/services/api'

interface Transaction {
  transaction_id: number
  book_id: number
  book_title: string
  book_author?: string
  isbn?: string
  student_name: string
  student_id_number: string
  course?: string
  year_level?: '1' | '2' | '3' | '4'
  address?: string
  contact_number?: string
  email?: string
  borrowed_date: string
  due_date: string
  return_date?: string | null
  status: 'active' | 'overdue' | 'returned'
  notes?: string
}

interface Book {
  book_id: number
  title: string
  author: string
  isbn: string
  available_quantity: number
}

interface UserData {
  user_id: number
  username: string
  full_name: string
  email: string
  role: string
  last_login: string | null
}

interface BorrowedPageProps {
  user?: UserData | null
}

export default function BorrowedPage({ user }: BorrowedPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [availableBooks, setAvailableBooks] = useState<Book[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue' | 'returned'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    returned: 0
  })

  // New transaction form with embedded student details
  const [formData, setFormData] = useState({
    book_id: '',
    borrowed_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    // Student/Borrower Information
    student_name: '',
    student_id_number: '',
    course: '',
    year_level: '',
    address: '',
    contact_number: '',
    email: ''
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadTransactions(),
        loadAvailableBooks(),
        loadStats()
      ])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await transactionService.getAll()
      if (response.success) {
        setTransactions(response.data)
      }
    } catch (error: any) {
      console.error('Failed to load transactions:', error)
    }
  }

  const loadAvailableBooks = async () => {
    try {
      const response = await transactionService.getAvailableBooks()
      if (response.success) {
        setAvailableBooks(response.data)
      }
    } catch (error: any) {
      console.error('Failed to load available books:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await transactionService.getStats()
      if (response.success) {
        setStats({
          total: response.data.total_transactions || 0,
          active: response.data.active_count || 0,
          overdue: response.data.overdue_count || 0,
          returned: response.data.returned_count || 0
        })
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error)
    }
  }

  // Handle borrow book with embedded student data
  const handleBorrowBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validate required fields
      if (!formData.book_id || !formData.student_name || !formData.student_id_number || !formData.due_date) {
        toast.error('Please fill in all required fields')
        setIsSaving(false)
        return
      }

      const transactionData = {
        book_id: parseInt(formData.book_id),
        student_name: formData.student_name,
        student_id_number: formData.student_id_number,
        course: formData.course || null,
        year_level: formData.year_level || null,
        address: formData.address || null,
        contact_number: formData.contact_number || null,
        email: formData.email || null,
        borrowed_date: formData.borrowed_date,
        due_date: formData.due_date,
        notes: formData.notes || null
      }

      const response = await transactionService.create(transactionData, user?.user_id)

      if (response.success) {
        toast.success('Book borrowed successfully!')
        setIsBorrowModalOpen(false)
        resetForm()
        await loadData()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to borrow book')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle return book
  const handleReturnBook = async (transactionId: number) => {
    try {
      const response = await transactionService.returnBook(transactionId, user?.user_id)
      if (response.success) {
        toast.success('Book returned successfully!')
        await loadData()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to return book')
    }
  }

  // Handle extend due date
  const handleExtendDueDate = async (transactionId: number) => {
    try {
      const response = await transactionService.extendDueDate(transactionId, 14, user?.user_id)
      if (response.success) {
        toast.success('Due date extended by 14 days!')
        await loadTransactions()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to extend due date')
    }
  }

  // Update overdue status
  const handleUpdateOverdue = async () => {
    try {
      const response = await transactionService.updateOverdueStatus()
      if (response.success) {
        toast.success(`Updated ${response.count} transactions to overdue`)
        await loadTransactions()
        await loadStats()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update overdue status')
    }
  }

  const resetForm = () => {
    setFormData({
      book_id: '',
      borrowed_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      student_name: '',
      student_id_number: '',
      course: '',
      year_level: '',
      address: '',
      contact_number: '',
      email: ''
    })
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.student_id_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.transaction_id.toString().includes(searchQuery)
    
    const matchesFilter = filterStatus === 'all' || transaction.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
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
          <Badge variant="secondary" className="gap-1 bg-green-500 text-white">
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
      return `${diffDays} days left`
    } else {
      return `${diffDays} days`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="container py-0 px-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowed Books</h1>
          <p className="text-muted-foreground mt-1">
            Manage book transactions and track borrowed items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleUpdateOverdue}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Update Overdue
          </Button>
          <Button 
            onClick={() => setIsBorrowModalOpen(true)} 
            className="gap-2 bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc]"
          >
            <Plus className="h-4 w-4" />
            Borrow Book
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="hover:shadow-2xl cursor-pointer border border-white dark:border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
            willChange: 'transform'
          }}
          onClick={() => setFilterStatus('all')}
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.total}
                </p>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
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
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.active}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-50" />
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
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.overdue}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
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
        >
          <CardContent className="pt-6" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.returned}
                </p>
                <p className="text-xs text-muted-foreground">Returned</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by book, student, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'overdue', 'returned'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'bg-gradient-to-r from-[#9770FF] to-[#0033FF]' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-[#9770FF] mx-auto mb-4" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">No transactions found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start by borrowing a book'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => setIsBorrowModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Borrow Your First Book
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.transaction_id}>
                      <TableCell className="font-medium">
                        #{transaction.transaction_id}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-[#9770FF] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{transaction.book_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.book_author || 'Unknown Author'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{transaction.student_name}</p>
                          <p className="text-xs text-muted-foreground">{transaction.student_id_number}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <p className="text-sm">{formatDate(transaction.borrowed_date)}</p>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{formatDate(transaction.due_date)}</p>
                          {transaction.status !== 'returned' && (
                            <p className={`text-xs ${
                              getDaysRemaining(transaction.due_date).includes('overdue') 
                                ? 'text-red-600 font-medium' 
                                : getDaysRemaining(transaction.due_date).includes('left')
                                ? 'text-orange-600'
                                : 'text-muted-foreground'
                            }`}>
                              {getDaysRemaining(transaction.due_date)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingTransaction(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {transaction.status !== 'returned' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExtendDueDate(transaction.transaction_id)}
                                className="h-8 w-8 p-0"
                                title="Extend due date"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReturnBook(transaction.transaction_id)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="Mark as returned"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Transaction Details Modal */}
      <Dialog open={!!viewingTransaction} onOpenChange={(open) => !open && setViewingTransaction(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Transaction Details</DialogTitle>
            <DialogDescription>
              Transaction #{viewingTransaction?.transaction_id}
            </DialogDescription>
          </DialogHeader>

          {viewingTransaction && (
            <div className="space-y-6 py-4">
              {/* Book Information */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <BookOpen className="h-4 w-4" />
                  Book Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Title</p>
                    <p className="font-medium">{viewingTransaction.book_title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Author</p>
                    <p className="font-medium">{viewingTransaction.book_author || 'N/A'}</p>
                  </div>
                  {viewingTransaction.isbn && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">ISBN</p>
                      <p className="font-medium">{viewingTransaction.isbn}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Borrower Information */}
              <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold flex items-center gap-2 text-purple-900 dark:text-purple-100">
                  <User className="h-4 w-4" />
                  Borrower Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{viewingTransaction.student_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ID Number</p>
                    <p className="font-medium">{viewingTransaction.student_id_number}</p>
                  </div>
                  {viewingTransaction.course && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground">Course</p>
                        <p className="font-medium">{viewingTransaction.course}</p>
                      </div>
                      {viewingTransaction.year_level && (
                        <div>
                          <p className="text-muted-foreground">Year Level</p>
                          <p className="font-medium">Year {viewingTransaction.year_level}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {viewingTransaction.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {viewingTransaction.email}
                      </p>
                    </div>
                  )}
                  {viewingTransaction.contact_number && (
                    <div>
                      <p className="text-muted-foreground">Contact Number</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {viewingTransaction.contact_number}
                      </p>
                    </div>
                  )}
                  {viewingTransaction.address && (
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium flex items-start gap-2">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        {viewingTransaction.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Information */}
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold flex items-center gap-2 text-green-900 dark:text-green-100">
                  <Calendar className="h-4 w-4" />
                  Transaction Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Borrowed Date</p>
                    <p className="font-medium">{formatDate(viewingTransaction.borrowed_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(viewingTransaction.due_date)}</p>
                  </div>
                  {viewingTransaction.return_date && (
                    <div>
                      <p className="text-muted-foreground">Return Date</p>
                      <p className="font-medium">{formatDate(viewingTransaction.return_date)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingTransaction.status)}</div>
                  </div>
                  {viewingTransaction.status !== 'returned' && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Time Remaining</p>
                      <p className={`font-medium ${
                        getDaysRemaining(viewingTransaction.due_date).includes('overdue') 
                          ? 'text-red-600' 
                          : getDaysRemaining(viewingTransaction.due_date).includes('left')
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {getDaysRemaining(viewingTransaction.due_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewingTransaction.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                    {viewingTransaction.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {viewingTransaction?.status !== 'returned' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleExtendDueDate(viewingTransaction!.transaction_id)
                    setViewingTransaction(null)
                  }}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Extend Due Date
                </Button>
                <Button
                  onClick={() => {
                    handleReturnBook(viewingTransaction!.transaction_id)
                    setViewingTransaction(null)
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Returned
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => setViewingTransaction(null)}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Borrow Book Modal - (Keep the same form as before) */}
      <Dialog open={isBorrowModalOpen} onOpenChange={(open) => !open && !isSaving && setIsBorrowModalOpen(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Borrow a Book</DialogTitle>
            <DialogDescription>
              Fill in the book and borrower information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBorrowBook} className="space-y-6 py-4">
            {/* Book Selection */}
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Book Information
              </h3>
              
              <div className="space-y-2">
                <Label>Select Book *</Label>
                <select
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                  disabled={isSaving}
                >
                  <option value="">Choose a book...</option>
                  {availableBooks.map((book) => (
                    <option key={book.book_id} value={book.book_id}>
                      {book.title} - {book.author} ({book.available_quantity} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Borrow Date *</Label>
                  <Input
                    type="date"
                    value={formData.borrowed_date}
                    onChange={(e) => setFormData({ ...formData, borrowed_date: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    disabled={isSaving}
                    min={formData.borrowed_date}
                  />
                </div>
              </div>
            </div>

            {/* Student/Borrower Information */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Borrower Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Student ID Number *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={formData.student_id_number}
                      onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                      placeholder="0026284"
                      className="pl-10"
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="BSIT, BSCS, etc."
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year Level</Label>
                  <select
                    value={formData.year_level}
                    onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    disabled={isSaving}
                  >
                    <option value="">Select year...</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="09123456789"
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@email.com"
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Complete address"
                      className="w-full min-h-[80px] p-3 pl-10 text-sm rounded-md border border-input bg-background"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[80px] p-3 text-sm rounded-md border border-input bg-background"
                placeholder="Add any additional notes..."
                disabled={isSaving}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBorrowModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#9770FF] to-[#0033FF] hover:from-[#7c5cd6] hover:to-[#0029cc]"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Borrow Book
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
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