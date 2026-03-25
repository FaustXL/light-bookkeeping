import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, type Transaction, type PaymentMethod } from '@/lib/db'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { formatAmount, formatDate } from '@/lib/utils'
import { ArrowLeft, Trash2, Check, X, CreditCard, Store } from 'lucide-react'

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editedTransaction, setEditedTransaction] = useState<Omit<Transaction, 'id'>>({ 
    amount: 0, 
    type: 'expense', 
    categoryId: 1, 
    categoryName: '其他', 
    note: '', 
    date: new Date(), 
    createdAt: new Date(),
    source: '软件记录',
    merchantName: '',
    paymentMethod: '其他'
  })
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string; color: string; type: 'income' | 'expense' }>>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  
  // 加载交易数据和分类数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        if (id) {
          const tx = await db.transactions.get(Number(id))
          if (tx) {
            setTransaction(tx)
            setEditedTransaction({
              amount: tx.amount,
              type: tx.type,
              categoryId: tx.categoryId,
              categoryName: tx.categoryName,
              note: tx.note,
              date: tx.date instanceof Date ? tx.date : new Date(tx.date),
              createdAt: tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt),
              source: tx.source,
              merchantName: tx.merchantName || '',
              paymentMethod: tx.paymentMethod || '其他'
            })
          }
        }
        const [cats, pms] = await Promise.all([
          db.categories.toArray(),
          db.paymentMethods.orderBy('order').toArray()
        ])
        setCategories(cats.filter(c => c.id !== undefined) as Array<{ id: number; name: string; icon: string; color: string; type: 'income' | 'expense' }>)
        setPaymentMethods(pms)
      } catch (error) {
        console.error('加载数据失败:', error)
        showToast('加载数据失败', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id, showToast])
  
  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    const categoryId = Number(value)
    const category = categories.find(c => c.id === categoryId)
    if (category) {
      setEditedTransaction(prev => ({
        ...prev,
        categoryId,
        categoryName: category.name
      }))
    }
  }
  
  // 处理类型变化
  const handleTypeChange = (value: 'income' | 'expense') => {
    setEditedTransaction(prev => ({
      ...prev,
      type: value,
      // 切换类型时，默认选择对应类型的第一个分类
      categoryId: categories.find(c => c.type === value)?.id || 1,
      categoryName: categories.find(c => c.type === value)?.name || '其他'
    }))
  }
  
  // 保存编辑
  const handleSave = async () => {
    if (!transaction || !id) return
    
    try {
      await db.transactions.update(Number(id), editedTransaction)
      showToast('保存成功')
      setIsEditing(false)
      // 重新加载数据
      const updatedTx = await db.transactions.get(Number(id))
      if (updatedTx) {
        setTransaction(updatedTx)
      }
    } catch (error) {
      console.error('保存失败:', error)
      showToast('保存失败', 'error')
    }
  }
  
  // 删除交易
  const handleDelete = async () => {
    if (!id) return
    
    try {
      await db.transactions.delete(Number(id))
      showToast('删除成功')
      navigate('/transactions')
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败', 'error')
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }
  
  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">交易记录不存在</div>
      </div>
    )
  }
  
  const category = categories.find(c => c.id === transaction.categoryId) || { icon: 'more-horizontal', color: '#64748b' }
  const dateObj = transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
  
  return (
    <div className="pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-card px-4 pt-12 pb-3 sticky top-0 z-20 border-b flex items-center gap-3">
        <button 
          onClick={() => navigate('/transactions')}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">账单详情</h1>
      </div>
      
      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Amount */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-4">
            {isEditing ? (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">金额</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={editedTransaction.amount} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="text-xl font-bold"
                />
              </div>
            ) : (
              <div className="text-center py-4">
                <span className={`text-3xl font-bold tabular-nums ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Details */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">交易详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">日期</label>
              {isEditing ? (
                <Input 
                  type="datetime-local" 
                  value={editedTransaction.date.toISOString().slice(0, 16)} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTransaction(prev => ({ ...prev, date: new Date(e.target.value) }))}
                />
              ) : (
                <p className="text-sm">{formatDate(dateObj)} {dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            
            {/* Type */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">类型</label>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button 
                    variant={editedTransaction.type === 'expense' ? 'default' : 'outline'}
                    onClick={() => handleTypeChange('expense')}
                    className="flex-1"
                  >
                    支出
                  </Button>
                  <Button 
                    variant={editedTransaction.type === 'income' ? 'default' : 'outline'}
                    onClick={() => handleTypeChange('income')}
                    className="flex-1"
                  >
                    收入
                  </Button>
                </div>
              ) : (
                <p className="text-sm">{transaction.type === 'income' ? '收入' : '支出'}</p>
              )}
            </div>
            
            {/* Category */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">分类</label>
              {isEditing ? (
                <select 
                  value={editedTransaction.categoryId.toString()} 
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {categories
                    .filter(c => c.type === editedTransaction.type)
                    .map(c => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))
                  }
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <CategoryIcon icon={category.icon} color={category.color} />
                  <span className="text-sm">{transaction.categoryName}</span>
                </div>
              )}
            </div>
            
            {/* Merchant Name */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1 flex items-center">
                <Store className="w-3 h-3 mr-1" />
                商户名称
              </label>
              {isEditing ? (
                <Input 
                  value={editedTransaction.merchantName} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTransaction(prev => ({ ...prev, merchantName: e.target.value }))}
                  placeholder="商户名称"
                />
              ) : (
                <p className="text-sm">{transaction.merchantName || '无商户名称'}</p>
              )}
            </div>
            
            {/* Payment Method */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1 flex items-center">
                <CreditCard className="w-3 h-3 mr-1" />
                支付方式
              </label>
              {isEditing ? (
                <select 
                  value={editedTransaction.paymentMethod} 
                  onChange={(e) => setEditedTransaction(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.name}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm">{transaction.paymentMethod || '其他'}</p>
              )}
            </div>
            
            {/* Note */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">备注</label>
              {isEditing ? (
                <Textarea 
                  value={editedTransaction.note} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedTransaction(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="添加备注"
                  rows={3}
                />
              ) : (
                <p className="text-sm">{transaction.note || '无备注'}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="space-y-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                保存
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  if (transaction) {
                    setEditedTransaction({
                      amount: transaction.amount,
                      type: transaction.type,
                      categoryId: transaction.categoryId,
                      categoryName: transaction.categoryName,
                      note: transaction.note,
                      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
                      createdAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt),
                      source: transaction.source,
                      merchantName: transaction.merchantName || '',
                      paymentMethod: transaction.paymentMethod || '其他'
                    })
                  }
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button 
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                编辑
              </Button>
              <div>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
                {showDeleteDialog && (
                  <Dialog>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                          确定要删除这条交易记录吗？此操作不可撤销。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium">{transaction.categoryName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{transaction.note || '无备注'}</p>
                          <p className={`text-sm font-semibold mt-2 ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(dateObj)} {dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                          取消
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          确认删除
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
