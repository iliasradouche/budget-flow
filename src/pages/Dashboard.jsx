import { useMemo, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, ChevronRight, RotateCcw } from 'lucide-react'

import { useQueryClient } from '@tanstack/react-query'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { useAuth } from '../context/AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'
import { processRecurring } from '../hooks/useRecurring'
import { useBudgetRollovers, computeAndStoreRollovers } from '../hooks/useBudgetRollover'
import { useToast } from '../context/ToastContext'
import { useCurrency } from '../context/CurrencyContext'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { fmt } = useCurrency()
  const qc = useQueryClient()
  const processed = useRef(false)

  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const from = format(startOfMonth(now), 'yyyy-MM-dd')
  const to = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data: transactions = [] } = useTransactions({ from, to })
  const { data: categories = [] } = useCategories()
  const { data: goals = [] } = useGoals()
  const { data: rollovers = {} } = useBudgetRollovers(currentMonth)
  const { data: settings } = useUserSettings()

  // ── Auto-process recurring transactions once per session ──────────────────
  useEffect(() => {
    if (!user || processed.current) return
    processed.current = true

    ;(async () => {
      const count = await processRecurring(user.id)
      if (count > 0) {
        qc.invalidateQueries({ queryKey: ['transactions'] })
        toast({ message: `${count} recurring transaction${count > 1 ? 's' : ''} added automatically.` })
      }
    })()
  }, [user])

  // ── Compute budget rollovers once per month ───────────────────────────────
  useEffect(() => {
    if (!user || !categories.length) return
    computeAndStoreRollovers(user.id, categories).then(() => {
      qc.invalidateQueries({ queryKey: ['rollovers'] })
    })
  }, [user, categories.length])

  // ── Derived data ──────────────────────────────────────────────────────────
  const { income, expenses, balance, byCategory, recentTx, totalBudget, totalSpent } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = income - expenses

    const expCat = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const name = t.categories?.name ?? 'Other'
      const color = t.categories?.color ?? '#94a3b8'
      expCat[name] = { value: (expCat[name]?.value ?? 0) + t.amount, color }
    })
    const byCategory = Object.entries(expCat).map(([name, { value, color }]) => ({ name, value, color }))
    const recentTx = [...transactions].slice(0, 5)
    const totalBudget = categories.filter(c => c.budget_limit).reduce((s, c) => s + c.budget_limit, 0)

    return { income, expenses, balance, byCategory, recentTx, totalBudget, totalSpent: expenses }
  }, [transactions, categories])

  const categoryProgress = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense' && c.budget_limit)
      .map(c => {
        const spent = transactions
          .filter(t => t.category_id === c.id && t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0)
        const rollover = rollovers[c.id] ?? 0
        const effectiveBudget = c.budget_limit + rollover
        return { ...c, spent, rollover, effectiveBudget, pct: Math.min((spent / effectiveBudget) * 100, 100) }
      })
  }, [categories, transactions, rollovers])

  const displayName = settings?.first_name
    ? `${settings.first_name}${settings.last_name ? ' ' + settings.last_name : ''}`
    : 'there'
  const totalRollover = Object.values(rollovers).reduce((s, v) => s + v, 0)
  const effectiveTotalBudget = totalBudget + totalRollover
  const budgetPct = effectiveTotalBudget > 0 ? Math.min((totalSpent / effectiveTotalBudget) * 100, 100) : 0
  const remaining = Math.max(effectiveTotalBudget - totalSpent, 0)

  return (
    <Layout>
      {/* Greeting */}
      <div className="lg:hidden mb-6">
        <p className="text-sm text-gray-500">{format(now, 'MMMM yyyy')}</p>
        <h1 className="text-xl font-bold text-gray-900">Hi, {displayName}!</h1>
      </div>

      {/* Balance hero */}
      <div className="rounded-3xl bg-brand-900 text-white p-6 mb-5">
        <p className="text-brand-300 text-sm mb-1">Total balance</p>
        <div className="mb-4">
          <span className="text-2xl sm:text-3xl font-bold break-all leading-tight">{fmt(balance)}</span>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-brand-800/60 rounded-2xl px-3 py-2.5 flex-1 min-w-0">
            <div className="p-1.5 bg-green-500/20 rounded-lg shrink-0">
              <TrendingUp size={15} className="text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-brand-300">Income</p>
              <p className="text-xs font-semibold truncate">{fmt(income)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-brand-800/60 rounded-2xl px-3 py-2.5 flex-1 min-w-0">
            <div className="p-1.5 bg-red-500/20 rounded-lg shrink-0">
              <TrendingDown size={15} className="text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-brand-300">Expenses</p>
              <p className="text-xs font-semibold truncate">{fmt(expenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget overview */}
      {effectiveTotalBudget > 0 && (
        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">My budget</h2>
            <span className="text-xs text-gray-400">{transactions.length} transactions</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">{format(now, 'MMMM yyyy')}</p>
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-gray-900">{fmt(totalSpent)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-brand-500" />
                <p className="text-xs text-gray-500">Spent</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{fmt(remaining)}</p>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                <div className="h-2 w-2 rounded-full bg-gray-200" />
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-400' : 'bg-brand-500'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{fmt(totalSpent)} / {fmt(effectiveTotalBudget)}</p>
            {totalRollover > 0 && (
              <div className="flex items-center gap-1 text-xs text-brand-600 font-medium">
                <RotateCcw size={11} />
                +{fmt(totalRollover)} rolled over
              </div>
            )}
          </div>
        </div>
      )}

      {/* Per-category budget bars with rollover */}
      {categoryProgress.length > 0 && (
        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Budget by category</h2>
          <div className="flex flex-col gap-4">
            {categoryProgress.map(c => (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-gray-800">{c.name}</span>
                    {c.rollover > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-brand-500 font-medium">
                        <RotateCcw size={10} /> +{fmt(c.rollover)}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${c.pct >= 90 ? 'text-red-500' : 'text-gray-400'}`}>
                    {fmt(c.spent)} / {fmt(c.effectiveBudget)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${c.pct}%`,
                      backgroundColor: c.pct >= 90 ? '#ef4444' : c.pct >= 70 ? '#f59e0b' : c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals */}
      {goals.filter(g => g.status === 'active').length > 0 && (
        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Savings goals</h2>
            <a href="/goals" className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </a>
          </div>
          <div className="flex flex-col gap-4">
            {goals.filter(g => g.status === 'active').slice(0, 3).map(g => {
              const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="font-medium text-gray-800">{g.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{fmt(g.current_amount)} of {fmt(g.target_amount)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spending breakdown pie */}
      {byCategory.length > 0 && (
        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Spending breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                {byCategory.map(entry => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
            {byCategory.map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-xs text-gray-500">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
          <a href="/transactions" className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
            View all <ChevronRight size={14} />
          </a>
        </div>
        {transactions.length > 0 && (
          <p className="text-xs text-gray-400 mb-4">{fmt(expenses)} spent this month</p>
        )}
        {recentTx.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No transactions this month</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {recentTx.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white text-xs font-bold"
                  style={{ backgroundColor: t.categories?.color ?? '#94a3b8' }}>
                  {(t.categories?.name ?? 'TX').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.note || t.categories?.name || 'Transaction'}
                  </p>
                  <p className="text-xs text-gray-400">{format(new Date(t.date), 'MMM d')}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
