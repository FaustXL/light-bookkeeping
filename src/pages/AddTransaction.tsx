import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Category, type PaymentMethod } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useToast } from '@/components/ui/toast'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Calendar, CreditCard } from 'lucide-react'

export default function AddTransaction() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [note, setNote] = useState('')
  const [dateStr, setDateStr] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [merchantName, setMerchantName] = useState('')

  const categories = useLiveQuery(
    () => db.categories.where('type').equals(type).sortBy('order'),
    [type]
  )

  const paymentMethods = useLiveQuery(
    () => db.paymentMethods.orderBy('order').toArray(),
    []
  )

  // 初始化默认支付方式
  useEffect(() => {
    const setDefaultPaymentMethod = async () => {
      if (paymentMethods && paymentMethods.length > 0) {
        const defaultMethod = paymentMethods.find(pm => pm.isDefault === 1) || paymentMethods[0]
        setSelectedPaymentMethod(defaultMethod)
      }
    }
    setDefaultPaymentMethod()
  }, [paymentMethods])

  const handleNumberClick = (val: string) => {
    if (val === 'del') {
      setAmount(prev => prev.slice(0, -1))
      return
    }
    if (val === '.' && amount.includes('.')) return
    if (amount.includes('.') && amount.split('.')[1].length >= 2) return
    if (amount === '0' && val !== '.') {
      setAmount(val)
      return
    }
    setAmount(prev => prev + val)
  }

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      showToast('请输入金额', 'error')
      return
    }
    if (!selectedCategory) {
      showToast('请选择分类', 'error')
      return
    }
    if (!selectedPaymentMethod) {
      showToast('请选择支付方式', 'error')
      return
    }

    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d, new Date().getHours(), new Date().getMinutes())

    await db.transactions.add({
      amount: amountNum,
      type,
      categoryId: selectedCategory.id!,
      categoryName: selectedCategory.name,
      note,
      date,
      createdAt: new Date(),
      source: '软件记录',
      merchantName,
      paymentMethod: selectedPaymentMethod.name
    })

    showToast(`${type === 'income' ? '收入' : '支出'} ¥${amountNum.toFixed(2)} 已记录`)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-foreground">记一笔</h1>
        <div className="w-10" />
      </div>

      {/* Type Toggle */}
      <div className="px-4 mb-4">
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => { setType('expense'); setSelectedCategory(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              type === 'expense' ? 'bg-card shadow-sm text-expense' : 'text-muted-foreground'
            }`}
          >
            支出
          </button>
          <button
            onClick={() => { setType('income'); setSelectedCategory(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              type === 'income' ? 'bg-card shadow-sm text-income' : 'text-muted-foreground'
            }`}
          >
            收入
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-5 gap-2">
          {(categories || []).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-150 ${
                selectedCategory?.id === cat.id ? 'bg-accent ring-1 ring-primary/30' : 'hover:bg-muted'
              }`}
            >
              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
              <span className="text-[10px] text-foreground font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount Display */}
      <div className="px-4 mb-2">
        <div className="bg-muted/50 rounded-2xl p-4">
          <div className="flex items-baseline gap-1">
            <span className="text-muted-foreground text-lg">¥</span>
            <span className={`text-3xl font-bold tabular-nums ${
              amount ? 'text-foreground' : 'text-muted-foreground/40'
            }`}>
              {amount || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Note & Date & Merchant */}
      <div className="px-4 mb-3">
        <input
          type="text"
          value={merchantName}
          onChange={e => setMerchantName(e.target.value)}
          placeholder="商户名称..."
          className="w-full h-10 px-3 mb-2 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="添加备注..."
            className="flex-1 h-10 px-3 rounded-xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <div className="relative">
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="h-10 px-3 pl-9 rounded-xl bg-muted/50 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all appearance-none w-36"
            />
            <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 mb-3">
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center">
          <CreditCard className="w-4 h-4 mr-1" />
          支付方式
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {(paymentMethods || []).map(pm => (
            <button
              key={pm.id}
              onClick={() => setSelectedPaymentMethod(pm)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-150 ${selectedPaymentMethod?.id === pm.id ? 'bg-accent-bg ring-1 ring-primary/30' : 'hover:bg-muted'}`}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: pm.color }}
              >
                <span className="text-white text-xs">
                  {pm.icon === 'credit-card' && '💳'}
                  {pm.icon === 'dollar-sign' && '$'}
                  {pm.icon === 'message-circle' && '💬'}
                  {pm.icon === 'wallet' && '👛'}
                  {pm.icon === 'banknote' && '💵'}
                  {pm.icon === 'paypal' && 'P'}
                  {pm.icon === 'bitcoin' && '₿'}
                  {pm.icon === 'cash' && '💸'}
                  {pm.icon === 'check' && '✓'}
                  {pm.icon === 'credit-card-2' && '💳'}
                </span>
              </div>
              <span className="text-[10px] text-foreground font-medium">{pm.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Number Pad */}
      <div className="mt-auto bg-card border-t px-3 pt-2 pb-6 mb-4 safe-bottom">
        <div className="grid grid-cols-4 gap-1.5">
          {['1', '2', '3'].map(key => (
            <button key={key} onClick={() => handleNumberClick(key)}
              className="h-12 rounded-xl bg-muted/60 text-foreground text-lg font-medium active:bg-muted transition-colors duration-100 flex items-center justify-center"
            >{key}</button>
          ))}
          <button onClick={() => handleNumberClick('del')}
            className="h-12 rounded-xl bg-muted/60 text-foreground active:bg-muted transition-colors duration-100 flex items-center justify-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 14 6-6" /><path d="m15 14-6-6" /><path d="M5 7a2 2 0 0 0-1.5.67L1 12l2.5 4.33A2 2 0 0 0 5 17h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" />
            </svg>
          </button>
          {['4', '5', '6'].map(key => (
            <button key={key} onClick={() => handleNumberClick(key)}
              className="h-12 rounded-xl bg-muted/60 text-foreground text-lg font-medium active:bg-muted transition-colors duration-100 flex items-center justify-center"
            >{key}</button>
          ))}
          <Button onClick={handleSubmit} className="h-12 rounded-xl text-base font-semibold row-span-2">
            确定
          </Button>
          {['7', '8', '9'].map(key => (
            <button key={key} onClick={() => handleNumberClick(key)}
              className="h-12 rounded-xl bg-muted/60 text-foreground text-lg font-medium active:bg-muted transition-colors duration-100 flex items-center justify-center"
            >{key}</button>
          ))}
          <button onClick={() => handleNumberClick('.')}
            className="h-12 rounded-xl bg-muted/60 text-foreground text-lg font-medium active:bg-muted transition-colors duration-100 flex items-center justify-center"
          >.</button>
          <button onClick={() => handleNumberClick('0')}
            className="h-12 rounded-xl bg-muted/60 text-foreground text-lg font-medium active:bg-muted transition-colors duration-100 flex items-center justify-center"
          >0</button>
          <button onClick={() => handleNumberClick('0')}
            className="h-12 rounded-xl bg-muted/60 text-foreground text-xs font-medium active:bg-muted transition-colors duration-100 flex items-center justify-center text-muted-foreground"
          >00</button>
        </div>
      </div>
    </div>
  )
}
