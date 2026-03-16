import { useState } from 'react'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import { useUpdateRolloverSetting } from '../hooks/useBudgetRollover'
import { categorySchema } from '../lib/validations'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select } from '../components/ui/Input'

const ICONS = ['tag', 'briefcase', 'laptop', 'utensils', 'car', 'home', 'heart', 'shopping-bag', 'tv', 'coffee', 'gift', 'book', 'music', 'plane', 'zap']
const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1']

function CategoryForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues || { name: '', type: 'expense', color: '#22c55e', icon: 'tag', budget_limit: '' },
  })
  const color = watch('color')
  const icon = watch('icon')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Name" placeholder="e.g. Groceries"
        error={errors.name?.message} {...register('name')} />
      <Select label="Type" error={errors.type?.message} {...register('type')}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </Select>
      <Input label="Monthly Budget Limit (optional)" type="number" step="0.01" placeholder="0.00"
        error={errors.budget_limit?.message} {...register('budget_limit')} />
      <div>
        <label className="text-sm font-medium text-gray-700">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setValue('color', c)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Icon label</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ICONS.map(ic => (
            <button key={ic} type="button" onClick={() => setValue('icon', ic)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all
                ${icon === ic ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {ic}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
        {defaultValues?.name ? 'Save changes' : 'Add category'}
      </Button>
    </form>
  )
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function Categories() {
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data: categories = [], isLoading } = useCategories()
  const addCat = useAddCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()
  const updateRollover = useUpdateRolloverSetting()

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  async function handleAdd(values) { await addCat.mutateAsync(values); setModal(null) }
  async function handleEdit(values) { await updateCat.mutateAsync({ id: modal.cat.id, ...values }); setModal(null) }
  async function handleDelete() { await deleteCat.mutateAsync(deleteId); setDeleteId(null) }

  function CategoryGroup({ title, items }) {
    if (items.length === 0) return null
    return (
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
        <div className="rounded-3xl bg-white shadow-sm overflow-hidden divide-y divide-gray-50">
          {items.map(c => (
            <div key={c.id} className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white text-sm font-bold"
                  style={{ backgroundColor: c.color }}>
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.budget_limit
                    ? <p className="text-xs text-gray-400">Limit: {fmt(c.budget_limit)} / mo</p>
                    : <p className="text-xs text-gray-400">No budget limit</p>
                  }
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ cat: c })}
                    className="p-1.5 rounded-xl text-gray-300 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(c.id)}
                    className="p-1.5 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Rollover toggle — only shown for expense categories with a budget limit */}
              {c.type === 'expense' && c.budget_limit && (
                <div className="mt-3 ml-14 flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={13} className={c.enable_rollover ? 'text-brand-600' : 'text-gray-400'} />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Budget rollover</p>
                      <p className="text-xs text-gray-400">Carry unused budget to next month</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateRollover.mutate({ id: c.id, enable_rollover: !c.enable_rollover })}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
                      transition-colors focus:outline-none
                      ${c.enable_rollover ? 'bg-brand-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                      ${c.enable_rollover ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="text-xs text-gray-400">{categories.length} total</p>
        </div>
        <Button size="sm" onClick={() => setModal('add')}>
          <Plus size={15} /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-gray-400 py-12">Loading...</p>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No categories yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <CategoryGroup title="Expense categories" items={expense} />
          <CategoryGroup title="Income categories" items={income} />
        </div>
      )}

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Category">
        <CategoryForm onSubmit={handleAdd} loading={addCat.isPending} />
      </Modal>
      <Modal open={!!modal?.cat} onClose={() => setModal(null)} title="Edit Category">
        {modal?.cat && (
          <CategoryForm
            defaultValues={{ ...modal.cat, budget_limit: modal.cat.budget_limit ? String(modal.cat.budget_limit) : '' }}
            onSubmit={handleEdit}
            loading={updateCat.isPending}
          />
        )}
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Category">
        <p className="mb-5 text-sm text-gray-500">Transactions using this category will lose their category assignment.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteCat.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
