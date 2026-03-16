import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Target, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CurrencyPicker from './CurrencyPicker'
import logo from '../logo.png'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { signOut, user } = useAuth()

  return (
    <aside className="hidden lg:flex h-screen w-60 flex-col bg-brand-950 px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <img src={logo} alt="Beztami" className="h-10 w-10 rounded-xl object-cover" />
        <span className="brand-text text-xl">Beztami</span>
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
              ${isActive ? 'bg-brand-700 text-white' : 'text-brand-200 hover:bg-brand-800 hover:text-white'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Currency picker */}
      <div className="border-t border-brand-800 pt-4 mb-3">
        <p className="px-1 mb-1.5 text-xs text-brand-500 font-medium">Currency</p>
        <CurrencyPicker />
      </div>

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
