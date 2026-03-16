import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Target, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/goals', icon: Target, label: 'Goals' },
]

export default function Sidebar() {
  const { signOut, user } = useAuth()

  return (
    <aside className="hidden lg:flex h-screen w-60 flex-col bg-brand-950 px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
          <span className="text-sm font-bold text-white">B</span>
        </div>
        <span className="text-lg font-bold text-white">BudgetFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
              ${isActive
                ? 'bg-brand-700 text-white'
                : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-brand-800 pt-4">
        <p className="mb-3 truncate px-2 text-xs text-brand-400">{user?.email}</p>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
            text-brand-300 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
