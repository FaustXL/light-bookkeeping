import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { ToastProvider } from '@/components/ui/toast'
import { useEffect, useState, useRef } from 'react'
import { initDefaultCategories, initDefaultPaymentMethods } from '@/lib/db'
import Dashboard from '@/pages/Dashboard'
import AddTransaction from '@/pages/AddTransaction'
import Transactions from '@/pages/Transactions'
import TransactionDetail from '@/pages/TransactionDetail'
import Statistics from '@/pages/Statistics'
import Settings from '@/pages/Settings'
import PaymentMethods from '@/pages/PaymentMethods'
import { App as CapacitorApp } from '@capacitor/app'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [lastBackPressTime, setLastBackPressTime] = useState<number>(0)
  const [showExitPrompt, setShowExitPrompt] = useState<boolean>(false)
  const exitPromptTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    initDefaultCategories()
    initDefaultPaymentMethods()
  }, [])

  // 处理硬件返回键
  useEffect(() => {
    let backButtonListener: any = null
    
    const handleBackButton = (event: any) => {
      event.preventDefault()
      
      // 正确获取HashRouter下的路径
      const currentPath = window.location.hash.replace('#', '')
      
      if (currentPath === '/') {
        // 首页：双击退出
        const now = Date.now()
        
        if (now - lastBackPressTime < 2000) {
          CapacitorApp.exitApp()
        } else {
          setLastBackPressTime(now)
          setShowExitPrompt(true)
          
          // 2秒后隐藏提示
          if (exitPromptTimeout.current) {
            clearTimeout(exitPromptTimeout.current)
          }
          exitPromptTimeout.current = setTimeout(() => {
            setShowExitPrompt(false)
          }, 2000)
        }
      } else {
        // 其他页面：返回上一页
        window.history.back()
      }
    }

    // 注册返回键事件监听器
    CapacitorApp.addListener('backButton', handleBackButton).then(listener => {
      backButtonListener = listener
    })

    // 清理函数
    return () => {
      backButtonListener?.remove()
      if (exitPromptTimeout.current) {
        clearTimeout(exitPromptTimeout.current)
      }
    }
  }, []) // 只执行一次

  // 定义需要隐藏BottomNav的路由
  const shouldHideBottomNav = location.pathname === '/add' || location.pathname === '/payment-methods' || location.pathname.startsWith('/transaction/')

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background relative">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transaction/:id" element={<TransactionDetail />} />
        <Route path="/stats" element={<Statistics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
      </Routes>
      {!shouldHideBottomNav && <BottomNav />}
      
      {/* 退出提示 */}
      {showExitPrompt && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            再按一次退出应用
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </HashRouter>
  )
}

export default App
