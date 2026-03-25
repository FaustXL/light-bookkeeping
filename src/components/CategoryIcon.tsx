import {
  Utensils, Car, ShoppingBag, Home, Gamepad2, HeartPulse,
  BookOpen, Smartphone, Shirt, MoreHorizontal, Wallet, Gift,
  TrendingUp, Briefcase, Banknote, type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'utensils': Utensils,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'home': Home,
  'gamepad-2': Gamepad2,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  'smartphone': Smartphone,
  'shirt': Shirt,
  'more-horizontal': MoreHorizontal,
  'wallet': Wallet,
  'gift': Gift,
  'trending-up': TrendingUp,
  'briefcase': Briefcase,
  'banknote': Banknote,
}

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { container: 'w-8 h-8', icon: 14 },
  md: { container: 'w-10 h-10', icon: 18 },
  lg: { container: 'w-12 h-12', icon: 22 },
}

export function CategoryIcon({ icon, color, size = 'md' }: CategoryIconProps) {
  const Icon = iconMap[icon] || MoreHorizontal
  const s = sizeMap[size]

  return (
    <div
      className={`${s.container} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: color + '18' }}
    >
      <Icon size={s.icon} style={{ color }} />
    </div>
  )
}
