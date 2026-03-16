import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-brand-950">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-brand-950">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <span className="text-xs font-bold text-white">B</span>
            </div>
            <span className="text-base font-bold text-white">BudgetFlow</span>
          </div>
        </div>

        {/* Page content — white rounded container */}
        <div className="min-h-[calc(100vh-64px)] lg:min-h-screen rounded-t-3xl lg:rounded-none bg-gray-50">
          <div className="mx-auto max-w-2xl lg:max-w-5xl px-4 lg:px-8 pt-6 pb-28 lg:pb-8 lg:pt-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
