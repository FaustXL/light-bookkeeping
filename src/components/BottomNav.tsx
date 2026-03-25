import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ListOrdered, Plus, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/transactions', icon: ListOrdered, label: '明细' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-40">
      <div className="max-w-lg mx-auto">
        {/* Floating Glass Navigation */}
        <div className="glass-card rounded-2xl px-2 py-2">
          <div className="flex items-center justify-around">
            {tabs.map(tab => {
              const isActive = location.pathname === tab.path

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <tab.icon className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              )
            })}

            {/* Add Button - Floating Action */}
            <button
              onClick={() => navigate('/add')}
              className="flex flex-col items-center justify-center -mt-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#72a5f8] flex items-center justify-center shadow-xl shadow-[#72a5f8]/40 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
