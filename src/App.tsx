import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { ToastProvider } from '@/components/ui/toast'
import { useEffect } from 'react'
import { initDefaultCategories, initDefaultPaymentMethods } from '@/lib/db'
import Dashboard from '@/pages/Dashboard'
import AddTransaction from '@/pages/AddTransaction'
import Transactions from '@/pages/Transactions'
import TransactionDetail from '@/pages/TransactionDetail'
import Statistics from '@/pages/Statistics'
import Settings from '@/pages/Settings'
import PaymentMethods from '@/pages/PaymentMethods'

function AppContent() {
  const location = useLocation()
  
  useEffect(() => {
    initDefaultCategories()
    initDefaultPaymentMethods()
  }, [])

  // 定义需要隐藏BottomNav的路由
  const shouldHideBottomNav = location.pathname === '/add'

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
