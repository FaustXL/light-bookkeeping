import Dexie, { type EntityTable } from 'dexie'

export interface Category {
  id?: number
  name: string
  icon: string
  type: 'income' | 'expense'
  color: string
  order: number
}

export interface Transaction {
  id?: number
  amount: number
  type: 'income' | 'expense'
  categoryId: number
  categoryName: string
  note: string
  date: Date
  createdAt: Date
  source: '微信账单' | '支付宝账单' | '软件记录'
  merchantName: string
  paymentMethod: string
}

export interface PaymentMethod {
  id?: number
  name: string
  icon: string
  color: string
  isDefault: number
  order: number
}

const db = new Dexie('LightBookkeeping') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  categories: EntityTable<Category, 'id'>
  paymentMethods: EntityTable<PaymentMethod, 'id'>
}

db.version(1).stores({
  transactions: '++id, type, categoryId, date, createdAt, source, merchantName, paymentMethod',
  categories: '++id, type, order',
  paymentMethods: '++id, name, isDefault, order',
})

let _initPromise: Promise<void> | null = null

export function initDefaultCategories() {
  if (!_initPromise) {
    _initPromise = _doInit()
  }
  return _initPromise
}

export function initDefaultPaymentMethods() {
  return _doInit()
}

async function _doInit() {
  const [categoryCount, paymentMethodCount] = await Promise.all([
    db.categories.count(),
    db.paymentMethods.count()
  ])

  // 初始化默认分类
  if (categoryCount === 0) {
    const defaultExpenseCategories: Omit<Category, 'id'>[] = [
      { name: '餐饮', icon: 'utensils', type: 'expense', color: '#f97316', order: 1 },
      { name: '交通', icon: 'car', type: 'expense', color: '#3b82f6', order: 2 },
      { name: '购物', icon: 'shopping-bag', type: 'expense', color: '#ec4899', order: 3 },
      { name: '日用', icon: 'home', type: 'expense', color: '#8b5cf6', order: 4 },
      { name: '娱乐', icon: 'gamepad-2', type: 'expense', color: '#06b6d4', order: 5 },
      { name: '医疗', icon: 'heart-pulse', type: 'expense', color: '#ef4444', order: 6 },
      { name: '教育', icon: 'book-open', type: 'expense', color: '#14b8a6', order: 7 },
      { name: '通讯', icon: 'smartphone', type: 'expense', color: '#6366f1', order: 8 },
      { name: '服饰', icon: 'shirt', type: 'expense', color: '#f43f5e', order: 9 },
      { name: '住房', icon: 'building', type: 'expense', color: '#9333ea', order: 10 },
      { name: '水电燃气', icon: 'droplets', type: 'expense', color: '#06b6d4', order: 11 },
      { name: '保险', icon: 'shield', type: 'expense', color: '#f59e0b', order: 12 },
      { name: '旅游', icon: 'airplane', type: 'expense', color: '#3b82f6', order: 13 },
      { name: '健身', icon: 'dumbbell', type: 'expense', color: '#10b981', order: 14 },
      { name: '美容', icon: 'scissors', type: 'expense', color: '#ec4899', order: 15 },
      { name: '宠物', icon: 'paw-print', type: 'expense', color: '#f97316', order: 16 },
      { name: '育儿', icon: 'baby-carriage', type: 'expense', color: '#8b5cf6', order: 17 },
      { name: '礼品', icon: 'gift', type: 'expense', color: '#ef4444', order: 18 },
      { name: '外卖', icon: 'food-truck', type: 'expense', color: '#f97316', order: 19 },
      { name: '咖啡', icon: 'coffee', type: 'expense', color: '#6b7280', order: 20 },
      { name: '其他', icon: 'more-horizontal', type: 'expense', color: '#64748b', order: 21 },
    ]

    const defaultIncomeCategories: Omit<Category, 'id'>[] = [
      { name: '工资', icon: 'wallet', type: 'income', color: '#22c55e', order: 1 },
      { name: '奖金', icon: 'gift', type: 'income', color: '#f59e0b', order: 2 },
      { name: '投资', icon: 'trending-up', type: 'income', color: '#3b82f6', order: 3 },
      { name: '兼职', icon: 'briefcase', type: 'income', color: '#8b5cf6', order: 4 },
      { name: '红包', icon: 'banknote', type: 'income', color: '#ef4444', order: 5 },
      { name: '理财', icon: 'pie-chart', type: 'income', color: '#10b981', order: 6 },
      { name: '股息', icon: 'dollar-sign', type: 'income', color: '#22c55e', order: 7 },
      { name: '利息', icon: 'interest', type: 'income', color: '#3b82f6', order: 8 },
      { name: '租金', icon: 'home', type: 'income', color: '#9333ea', order: 9 },
      { name: '退款', icon: 'arrow-return-left', type: 'income', color: '#f59e0b', order: 10 },
      { name: '报销', icon: 'file-text', type: 'income', color: '#14b8a6', order: 11 },
      { name: '礼金', icon: 'gift', type: 'income', color: '#ec4899', order: 12 },
      { name: '其他', icon: 'more-horizontal', type: 'income', color: '#64748b', order: 13 },
    ]

    await db.categories.bulkAdd([...defaultExpenseCategories, ...defaultIncomeCategories])
  }

  // 初始化默认支付方式
    if (paymentMethodCount === 0) {
      const defaultPaymentMethods: Omit<PaymentMethod, 'id'>[] = [
        { name: '微信支付', icon: 'message-circle', color: '#07C160', isDefault: 1, order: 1 },
        { name: '支付宝', icon: 'credit-card', color: '#1677FF', isDefault: 0, order: 2 },
        { name: '现金', icon: 'dollar-sign', color: '#F59E0B', isDefault: 0, order: 3 },
        { name: '银行卡', icon: 'credit-card', color: '#3B82F6', isDefault: 0, order: 4 },
        { name: '其他', icon: 'more-horizontal', color: '#64748B', isDefault: 0, order: 5 },
      ]

      await db.paymentMethods.bulkAdd(defaultPaymentMethods)
    }
}

export { db }
