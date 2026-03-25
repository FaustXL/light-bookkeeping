import type { Transaction } from '@/lib/db'
import { CategoryIcon } from './CategoryIcon'
import { formatAmount } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface TransactionItemProps {
  transaction: Transaction
  categoryIcon: string
  categoryColor: string
  onClick?: () => void
}

export function TransactionItem({ transaction, categoryIcon, categoryColor, onClick }: TransactionItemProps) {
  const isIncome = transaction.type === 'income'
  const dateObj = transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
  const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`

  // 根据来源设置不同的边框颜色
  const getSourceBorderColor = () => {
    switch (transaction.source) {
      case '微信账单':
        return '4px solid #10b981';
      case '支付宝账单':
        return '4px solid #3b82f6';
      case '软件记录':
        return '4px solid #9ca3af';
      default:
        return '4px solid #9ca3af';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 w-full px-5 py-4 bg-white hover:bg-muted/30 active:bg-muted/50 transition-all duration-200 text-left group cursor-pointer`}
      style={{ borderLeft: getSourceBorderColor() }}
    >
      {/* Category Icon with glass effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
        <CategoryIcon icon={categoryIcon} color={categoryColor} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {transaction.categoryName}
          </p>
          {transaction.merchantName && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground truncate max-w-[80px]">
              {transaction.merchantName}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
          {transaction.note ? (
            <span>{transaction.note}</span>
          ) : (
            <span className="italic">无备注</span>
          )}
          <span className="text-border">·</span>
          <span>{timeStr}</span>
          {transaction.paymentMethod && (
            <>
              <span className="text-border">·</span>
              <span className="text-accent-bg">{transaction.paymentMethod}</span>
            </>
          )}
        </p>
      </div>
      
      {/* Amount */}
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isIncome ? 'bg-income/10' : 'bg-expense/10'}`}>
          {isIncome ? (
            <ArrowDownLeft className="w-3 h-3 text-income" />
          ) : (
            <ArrowUpRight className="w-3 h-3 text-expense" />
          )}
        </div>
        <span className={`text-sm font-bold tabular-nums ${isIncome ? 'text-income' : 'text-foreground'}`}>
          {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
        </span>
      </div>
    </button>
  )
}
