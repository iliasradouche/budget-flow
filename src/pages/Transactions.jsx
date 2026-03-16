import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, Download, Search, RefreshCw, Pause, Play } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Papa from 'papaparse'
import { useCurrency } from '../context/CurrencyContext'
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { useCategories, useAddCategory } from '../hooks/useCategories'
import { useRecurringTransactions, useAddRecurring, useDeleteRecurring, useToggleRecurring } from '../hooks/useRecurring'
import { transactionSchema, recurringSchema } from '../lib/validations'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select } from '../components/ui/Input'

const INTERVAL_LABELS = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

// ── Transaction Form ─────────────────────────────────────────────────────────
function QuickAddCategory({ type, onCreated }) {
  const addCat = useAddCategory()
  const [name, setName] = useState('')
  const COLORS = ['#22c55e','#3b82f6','#f97316','#8b5cf6','#ef4444','#06b6d4','#ec4899','#f59e0b']
  const [color, setColor] = useState('#22c55e')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const cat = await addCat.mutateAsync({ name: name.trim(), type, color, icon: 'tag', budget_limit: '' })
    onCreated(cat)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-2xl border border-brand-100 bg-brand-50 p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-brand-700">New category</p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Category name..."
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="flex gap-1.5 flex-wrap">
        {COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)}
            className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={addCat.isPending} className="flex-1 justify-center">
          Add
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onCreated(null)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function TransactionForm({ defaultValues, onSubmit, loading }) {
  const { data: categories = [] } = useCategories()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultValues || { type: 'expense', amount: '', category_id: '', note: '', date: format(new Date(), 'yyyy-MM-dd') },
  })
  const type = watch('type')
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  function handleCategoryCreated(cat) {
    setShowQuickAdd(false)
    if (cat) setValue('category_id', cat.id)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Select label="Type" error={errors.type?.message} {...register('type')}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </Select>
      <Input label="Amount" type="number" step="0.01" placeholder="0.00"
        error={errors.amount?.message} {...register('amount')} />

      {/* Category with inline quick-add */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <button type="button" onClick={() => setShowQuickAdd(v => !v)}
            className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-800 transition-colors">
            <Plus size={12} /> New category
          </button>
        </div>
        <Select error={errors.category_id?.message} {...register('category_id')}>
          <option value="">No category</option>
          {categories.filter(c => c.type === type).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {showQuickAdd && <QuickAddCategory type={type} onCreated={handleCategoryCreated} />}
      </div>

      <Input label="Note" placeholder="Optional note..."
        error={errors.note?.message} {...register('note')} />
      <Input label="Date" type="date"
        error={errors.date?.message} {...register('date')} />
      <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
        {defaultValues?.amount ? 'Save changes' : 'Add transaction'}
      </Button>
    </form>
  )
}

// ── Recurring Form ────────────────────────────────────────────────────────────
function RecurringForm({ onSubmit, loading }) {
  const { data: categories = [] } = useCategories()
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: 'expense', amount: '', category_id: '', note: '',
      interval_type: 'monthly', next_date: format(new Date(), 'yyyy-MM-dd'),
    },
  })
  const type = watch('type')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Select label="Type" error={errors.type?.message} {...register('type')}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </Select>
      <Input label="Amount" type="number" step="0.01" placeholder="0.00"
        error={errors.amount?.message} {...register('amount')} />
      <Select label="Category" error={errors.category_id?.message} {...register('category_id')}>
        <option value="">No category</option>
        {categories.filter(c => c.type === type).map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>
      <Input label="Note / Label" placeholder="e.g. Netflix, Rent..."
        error={errors.note?.message} {...register('note')} />
      <Select label="Repeat every" error={errors.interval_type?.message} {...register('interval_type')}>
        <option value="weekly">Week</option>
        <option value="monthly">Month</option>
        <option value="yearly">Year</option>
      </Select>
      <Input label="First occurrence" type="date"
        error={errors.next_date?.message} {...register('next_date')} />
      <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
        Create recurring transaction
      </Button>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Transactions() {
  const [tab, setTab] = useState('all') // 'all' | 'recurring'
  const [filters, setFilters] = useState({})
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteRecurringId, setDeleteRecurringId] = useState(null)

  const { fmt } = useCurrency()
  const { data: transactions = [], isLoading } = useTransactions(filters)
  const { data: recurring = [], isLoading: recurringLoading } = useRecurringTransactions()

  const addTx = useAddTransaction()
  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()
  const addRecurring = useAddRecurring()
  const deleteRecurring = useDeleteRecurring()
  const toggleRecurring = useToggleRecurring()

  const filtered = transactions.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.note?.toLowerCase().includes(q) || t.categories?.name?.toLowerCase().includes(q)
  })

  function exportCSV() {
    const rows = filtered.map(t => ({
      Date: t.date, Type: t.type, Amount: t.amount,
      Category: t.categories?.name ?? '', Note: t.note ?? '',
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'transactions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAdd(values) { await addTx.mutateAsync(values); setModal(null) }
  async function handleEdit(values) { await updateTx.mutateAsync({ id: modal.tx.id, ...values }); setModal(null) }
  async function handleDelete() { await deleteTx.mutateAsync(deleteId); setDeleteId(null) }
  async function handleAddRecurring(values) { await addRecurring.mutateAsync(values); setModal(null) }
  async function handleDeleteRecurring() { await deleteRecurring.mutateAsync(deleteRecurringId); setDeleteRecurringId(null) }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <p className="text-xs text-gray-400">{filtered.length} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportCSV} className="hidden sm:flex">
            <Download size={14} /> CSV
          </Button>
          <Button size="sm" onClick={() => setModal(tab === 'recurring' ? 'add-recurring' : 'add')}>
            <Plus size={15} /> Add
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-white p-1 shadow-sm w-fit">
        {[['all', 'All Transactions'], ['recurring', 'Recurring']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors
              ${tab === key ? 'bg-brand-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {key === 'recurring' && <RefreshCw size={13} />}
            {label}
            {key === 'recurring' && recurring.length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold
                ${tab === key ? 'bg-brand-700 text-brand-200' : 'bg-gray-100 text-gray-500'}`}>
                {recurring.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ALL TRANSACTIONS TAB ── */}
      {tab === 'all' && (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search transactions..."
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                onChange={e => setFilters(f => ({ ...f, type: e.target.value || undefined }))}>
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input type="month"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                onChange={e => {
                  if (!e.target.value) { setFilters(f => { const n = { ...f }; delete n.from; delete n.to; return n }); return }
                  const [y, m] = e.target.value.split('-')
                  const last = new Date(y, m, 0).getDate()
                  setFilters(f => ({ ...f, from: `${y}-${m}-01`, to: `${y}-${m}-${last}` }))
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">No transactions found</p>
            ) : (
              <>
                {/* Mobile */}
                <div className="divide-y divide-gray-50 sm:hidden">
                  {filtered.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white text-xs font-bold"
                        style={{ backgroundColor: t.categories?.color ?? '#94a3b8' }}>
                        {(t.categories?.name ?? 'TX').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.note || t.categories?.name || 'Transaction'}</p>
                        <p className="text-xs text-gray-400">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                        </span>
                        <button onClick={() => setModal({ tx: t })} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop */}
                <table className="hidden sm:table w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Note</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-500">{format(new Date(t.date), 'MMM d, yyyy')}</td>
                        <td className="px-5 py-3.5">
                          {t.categories
                            ? <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{ backgroundColor: t.categories.color + '20', color: t.categories.color }}>
                                {t.categories.name}
                              </span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-[200px] truncate">{t.note || '—'}</td>
                        <td className={`px-5 py-3.5 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setModal({ tx: t })} className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-700"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteId(t.id)} className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </>
      )}

      {/* ── RECURRING TAB ── */}
      {tab === 'recurring' && (
        <div className="rounded-3xl bg-white shadow-sm overflow-hidden">
          {recurringLoading ? (
            <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
          ) : recurring.length === 0 ? (
            <div className="py-16 text-center">
              <RefreshCw size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">No recurring transactions yet.</p>
              <p className="text-xs text-gray-300 mt-1">Add rent, salary, subscriptions — they'll auto-post each cycle.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recurring.map(r => (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-4 ${!r.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white text-xs font-bold"
                    style={{ backgroundColor: r.categories?.color ?? '#94a3b8' }}>
                    <RefreshCw size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.note || r.categories?.name || 'Recurring'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{INTERVAL_LABELS[r.interval_type]}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">Next: {format(new Date(r.next_date), 'MMM d, yyyy')}</span>
                      {!r.is_active && <span className="text-xs text-amber-500 font-medium">Paused</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-sm font-semibold mr-1 ${r.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                      {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                    </span>
                    <button
                      onClick={() => toggleRecurring.mutate({ id: r.id, is_active: !r.is_active })}
                      className="p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      title={r.is_active ? 'Pause' : 'Resume'}
                    >
                      {r.is_active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => setDeleteRecurringId(r.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Transaction">
        <TransactionForm onSubmit={handleAdd} loading={addTx.isPending} />
      </Modal>
      <Modal open={modal === 'add-recurring'} onClose={() => setModal(null)} title="New Recurring Transaction">
        <RecurringForm onSubmit={handleAddRecurring} loading={addRecurring.isPending} />
      </Modal>
      <Modal open={!!modal?.tx} onClose={() => setModal(null)} title="Edit Transaction">
        {modal?.tx && (
          <TransactionForm
            defaultValues={{ ...modal.tx, amount: String(modal.tx.amount), category_id: modal.tx.category_id ?? '' }}
            onSubmit={handleEdit}
            loading={updateTx.isPending}
          />
        )}
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Transaction">
        <p className="mb-5 text-sm text-gray-500">Are you sure? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteTx.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
      <Modal open={!!deleteRecurringId} onClose={() => setDeleteRecurringId(null)} title="Delete Recurring Transaction">
        <p className="mb-2 text-sm text-gray-500">This will stop future auto-generation.</p>
        <p className="mb-5 text-sm text-gray-400">Past transactions already created won't be affected.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteRecurringId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteRecurring.isPending} onClick={handleDeleteRecurring}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
