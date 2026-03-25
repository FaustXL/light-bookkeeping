import React, { useState, useEffect } from 'react'
import { db, type PaymentMethod } from '../lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Edit, Plus, Check } from 'lucide-react'

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: '',
    icon: 'credit-card',
    color: '#64748B',
    isDefault: 0
  })
  const [editPaymentMethod, setEditPaymentMethod] = useState({
    name: '',
    icon: 'credit-card',
    color: '#64748B',
    isDefault: 0
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 加载所有支付方式
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setIsLoading(true)
        const methods = await db.paymentMethods.orderBy('order').toArray()
        setPaymentMethods(methods)
      } catch (error) {
        console.error('加载支付方式失败:', error)
        setError('加载支付方式失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadPaymentMethods()
  }, [])

  // 处理添加支付方式
  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.name.trim()) {
      setError('请输入支付方式名称')
      return
    }

    try {
      // 检查是否已存在同名支付方式
      const existing = await db.paymentMethods.where('name').equals(newPaymentMethod.name).first()
      if (existing) {
        setError('已存在同名支付方式')
        return
      }

      // 如果设置为默认，先将其他支付方式设为非默认
      if (newPaymentMethod.isDefault) {
        await db.paymentMethods.where('isDefault').equals(1).modify({ isDefault: 0 })
      }

      // 计算新的排序值
      const maxOrder = await db.paymentMethods.orderBy('order').last()
      const order = (maxOrder?.order || 0) + 1

      await db.paymentMethods.add({
        ...newPaymentMethod,
        order
      })

      setSuccess('支付方式添加成功')
      setIsAddDialogOpen(false)
      setNewPaymentMethod({
        name: '',
        icon: 'credit-card',
        color: '#64748B',
        isDefault: 0
      })

      // 重新加载支付方式列表
      const methods = await db.paymentMethods.orderBy('order').toArray()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('添加支付方式失败:', error)
      setError('添加支付方式失败')
    }
  }

  // 处理编辑支付方式
  const handleEditPaymentMethod = async () => {
    if (!editPaymentMethod.name.trim() || !editingPaymentMethod) {
      setError('请输入支付方式名称')
      return
    }

    try {
      // 检查是否已存在同名支付方式（排除当前编辑的）
      const existing = await db.paymentMethods.where('name').equals(editPaymentMethod.name).first()
      if (existing && existing.id !== editingPaymentMethod.id) {
        setError('已存在同名支付方式')
        return
      }

      // 如果设置为默认，先将其他支付方式设为非默认
      if (editPaymentMethod.isDefault) {
        await db.paymentMethods.where('isDefault').equals(1).modify({ isDefault: 0 })
      }

      await db.paymentMethods.update(editingPaymentMethod.id!, {
        ...editPaymentMethod
      })

      setSuccess('支付方式更新成功')
      setIsEditDialogOpen(false)
      setEditingPaymentMethod(null)

      // 重新加载支付方式列表
      const methods = await db.paymentMethods.orderBy('order').toArray()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('更新支付方式失败:', error)
      setError('更新支付方式失败')
    }
  }

  // 处理删除支付方式
  const handleDeletePaymentMethod = async (id: number) => {
    try {
      await db.paymentMethods.delete(id)
      setSuccess('支付方式删除成功')

      // 重新加载支付方式列表
      const methods = await db.paymentMethods.orderBy('order').toArray()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('删除支付方式失败:', error)
      setError('删除支付方式失败')
    }
  }

  // 处理设置默认支付方式
  const handleSetDefault = async (id: number) => {
    try {
      // 先将所有支付方式设为非默认
      await db.paymentMethods.where('isDefault').equals(1).modify({ isDefault: 0 })
      // 再将当前支付方式设为默认
      await db.paymentMethods.update(id, { isDefault: 1 })

      setSuccess('默认支付方式设置成功')

      // 重新加载支付方式列表
      const methods = await db.paymentMethods.orderBy('order').toArray()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('设置默认支付方式失败:', error)
      setError('设置默认支付方式失败')
    }
  }

  // 处理编辑按钮点击
  const handleEditClick = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod)
    setEditPaymentMethod({
      name: paymentMethod.name,
      icon: paymentMethod.icon,
      color: paymentMethod.color,
      isDefault: paymentMethod.isDefault
    })
    setIsEditDialogOpen(true)
  }

  // 常用图标列表
  const icons = [
    'credit-card', 'dollar-sign', 'message-circle', 'wallet', 'banknote',
    'paypal', 'bitcoin', 'cash', 'check', 'credit-card-2'
  ]

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">支付方式管理</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加支付方式
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
          <p className="font-medium">错误</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
          <p className="font-medium">成功</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="h-[600px] rounded-md border overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">加载中...</div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">暂无支付方式</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              添加第一个支付方式
            </Button>
          </div>
        ) : (
          paymentMethods.map((pm) => (
            <Card key={pm.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: pm.color }}
                  >
                    <span className="text-white">
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
                  <div>
                    <h3 className="font-medium">{pm.name}</h3>
                    {pm.isDefault && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">默认</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!pm.isDefault && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleSetDefault(pm.id!)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      设为默认
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEditClick(pm)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    编辑
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeletePaymentMethod(pm.id!)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 添加支付方式对话框 */}
      {isAddDialogOpen && (
        <Dialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加支付方式</DialogTitle>
              <DialogDescription>
                输入支付方式的名称、选择图标和颜色
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground block mb-1">名称</label>
                <Input
                  id="name"
                  value={newPaymentMethod.name}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                  placeholder="例如：微信支付、支付宝"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="icon" className="text-sm font-medium text-foreground block mb-1">图标</label>
                <select
                  id="icon"
                  value={newPaymentMethod.icon}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, icon: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {icons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon === 'credit-card' && '💳 信用卡'}
                      {icon === 'dollar-sign' && '$ 美元'}
                      {icon === 'message-circle' && '💬 消息'}
                      {icon === 'wallet' && '👛 钱包'}
                      {icon === 'banknote' && '💵 钞票'}
                      {icon === 'paypal' && 'P PayPal'}
                      {icon === 'bitcoin' && '₿ 比特币'}
                      {icon === 'cash' && '💸 现金'}
                      {icon === 'check' && '✓ 支票'}
                      {icon === 'credit-card-2' && '💳 信用卡2'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-medium text-foreground block mb-1">颜色</label>
                <Input
                  id="color"
                  type="color"
                  value={newPaymentMethod.color}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, color: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={newPaymentMethod.isDefault === 1}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, isDefault: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-foreground">设为默认支付方式</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddPaymentMethod}>
                添加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 编辑支付方式对话框 */}
      {isEditDialogOpen && (
        <Dialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑支付方式</DialogTitle>
              <DialogDescription>
                修改支付方式的名称、图标和颜色
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-foreground block mb-1">名称</label>
                <Input
                  id="edit-name"
                  value={editPaymentMethod.name}
                  onChange={(e) => setEditPaymentMethod({ ...editPaymentMethod, name: e.target.value })}
                  placeholder="例如：微信支付、支付宝"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-icon" className="text-sm font-medium text-foreground block mb-1">图标</label>
                <select
                  id="edit-icon"
                  value={editPaymentMethod.icon}
                  onChange={(e) => setEditPaymentMethod({ ...editPaymentMethod, icon: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {icons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon === 'credit-card' && '💳 信用卡'}
                      {icon === 'dollar-sign' && '$ 美元'}
                      {icon === 'message-circle' && '💬 消息'}
                      {icon === 'wallet' && '👛 钱包'}
                      {icon === 'banknote' && '💵 钞票'}
                      {icon === 'paypal' && 'P PayPal'}
                      {icon === 'bitcoin' && '₿ 比特币'}
                      {icon === 'cash' && '💸 现金'}
                      {icon === 'check' && '✓ 支票'}
                      {icon === 'credit-card-2' && '💳 信用卡2'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-color" className="text-sm font-medium text-foreground block mb-1">颜色</label>
                <Input
                  id="edit-color"
                  type="color"
                  value={editPaymentMethod.color}
                  onChange={(e) => setEditPaymentMethod({ ...editPaymentMethod, color: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-isDefault"
                  type="checkbox"
                  checked={editPaymentMethod.isDefault === 1}
                  onChange={(e) => setEditPaymentMethod({ ...editPaymentMethod, isDefault: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="edit-isDefault" className="text-sm font-medium text-foreground">设为默认支付方式</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditPaymentMethod}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default PaymentMethods