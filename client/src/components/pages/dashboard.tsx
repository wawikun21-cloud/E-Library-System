import { useState, useEffect } from 'react'
import {
  BookCheck, Clock, User, BookOpen, TrendingUp, TrendingDown,
  Activity, AlertCircle, CheckCircle2, RefreshCw, Copy, FolderOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { transactionService, bookService } from '@/services/api'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface UserData {
  user_id: number
  username: string
  full_name: string
  email: string
  role: string
  last_login: string | null
}

interface HomePageProps {
  user?: UserData | null
}

interface Appointment {
  id: number
  studentName: string
  bookTitle: string
  type: 'borrow' | 'return'
  appointmentDate: string
  status: 'pending' | 'confirmed' | 'completed'
}

interface AnalyticsData {
  totalBooks: number
  totalTransactions: number
  activeTransactions: number
  overdueTransactions: number
  returnedTransactions: number
  availableBooks: number
  totalCopies: number
  totalCategories: number
  categoryBreakdown: { name: string; value: number; fill: string }[]
  transactionStatusData: { name: string; value: number; fill: string }[]
  availabilityData: { name: string; value: number; fill: string }[]
  monthlyTrend: { month: string; borrowed: number; returned: number; overdue: number }[]
}

const monthlyChartConfig: ChartConfig = {
  borrowed: { label: 'Borrowed', color: '#9770FF' },
  returned: { label: 'Returned', color: '#22c55e' },
  overdue:  { label: 'Overdue',  color: '#ef4444' },
}

const transactionChartConfig: ChartConfig = {
  Active:   { label: 'Active',   color: '#0033FF' },
  Returned: { label: 'Returned', color: '#22c55e' },
  Overdue:  { label: 'Overdue',  color: '#ef4444' },
}

const availabilityChartConfig: ChartConfig = {
  Available: { label: 'Available', color: '#22c55e' },
  Borrowed:  { label: 'Borrowed',  color: '#9770FF' },
}

const categoryChartConfig: ChartConfig = {
  value: { label: 'Books', color: '#9770FF' },
}

const CATEGORY_COLORS = [
  '#9770FF', '#0033FF', '#22c55e', '#f97316',
  '#14b8a6', '#ec4899', '#eab308', '#ef4444',
]

export default function HomePage({ user: _user }: HomePageProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalBooks: 0,
    totalTransactions: 0,
    activeTransactions: 0,
    overdueTransactions: 0,
    returnedTransactions: 0,
    availableBooks: 0,
    totalCopies: 0,
    totalCategories: 0,
    categoryBreakdown: [],
    transactionStatusData: [],
    availabilityData: [],
    monthlyTrend: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const appointments: Appointment[] = [
    { id: 1, studentName: 'John Doe',    bookTitle: 'Introduction to Algorithms', type: 'borrow', appointmentDate: 'Today, 2:00 PM',      status: 'pending'   },
    { id: 2, studentName: 'Jane Smith',  bookTitle: 'Clean Code',                 type: 'return', appointmentDate: 'Today, 3:30 PM',      status: 'confirmed' },
    { id: 3, studentName: 'Mike Johnson',bookTitle: 'Design Patterns',            type: 'borrow', appointmentDate: 'Tomorrow, 10:00 AM',  status: 'pending'   },
  ]

  const borrowAppointments = appointments.filter(a => a.type === 'borrow')
  const returnAppointments = appointments.filter(a => a.type === 'return')

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const [booksRes, transactionsRes] = await Promise.all([
        bookService.getAll(),
        transactionService.getAll(),
      ])

      const books        = booksRes.success        ? booksRes.data        : []
      const transactions = transactionsRes.success ? transactionsRes.data : []

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let active = 0, overdue = 0, returned = 0

      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const monthlyMap: Record<string, { borrowed: number; returned: number; overdue: number }> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        monthlyMap[monthNames[d.getMonth()]] = { borrowed: 0, returned: 0, overdue: 0 }
      }

      transactions.forEach((t: any) => {
        const key = monthNames[new Date(t.borrow_date || t.created_at).getMonth()]
        if (t.status === 'returned') {
          returned++
          if (monthlyMap[key]) monthlyMap[key].returned++
        } else {
          const due = new Date(t.due_date)
          due.setHours(0, 0, 0, 0)
          if (due < today) { overdue++; if (monthlyMap[key]) monthlyMap[key].overdue++ }
          else              { active++ }
        }
        if (monthlyMap[key]) monthlyMap[key].borrowed++
      })

      const catMap: Record<string, number> = {}
      books.forEach((b: any) => { if (b.category) catMap[b.category] = (catMap[b.category] || 0) + 1 })

      const categoryBreakdown = Object.entries(catMap)
        .map(([name, value], i) => ({ name, value, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      const availableBooks  = books.reduce((s: number, b: any) => s + b.available_quantity, 0)
      const totalCopies     = books.reduce((s: number, b: any) => s + b.quantity, 0)
      const borrowedCopies  = totalCopies - availableBooks

      setAnalytics({
        totalBooks: books.length,
        totalTransactions: transactions.length,
        activeTransactions: active,
        overdueTransactions: overdue,
        returnedTransactions: returned,
        availableBooks,
        totalCopies,
        totalCategories: Object.keys(catMap).length,
        categoryBreakdown,
        transactionStatusData: [
          { name: 'Active',   value: active,    fill: '#0033FF' },
          { name: 'Returned', value: returned,  fill: '#22c55e' },
          { name: 'Overdue',  value: overdue,   fill: '#ef4444' },
        ],
        availabilityData: [
          { name: 'Available', value: availableBooks, fill: '#22c55e' },
          { name: 'Borrowed',  value: borrowedCopies, fill: '#9770FF' },
        ],
        monthlyTrend: Object.entries(monthlyMap).map(([month, d]) => ({ month, ...d })),
      })

      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadAnalytics() }, [])

  const borrowRate = analytics.totalCopies > 0
    ? Math.round(((analytics.totalCopies - analytics.availableBooks) / analytics.totalCopies) * 100) : 0
  const returnRate = analytics.totalTransactions > 0
    ? Math.round((analytics.returnedTransactions / analytics.totalTransactions) * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return 'secondary'
      case 'confirmed': return 'default'
      case 'completed': return 'outline'
      default:          return 'secondary'
    }
  }

  const Skeleton = ({ className = 'w-12 h-6 sm:h-8' }: { className?: string }) => (
    <span className={`inline-block bg-muted animate-pulse rounded ${className}`} />
  )

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    return (
      <text
        x={cx + r * Math.cos(-midAngle * RADIAN)}
        y={cy + r * Math.sin(-midAngle * RADIAN)}
        fill="white" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">
      {/* ✅ RESPONSIVE: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Home</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Library analytics and overview</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdated && <p className="text-xs text-muted-foreground hidden md:block">Updated at {lastUpdated}</p>}
          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={isLoading} className="gap-2 h-8 sm:h-9 text-xs sm:text-sm">
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ✅ RESPONSIVE: Main Layout - stacked on mobile, sidebar on desktop */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
        
        {/* Analytics Section - full width on mobile, 3/4 on desktop */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">

          {/* ✅ RESPONSIVE: Stat Cards - 2 cols mobile, 4 cols desktop */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#9770FF] to-[#0033FF] mb-3 sm:mb-4">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{isLoading ? <Skeleton /> : analytics.totalBooks}</p>
                <p className="text-xs sm:text-sm font-medium mt-1">Total Books</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">Unique titles</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{isLoading ? <Skeleton /> : analytics.availableBooks}</p>
                <p className="text-xs sm:text-sm font-medium mt-1">Available</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">of {analytics.totalCopies}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{isLoading ? <Skeleton /> : analytics.activeTransactions}</p>
                <p className="text-xs sm:text-sm font-medium mt-1">Active</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">Borrowed</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  {analytics.overdueTransactions > 0
                    ? <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    : <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{isLoading ? <Skeleton /> : analytics.overdueTransactions}</p>
                <p className="text-xs sm:text-sm font-medium mt-1">Overdue</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">Past due</p>
              </CardContent>
            </Card>
          </div>

          {/* ✅ RESPONSIVE: Monthly Trend Chart */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-[#9770FF]" />
                Monthly Trend
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Last 6 months activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="w-full h-48 sm:h-64" /> : (
                <ChartContainer config={monthlyChartConfig} className="h-48 sm:h-64 w-full">
                  <AreaChart data={analytics.monthlyTrend} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradBorrowed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#9770FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9770FF" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="gradReturned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="borrowed" stroke="#9770FF" strokeWidth={2} fill="url(#gradBorrowed)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="returned" stroke="#22c55e" strokeWidth={2} fill="url(#gradReturned)" dot={{ r: 2 }} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="overdue"  stroke="#ef4444" strokeWidth={2} fill="url(#gradOverdue)"  dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* ✅ RESPONSIVE: Pie Charts - 1 col mobile, 2 cols tablet+ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BookCheck className="h-3 w-3 sm:h-4 sm:w-4 text-[#9770FF]" />
                  Transaction Status
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Activity breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="w-full h-40 sm:h-52" /> :
                 analytics.totalTransactions === 0 ? (
                  <div className="flex items-center justify-center h-40 sm:h-52 text-muted-foreground text-xs sm:text-sm">No transactions</div>
                ) : (
                  <ChartContainer config={transactionChartConfig} className="h-40 sm:h-52 w-full">
                    <PieChart>
                      <Pie data={analytics.transactionStatusData} cx="50%" cy="50%" outerRadius={55} dataKey="value" labelLine={false} label={renderPieLabel}>
                        {analytics.transactionStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-[#9770FF]" />
                  Book Availability
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Available vs borrowed</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="w-full h-40 sm:h-52" /> :
                 analytics.totalCopies === 0 ? (
                  <div className="flex items-center justify-center h-40 sm:h-52 text-muted-foreground text-xs sm:text-sm">No books</div>
                ) : (
                  <ChartContainer config={availabilityChartConfig} className="h-40 sm:h-52 w-full">
                    <PieChart>
                      <Pie data={analytics.availabilityData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" labelLine={false} label={renderPieLabel}>
                        {analytics.availabilityData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ✅ RESPONSIVE: Category Bar Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 text-[#9770FF]" />
                Books by Category
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Titles per category</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="w-full h-48 sm:h-64" /> :
               analytics.categoryBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 sm:h-64 text-muted-foreground text-xs sm:text-sm">No categories</div>
              ) : (
                <ChartContainer config={categoryChartConfig} className="h-48 sm:h-64 w-full">
                  <BarChart data={analytics.categoryBreakdown} margin={{ top: 10, right: 5, left: -25, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(151,112,255,0.08)' }} />
                    <Bar dataKey="value" name="Books" radius={[4, 4, 0, 0]}>
                      {analytics.categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* ✅ RESPONSIVE: Progress Bars - 1 col mobile, 2 cols sm+ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base">Borrow Rate</CardTitle>
                  <Badge variant="outline" className="text-[#9770FF] border-[#9770FF]/30 font-bold text-xs">
                    {isLoading ? '—' : `${borrowRate}%`}
                  </Badge>
                </div>
                <CardDescription className="text-xs">Currently borrowed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#9770FF] to-[#0033FF] transition-all duration-700" style={{ width: isLoading ? '0%' : `${borrowRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                    <span>{analytics.totalCopies - analytics.availableBooks} borrowed</span>
                    <span>{analytics.availableBooks} available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base">Return Rate</CardTitle>
                  <Badge variant="outline" className="text-green-600 border-green-300 font-bold text-xs">
                    {isLoading ? '—' : `${returnRate}%`}
                  </Badge>
                </div>
                <CardDescription className="text-xs">Transactions completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700" style={{ width: isLoading ? '0%' : `${returnRate}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                    <span>{analytics.returnedTransactions} returned</span>
                    <span>{analytics.totalTransactions} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ RESPONSIVE: Collection Overview - stacked mobile, 3 cols sm+ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 text-[#9770FF]" />
                Collection Overview
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Library summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-[#9770FF] to-[#0033FF] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-[#9770FF]">{isLoading ? '—' : analytics.totalBooks}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Unique Titles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">{isLoading ? '—' : analytics.totalCopies}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Total Copies</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-teal-600">{isLoading ? '—' : analytics.totalCategories}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Categories</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ RESPONSIVE: Appointments Sidebar - full width mobile, sidebar desktop */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base">Borrow Appointments</CardTitle>
                <Badge variant="secondary" className="text-xs">{borrowAppointments.length}</Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">Upcoming pickups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {borrowAppointments.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <BookCheck className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No appointments</p>
                </div>
              ) : borrowAppointments.map((apt) => (
                <div key={apt.id} className="p-2.5 sm:p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs sm:text-sm font-medium">{apt.studentName}</p>
                    </div>
                    <Badge variant={getStatusColor(apt.status) as any} className="text-[10px] sm:text-xs">{apt.status}</Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 line-clamp-1">{apt.bookTitle}</p>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{apt.appointmentDate}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base">Return Appointments</CardTitle>
                <Badge variant="secondary" className="text-xs">{returnAppointments.length}</Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">Scheduled returns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {returnAppointments.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <BookCheck className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No appointments</p>
                </div>
              ) : returnAppointments.map((apt) => (
                <div key={apt.id} className="p-2.5 sm:p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs sm:text-sm font-medium">{apt.studentName}</p>
                    </div>
                    <Badge variant={getStatusColor(apt.status) as any} className="text-[10px] sm:text-xs">{apt.status}</Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 line-clamp-1">{apt.bookTitle}</p>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{apt.appointmentDate}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-bold text-orange-600">{appointments.filter(a => a.status === 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Confirmed</span>
                <span className="font-bold text-green-600">{appointments.filter(a => a.status === 'confirmed').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        @media (min-width: 640px) { ::-webkit-scrollbar { width: 10px; height: 10px; } }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #9770FF, #0033FF); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #7c5cd6, #0029cc); }
        * { scrollbar-width: thin; scrollbar-color: #9770FF rgba(0,0,0,0.05); }
      `}</style>
    </div>
  )
}