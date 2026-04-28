import { Link, useLocation } from 'react-router-dom'
import { Home, Users, CalendarDays, UserCircle } from 'lucide-react'

const tabs = [
  { path: '/mobile', label: '首页', icon: Home },
  { path: '/mobile/customers', label: '客户', icon: Users },
  { path: '/mobile/activities', label: '活动', icon: CalendarDays },
  { path: '/mobile/me', label: '我的', icon: UserCircle },
]

export default function MobileTabBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
