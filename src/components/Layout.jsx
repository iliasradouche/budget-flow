import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CurrencyPicker from './CurrencyPicker'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const { signOut } = useAuth()

  return (
    <div className="flex h-screen bg-brand-950 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto scroll-touch overscroll-none">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-brand-950 safe-top">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <span className="text-xs font-bold text-white">B</span>
            </div>
            <span className="text-base font-bold text-white">BudgetFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyPicker compact />
            <button onClick={signOut} className="p-1.5 rounded-lg text-brand-400 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="min-h-[calc(100vh-56px)] lg:min-h-screen rounded-t-3xl lg:rounded-none bg-gray-50">
          <div className="mx-auto max-w-2xl lg:max-w-5xl px-4 lg:px-8 pt-6 pb-28 lg:pb-8 lg:pt-8">
            {children}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
