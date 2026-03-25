import { useState, useMemo, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/CategoryIcon'
import { EmptyState } from '@/components/EmptyState'
import { formatAmount } from '@/lib/utils'
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function Statistics() {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const chartRef = useRef<ChartJS<'doughnut'>>(null)

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)

  const transactions = useLiveQuery(
    () => db.transactions.where('date').between(monthStart, monthEnd, true, true).toArray(),
    [year, month]
  )

  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const categoryMap = new Map((categories || []).map(c => [c.id!, c]))

  const filteredByType = useMemo(
    () => (transactions || []).filter(t => t.type === type),
    [transactions, type]
  )

  const totalAmount = filteredByType.reduce((s, t) => s + t.amount, 0)

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<number, { name: string; amount: number; icon: string; color: string }>()
    for (const t of filteredByType) {
      const entry = map.get(t.categoryId) || {
        name: t.categoryName,
        amount: 0,
        icon: categoryMap.get(t.categoryId)?.icon || 'more-horizontal',
        color: categoryMap.get(t.categoryId)?.color || '#64748b',
      }
      entry.amount += t.amount
      map.set(t.categoryId, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [filteredByType, categoryMap])

  // Daily trend
  const dailyTrend = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daily = new Array(daysInMonth).fill(0)
    for (const t of filteredByType) {
      const d = t.date instanceof Date ? t.date : new Date(t.date)
      daily[d.getDate() - 1] += t.amount
    }
    return daily
  }, [filteredByType, year, month])

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = month + dir
    let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
  }

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])

  const doughnutData = {
    labels: categoryBreakdown.map(c => c.name),
    datasets: [{
      data: categoryBreakdown.map(c => c.amount),
      backgroundColor: categoryBreakdown.map(c => c.color + 'CC'),
      borderColor: categoryBreakdown.map(c => c.color),
      borderWidth: 1,
      hoverOffset: 6,
    }],
  }

  const barData = {
    labels: dailyTrend.map((_, i) => `${i + 1}`),
    datasets: [{
      data: dailyTrend,
      backgroundColor: type === 'expense' ? 'hsl(0, 72%, 56%)' : 'hsl(152, 55%, 48%)',
      borderRadius: 4,
      barThickness: 8,
    }],
  }

  return (
    <div className="pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-card px-4 pt-12 pb-3 sticky top-0 z-20 border-b">
        <h1 className="text-lg font-semibold text-foreground mb-3">统计分析</h1>

        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">{year}年{month + 1}月</span>
          <button onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              type === 'expense' ? 'bg-card shadow-sm text-expense' : 'text-muted-foreground'
            }`}
          >
            支出
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              type === 'income' ? 'bg-card shadow-sm text-income' : 'text-muted-foreground'
            }`}
          >
            收入
          </button>
        </div>
      </div>

      {filteredByType.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-7 h-7" />}
          title="暂无数据"
          description="该月份还没有相关记录"
        />
      ) : (
        <div className="px-4 mt-4 space-y-4">
          {/* Total */}
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground mb-1">
              {type === 'expense' ? '总支出' : '总收入'}
            </p>
            <p className={`text-2xl font-bold tabular-nums ${type === 'expense' ? 'text-expense' : 'text-income'}`}>
              ¥{formatAmount(totalAmount)}
            </p>
          </div>

          {/* Doughnut Chart */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">分类占比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-48 h-48 mx-auto">
                <Doughnut
                  ref={chartRef}
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '65%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.label}: ¥${(ctx.raw as number).toFixed(2)}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category List */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">分类明细</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.map(cat => {
                const pct = totalAmount > 0 ? (cat.amount / totalAmount * 100) : 0
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          ¥{formatAmount(cat.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Daily Trend */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">每日趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: (ctx) => `${month + 1}月${ctx[0].label}日`,
                          label: (ctx) => `¥${(ctx.raw as number).toFixed(2)}`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
                      },
                      y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { size: 10 }, callback: (v) => `¥${v}` },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
