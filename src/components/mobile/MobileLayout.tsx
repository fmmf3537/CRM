import { Outlet } from 'react-router-dom'
import MobileTabBar from './MobileTabBar'

export default function MobileLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 overflow-auto pb-16">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  )
}
