import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { TransactionItem } from '@/components/TransactionItem'
import { EmptyState } from '@/components/EmptyState'
import { Search, SlidersHorizontal, X, Receipt, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Transactions() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [showFilter, setShowFilter] = useState(false)

  const allTransactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    []
  )

  const categories = useLiveQuery(() => db.categories.toArray())
  const categoryMap = new Map(
    (categories || []).map(c => [c.id!, { icon: c.icon, color: c.color }])
  )

  const filtered = useMemo(() => {
    let list = allTransactions || []
    if (filterType !== 'all') {
      list = list.filter(t => t.type === filterType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(t =>
        t.categoryName.toLowerCase().includes(q) ||
        t.note.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      )
    }
    return list
  }, [allTransactions, filterType, searchQuery])

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: typeof filtered; total: number }[] = []
    const map = new Map<string, typeof filtered>()

    for (const t of filtered) {
      const d = t.date instanceof Date ? t.date : new Date(t.date)
      const key = formatDate(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }

    for (const [date, items] of map) {
      const total = items.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0)
      groups.push({ date, items, total })
    }

    return groups
  }, [filtered])

  // Calculate totals
  const totalIncome = (allTransactions || [])
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = (allTransactions || [])
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="pb-24 animate-fade-in min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - Glassmorphism */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative px-5 pt-14 pb-6">
          {/* Back button */}
          {/* <button
            onClick={() => navigate('/')}
            className="absolute top-14 left-5 w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button> */}

          {/* Title */}
          <h1 className="text-xl font-bold text-primary-foreground text-center mb-6">
            交易明细
          </h1>

          {/* Summary Cards */}
          <div className="flex gap-3">
            <div className="flex-1 glass-card rounded-xl p-3">
              <p className="text-primary-foreground/50 text-xs mb-1">总收入</p>
              <p className="text-income text-lg font-bold tabular-nums">+{totalIncome.toFixed(2)}</p>
            </div>
            <div className="flex-1 glass-card rounded-xl p-3">
              <p className="text-primary-foreground/50 text-xs mb-1">总支出</p>
              <p className="text-expense text-lg font-bold tabular-nums">-{totalExpense.toFixed(2)}</p>
            </div>
            <div className="flex-1 glass-card rounded-xl p-3">
              <p className="text-primary-foreground/50 text-xs mb-1">结余</p>
              <p className={`text-lg font-bold tabular-nums ${totalIncome - totalExpense >= 0 ? 'text-primary-foreground' : 'text-expense'}`}>
                {(totalIncome - totalExpense).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="px-5 -mt-3 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-card-hover p-4">
          {/* Search */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索分类、备注、金额..."
                className="w-full h-11 pl-11 pr-10 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all border border-transparent focus:border-accent/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                showFilter || filterType !== 'all' 
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Filter */}
          {showFilter && (
            <div className="flex gap-2 mt-3 animate-slide-down">
              {(['all', 'expense', 'income'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    filterType === f
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'income' ? '收入' : '支出'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 mt-4">
        {grouped.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-10 h-10" />}
            title={searchQuery ? '未找到匹配记录' : '暂无交易记录'}
            description={searchQuery ? '试试其他关键词' : '开始记录您的第一笔交易吧'}
            className="py-16"
          />
        ) : (
          <div className="space-y-4">
            {grouped.map(group => (
              <div key={group.date} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border/50">
                  <span className="text-sm font-semibold text-foreground">{group.date}</span>
                  <span className={`text-sm font-bold tabular-nums ${group.total >= 0 ? 'text-income' : 'text-expense'}`}>
                    {group.total >= 0 ? '+' : ''}{group.total.toFixed(2)}
                  </span>
                </div>
                <div className="divide-y divide-border/30">
                  {group.items.map((t, index) => {
                    const cat = categoryMap.get(t.categoryId) || { icon: 'more-horizontal', color: '#64748b' }
                    return (
                      <TransactionItem
                        key={t.id}
                        transaction={t}
                        categoryIcon={cat.icon}
                        categoryColor={cat.color}
                        onClick={() => navigate(`/transaction/${t.id}`)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
