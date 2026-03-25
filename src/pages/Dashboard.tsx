import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionItem } from '@/components/TransactionItem'
import { EmptyState } from '@/components/EmptyState'
import { formatAmount, getMonthLabel } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, Wallet, Receipt, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const monthTransactions = useLiveQuery(
    () => db.transactions.where('date').between(monthStart, monthEnd, true, true).toArray(),
    [now.getMonth()]
  )

  const recentTransactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().limit(5).toArray(),
    []
  )

  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const categoryMap = new Map(
    (categories || []).map(c => [c.id!, { icon: c.icon, color: c.color }])
  )

  const monthIncome = (monthTransactions || [])
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthExpense = (monthTransactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = monthIncome - monthExpense

  return (
    <div className="pb-24 animate-fade-in min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header - Glassmorphism Style */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative px-6 pt-14 pb-10">
          {/* Month label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="text-primary-foreground/60 text-sm font-medium tracking-wide">
              {getMonthLabel(now)}
            </p>
          </div>
          
          {/* Balance display */}
          <div className="mb-2">
            <span className="text-primary-foreground/40 text-sm">本月结余</span>
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-primary-foreground/50 text-2xl font-light">¥</span>
            <span className="text-primary-foreground text-5xl font-bold tabular-nums tracking-tight">
              {formatAmount(Math.abs(balance))}
            </span>
          </div>

          {/* Income & Expense Cards */}
          <div className="flex gap-4">
            <div className="flex-1 glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-income/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 text-income" />
                </div>
                <span className="text-primary-foreground/60 text-xs font-medium">收入</span>
              </div>
              <p className="text-primary-foreground text-xl font-bold tabular-nums">
                {formatAmount(monthIncome)}
              </p>
            </div>
            
            <div className="flex-1 glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-expense/20 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-expense" />
                </div>
                <span className="text-primary-foreground/60 text-xs font-medium">支出</span>
              </div>
              <p className="text-primary-foreground text-xl font-bold tabular-nums">
                {formatAmount(monthExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Floating Card */}
      <div className="px-5 -mt-6 relative z-10">
        <Card className="border-0 shadow-card-hover rounded-2xl overflow-hidden bg-white/90 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/add')}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl hover:bg-primary/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
                  <Wallet className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xs text-foreground font-medium">记一笔</span>
              </button>
              
              <button
                onClick={() => navigate('/transactions')}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl hover:bg-accent/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/25 group-hover:shadow-xl group-hover:shadow-accent/30 group-hover:scale-105 transition-all duration-300">
                  <Receipt className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="text-xs text-foreground font-medium">全部账单</span>
              </button>
              
              <button
                onClick={() => navigate('/stats')}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl hover:bg-income/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-income to-income/80 flex items-center justify-center shadow-lg shadow-income/25 group-hover:shadow-xl group-hover:shadow-income/30 group-hover:scale-105 transition-all duration-300">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-foreground font-medium">统计分析</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="px-5 mt-6">
        <Card className="border-0 shadow-card rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-accent rounded-full" />
                <CardTitle className="text-base font-semibold">最近交易</CardTitle>
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs text-accent font-medium hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                查看全部
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!recentTransactions || recentTransactions.length === 0) ? (
              <EmptyState
                icon={<Receipt className="w-8 h-8" />}
                title="暂无交易记录"
                description="点击下方 + 按钮开始记账"
                className="py-12"
              />
            ) : (
              <div className="divide-y divide-border/50">
                {recentTransactions.map((t, index) => {
                  const cat = categoryMap.get(t.categoryId) || { icon: 'more-horizontal', color: '#64748b' }
                  return (
                    <div 
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TransactionItem
                        transaction={t}
                        categoryIcon={cat.icon}
                        categoryColor={cat.color}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
