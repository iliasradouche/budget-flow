import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CurrencyPicker from './CurrencyPicker'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'
import logo from '../logo.png'

export default function Layout({ children }) {
  const { signOut } = useAuth()

  return (
    <div className="flex h-screen bg-brand-950 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto scroll-touch overscroll-none">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-brand-950"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex items-center justify-between px-5 py-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="Beztami" className="h-9 w-9 rounded-xl object-cover" />
              <span className="brand-text text-lg">Beztami</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <CurrencyPicker compact />
              <button
                onClick={signOut}
                className="flex items-center justify-center h-8 w-8 rounded-xl bg-brand-800 text-brand-300 hover:bg-brand-700 hover:text-white transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="min-h-[calc(100vh-56px)] lg:min-h-screen rounded-t-3xl lg:rounded-none bg-gray-50">
          <div className="mx-auto max-w-2xl lg:max-w-5xl px-4 lg:px-8 pt-6 lg:pb-8 lg:pt-8"
              style={{ paddingBottom: 'calc(6rem + max(env(safe-area-inset-bottom), 24px))' }}>
            {children}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
