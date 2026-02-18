import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Package, AlertCircle, Activity,
  Calendar, 
  RefreshCw, Download, MoreVertical, Loader2, FolderOpen,
  BookMarked} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { bookService, transactionService } from '@/services/api'
import { toast } from 'react-toastify'

interface Book {
  book_id: number
  title: string
  author: string
  isbn: string
  quantity: number
  available_quantity: number
  category?: string
  publisher?: string
  published_year?: number
  cover_image?: string
  created_at?: string
}

interface Transaction {
  transaction_id: number
  book_id: number
  book_title: string
  book_author?: string
  student_name: string
  student_id_number: string
  borrowed_date: string
  due_date: string
  return_date?: string | null
  status: 'active' | 'overdue' | 'returned'
  isbn?: string
  cover_image?: string
}

interface DashboardProps {
  user?: any
}

export default function LibraryDashboard({ user }: DashboardProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Load data on mount and set up auto-refresh
  useEffect(() => {
    loadAllData()
    const interval = setInterval(() => loadAllData(true), 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Reload when date range changes
  useEffect(() => {
    if (!isLoading) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setLastUpdated(new Date())
      }, 500)
    }
  }, [dateRange])

  const loadAllData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const [booksRes, transactionsRes] = await Promise.all([
        bookService.getAll(),
        transactionService.getAll()
      ])
      
      if (booksRes.success) setBooks(booksRes.data || [])
      if (transactionsRes.success) setTransactions(transactionsRes.data || [])
      
      setLastUpdated(new Date())
      if (!silent) toast.success('Dashboard loaded successfully')
    } catch (error: any) {
      if (!silent) toast.error(error.message || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const stats = useMemo(() => {
    // Total Books (unique titles)
    const totalBooks = books.length
    
    // Available Books (sum of available_quantity)
    const availableBooks = books.reduce((sum, b) => sum + (b.available_quantity || 0), 0)
    
    // Total Categories
    const totalCategories = new Set(books.map(b => b.category).filter(Boolean)).size
    
    // Total Transactions
    const totalTransactions = transactions.length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Currently Borrowed Books (active + overdue, not returned)
    let currentlyBorrowed = 0
    let overdueBooks = 0
    let totalOverdueDays = 0
    let overdueCount = 0

    transactions.forEach(t => {
      if (t.status === 'active' || t.status === 'overdue') {
        currentlyBorrowed++
        
        const dueDate = new Date(t.due_date)
        dueDate.setHours(0, 0, 0, 0)
        
        if (dueDate < today) {
          overdueBooks++
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          totalOverdueDays += daysOverdue
          overdueCount++
        }
      }
    })

    const avgDaysOverdue = overdueCount > 0 ? Math.round(totalOverdueDays / overdueCount) : 0

    // Filter transactions by date range for charts
    const dateFilterMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }[dateRange] || 30 * 24 * 60 * 60 * 1000

    const cutoffDate = new Date(Date.now() - dateFilterMs)
    const filteredTransactions = transactions.filter(t => 
      new Date(t.borrowed_date) >= cutoffDate
    )

    return {
      totalBooks,
      availableBooks,
      currentlyBorrowed,
      overdueBooks,
      totalCategories,
      totalTransactions,
      avgDaysOverdue,
      filteredTransactions
    }
  }, [books, transactions, dateRange])

  // ═══════════════════════════════════════════════════════════════════════════
  // MONTHLY BORROW TREND (Current Year)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    const monthData: { [key: string]: number } = {}

    months.forEach(m => { monthData[m] = 0 })

    transactions.forEach(t => {
      const date = new Date(t.borrowed_date)
      if (date.getFullYear() === currentYear) {
        const month = months[date.getMonth()]
        monthData[month]++
      }
    })

    return months.map(month => ({
      month,
      borrows: monthData[month]
    }))
  }, [transactions])

  // ═══════════════════════════════════════════════════════════════════════════
  // MOST BORROWED BOOKS (Top 5)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const mostBorrowedBooks = useMemo(() => {
    const bookCounts: { [key: number]: { title: string, count: number } } = {}

    stats.filteredTransactions.forEach(t => {
      if (!bookCounts[t.book_id]) {
        bookCounts[t.book_id] = { 
          title: t.book_title.length > 35 ? t.book_title.substring(0, 35) + '...' : t.book_title, 
          count: 0 
        }
      }
      bookCounts[t.book_id].count++
    })

    return Object.values(bookCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [stats.filteredTransactions])

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOKS BY CATEGORY (Pie Chart)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const categoryData = useMemo(() => {
    const categoryCounts: { [key: string]: number } = {}
    
    books.forEach(book => {
      const category = book.category || 'Uncategorized'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    const colors = ['#9770FF', '#0033FF', '#00C9FF', '#7C3AED', '#A78BFA', '#C084FC', '#E879F9', '#F0ABFC']
    const total = books.length || 1
    
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
        percentage: Math.round((value / total) * 100)
      }))
  }, [books])

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERDUE ANALYSIS (Top 5 Longest Overdue)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const overdueTransactions = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return transactions
      .filter(t => {
        if (t.status === 'returned') return false
        const dueDate = new Date(t.due_date)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate < today
      })
      .map(t => {
        const dueDate = new Date(t.due_date)
        dueDate.setHours(0, 0, 0, 0)
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        return { ...t, daysOverdue }
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 5)
  }, [transactions])

  // ═══════════════════════════════════════════════════════════════════════════
  // RECENTLY ADDED BOOKS (Top 5)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const recentlyAddedBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
  }, [books])

  const handleRefresh = () => {
    loadAllData()
  }

  const handleExport = () => {
    toast.info('Exporting dashboard data...')
    // TODO: Implement CSV/PDF export
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0b14]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#9770FF] mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Welcome! <span className="text-gray-400">{user?.full_name || 'Admin'}</span>
          </h1>
          <p className="text-sm text-gray-400">
            Real-time library monitoring • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-[#1a1d2e] border-gray-700 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d2e] border-gray-700">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            className="bg-[#1a1d2e] hover:bg-[#252836]"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleExport}
            className="bg-[#1a1d2e] hover:bg-[#252836]"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOP STATISTICS CARDS (6) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div>
        <h2 className="text-lg font-semibold mb-3">Library Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Books */}
          <Card className="bg-[#1a1d2e] border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-5 w-5 text-[#9770FF]" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                    <DropdownMenuItem className="text-gray-300">View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalBooks}</div>
              <div className="text-xs text-gray-400">📚 Total Books</div>
            </CardContent>
          </Card>

          {/* Available Books */}
          <Card className="bg-[#1a1d2e] border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-5 w-5 text-green-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                    <DropdownMenuItem className="text-gray-300">View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-3xl font-bold mb-1 text-green-400">{stats.availableBooks}</div>
              <div className="text-xs text-gray-400">📦 Available Books</div>
            </CardContent>
          </Card>

          {/* Currently Borrowed */}
          <Card className="bg-[#1a1d2e] border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                    <DropdownMenuItem className="text-gray-300">View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-3xl font-bold mb-1 text-blue-400">{stats.currentlyBorrowed}</div>
              <div className="text-xs text-gray-400">🔄 Borrowed</div>
            </CardContent>
          </Card>

          {/* Overdue Books */}
          <Card className="bg-[#1a1d2e] border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                    <DropdownMenuItem className="text-gray-300">View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-3xl font-bold mb-1 text-red-400">{stats.overdueBooks}</div>
              <div className="text-xs text-gray-400">⚠️ Overdue</div>
            </CardContent>
          </Card>

          {/* Total Categories */}
          <Card className="bg-[#1a1d2e] border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <FolderOpen className="h-5 w-5 text-purple-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                    <DropdownMenuItem className="text-gray-300">View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-3xl font-bold mb-1 text-purple-400">{stats.totalCategories}</div>
              <div className="text-xs text-gray-400">📁 Categories</div>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card className="bg-[#1a1d2e] border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookMarked className="h-5 w-5 text-orange-500" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                    <DropdownMenuItem className="text-gray-300">View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-3xl font-bold mb-1 text-orange-400">{stats.totalTransactions}</div>
              <div className="text-xs text-gray-400">📥 Transactions</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CHARTS ROW 1: Monthly Trend + Most Borrowed */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Borrow Trend */}
        <Card className="bg-[#1a1d2e] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">📈 Monthly Borrow Trend</CardTitle>
            <Badge variant="outline" className="bg-[#252836]">
              {new Date().getFullYear()}
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9770FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#9770FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1d2e', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="borrows" 
                  stroke="#9770FF" 
                  strokeWidth={2}
                  fill="url(#borrowGradient)"
                  name="Borrows"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Borrowed Books */}
        <Card className="bg-[#1a1d2e] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">📚 Most Borrowed Books</CardTitle>
            <Badge variant="outline" className="bg-[#252836]">
              Top 5
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {mostBorrowedBooks.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mostBorrowedBooks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="title" width={180} stroke="#6b7280" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1d2e', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#9770FF" name="Borrows" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CHARTS ROW 2: Books by Category + Overdue Analysis */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Books by Category */}
        <Card className="bg-[#1a1d2e] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">📊 Books by Category</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1d2e] border-gray-700">
                <DropdownMenuItem className="text-gray-300">View All</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1d2e', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overdue Analysis */}
        <Card className="bg-[#1a1d2e] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">⚠️ Overdue Analysis</CardTitle>
            <Badge variant="destructive">{stats.overdueBooks}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-gray-400 mb-1">Overdue Books</p>
                  <p className="text-2xl font-bold text-red-400">{stats.overdueBooks}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <p className="text-xs text-gray-400 mb-1">Avg Days Overdue</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.avgDaysOverdue}</p>
                </div>
              </div>

              {/* Overdue List */}
              <div>
                <p className="text-sm font-semibold mb-2 text-gray-300">Long Overdue (Top 5)</p>
                <div className="space-y-2">
                  {overdueTransactions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      🎉 No overdue books!
                    </p>
                  ) : (
                    overdueTransactions.map(t => (
                      <div 
                        key={t.transaction_id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white">{t.book_title}</p>
                          <p className="text-xs text-gray-400">{t.student_name}</p>
                        </div>
                        <Badge variant="destructive" className="ml-2 shrink-0">
                          {t.daysOverdue}d
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RECENTLY ADDED BOOKS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      <Card className="bg-[#1a1d2e] border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">📆 Recently Added Books</CardTitle>
          <Badge variant="outline" className="bg-[#252836]">
            New Inventory
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {recentlyAddedBooks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 col-span-full">
                No recent books added
              </p>
            ) : (
              recentlyAddedBooks.map(book => (
                <div 
                  key={book.book_id}
                  className="p-3 rounded-lg border border-gray-700 bg-[#252836] hover:bg-[#2d3142] hover:border-[#9770FF]/50 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#9770FF] to-[#0033FF] flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2 mb-1 text-white">{book.title}</p>
                      <p className="text-xs text-gray-400 truncate">{book.author}</p>
                      {book.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {book.category}
                        </Badge>
                      )}
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        <span className="text-green-400 font-medium">
                          {book.available_quantity}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-400">
                          {book.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}