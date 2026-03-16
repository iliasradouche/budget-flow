import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, PlusCircle, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCurrency } from '../context/CurrencyContext'
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal, useContributeToGoal } from '../hooks/useGoals'
import { goalSchema, contributionSchema } from '../lib/validations'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f59e0b']

function GoalForm({ defaultValues, onSubmit, loading }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultValues || { name: '', target_amount: '', deadline: '', color: '#22c55e' },
  })
  const color = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Goal Name" placeholder="e.g. Emergency Fund"
        error={errors.name?.message} {...register('name')} />
      <Input label="Target Amount" type="number" step="0.01" placeholder="0.00"
        error={errors.target_amount?.message} {...register('target_amount')} />
      <Input label="Deadline (optional)" type="date"
        error={errors.deadline?.message} {...register('deadline')} />
      <div>
        <label className="text-sm font-medium text-gray-700">Color</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setValue('color', c)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
        {defaultValues?.name ? 'Save changes' : 'Create goal'}
      </Button>
    </form>
  )
}

function ContributeForm({ goal, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: '' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: goal.color + '15' }}>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500">Saved so far</span>
          <span className="font-semibold" style={{ color: goal.color }}>{fmt(goal.current_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Still needed</span>
          <span className="font-semibold text-gray-700">{fmt(goal.target_amount - goal.current_amount)}</span>
        </div>
      </div>
      <Input label="Amount to add" type="number" step="0.01" placeholder="0.00"
        error={errors.amount?.message} {...register('amount')} />
      <Button type="submit" loading={loading} className="w-full justify-center">
        Add contribution
      </Button>
    </form>
  )
}

function GoalCard({ g, onContribute, onEdit, onDelete }) {
  const pct = Math.min((g.current_amount / g.target_amount) * 100, 100)
  const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {g.status === 'completed'
            ? <CheckCircle2 size={20} className="text-green-500 shrink-0" />
            : <div className="h-4 w-4 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: g.color }} />
          }
          <div>
            <h3 className="font-semibold text-gray-900">{g.name}</h3>
            {g.deadline && (
              <p className={`text-xs mt-0.5 ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'} · {format(new Date(g.deadline), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {g.status === 'active' && (
            <button onClick={() => onContribute(g)}
              className="p-1.5 rounded-xl text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <PlusCircle size={15} />
            </button>
          )}
          <button onClick={() => onEdit(g)}
            className="p-1.5 rounded-xl text-gray-300 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(g.id)}
            className="p-1.5 rounded-xl text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="font-bold text-gray-900">{fmt(g.current_amount)}</span>
        <span className="text-gray-400 text-xs self-end">of {fmt(g.target_amount)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-gray-400">{pct.toFixed(0)}% complete</span>
        {g.status === 'completed' && <span className="text-xs text-green-600 font-medium">Completed!</span>}
      </div>
    </div>
  )
}

export default function Goals() {
  const [modal, setModal] = useState(null)
  const [contributeGoal, setContributeGoal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { fmt } = useCurrency()
  const { data: goals = [], isLoading } = useGoals()
  const addGoal = useAddGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const contribute = useContributeToGoal()

  const active = goals.filter(g => g.status === 'active')
  const completed = goals.filter(g => g.status === 'completed')

  async function handleAdd(values) { await addGoal.mutateAsync(values); setModal(null) }
  async function handleEdit(values) { await updateGoal.mutateAsync({ id: modal.goal.id, ...values }); setModal(null) }
  async function handleContribute({ amount }) {
    await contribute.mutateAsync({ id: contributeGoal.id, amount, current_amount: contributeGoal.current_amount, target_amount: contributeGoal.target_amount })
    setContributeGoal(null)
  }
  async function handleDelete() { await deleteGoal.mutateAsync(deleteId); setDeleteId(null) }

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-xs text-gray-400">{active.length} active · {completed.length} completed</p>
        </div>
        <Button size="sm" onClick={() => setModal('add')}>
          <Plus size={15} /> New Goal
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-sm text-gray-400 py-12">Loading...</p>
      ) : goals.length === 0 ? (
        <div className="rounded-3xl bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No goals yet. Create your first savings goal!</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Active</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {active.map(g => (
                  <GoalCard key={g.id} g={g}
                    onContribute={setContributeGoal}
                    onEdit={g => setModal({ goal: g })}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Completed</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {completed.map(g => (
                  <GoalCard key={g.id} g={g}
                    onContribute={setContributeGoal}
                    onEdit={g => setModal({ goal: g })}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="New Goal">
        <GoalForm onSubmit={handleAdd} loading={addGoal.isPending} />
      </Modal>
      <Modal open={!!modal?.goal} onClose={() => setModal(null)} title="Edit Goal">
        {modal?.goal && (
          <GoalForm
            defaultValues={{ ...modal.goal, target_amount: String(modal.goal.target_amount), deadline: modal.goal.deadline ?? '' }}
            onSubmit={handleEdit}
            loading={updateGoal.isPending}
          />
        )}
      </Modal>
      <Modal open={!!contributeGoal} onClose={() => setContributeGoal(null)} title={`Add to "${contributeGoal?.name}"`}>
        {contributeGoal && <ContributeForm goal={contributeGoal} onSubmit={handleContribute} loading={contribute.isPending} />}
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Goal">
        <p className="mb-5 text-sm text-gray-500">Are you sure? This cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteGoal.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Layout>
  )
}
