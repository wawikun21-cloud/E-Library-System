export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Stats Cards */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0</p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Books</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0</p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Books Borrowed</h3>
          <p className="text-3xl font-bold text-foreground mt-2">0</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <p className="text-muted-foreground">No recent activity</p>
      </div>
    </div>
  )
}