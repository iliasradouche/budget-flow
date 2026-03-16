import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUserSettings, useUpdateUserSettings } from '../hooks/useUserSettings'
import { useToast } from '../context/ToastContext'
import { useCurrency, CURRENCIES } from '../context/CurrencyContext'
import Layout from '../components/Layout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'Too long'),
  last_name:  z.string().min(1, 'Last name is required').max(50, 'Too long'),
  date_of_birth: z.string().optional(),
})

function Section({ title, children }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { data: settings, isLoading } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const { toast } = useToast()
  const { currency, changeCurrency } = useCurrency()

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '', date_of_birth: '' },
  })

  useEffect(() => {
    if (settings) {
      reset({
        first_name:    settings.first_name    ?? '',
        last_name:     settings.last_name     ?? '',
        date_of_birth: settings.date_of_birth ?? '',
      })
    }
  }, [settings, reset])

  async function onSaveProfile(values) {
    try {
      await updateSettings.mutateAsync(values)
      toast({ message: 'Profile updated.' })
      reset(values)
    } catch {
      toast({ message: 'Failed to save profile.', type: 'error' })
    }
  }

  const fullName = [settings?.first_name, settings?.last_name].filter(Boolean).join(' ')
  const initials = [settings?.first_name?.[0], settings?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="flex flex-col gap-4">

        {/* Profile card */}
        <div className="rounded-3xl bg-brand-900 p-5 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white text-xl font-bold">
            {isLoading ? '…' : initials}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white truncate">
              {isLoading ? '—' : fullName || 'No name set'}
            </p>
            <p className="text-sm text-brand-300 truncate">{user?.email}</p>
            {settings?.date_of_birth && (
              <p className="text-xs text-brand-400 mt-0.5">
                Born {new Date(settings.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Edit profile */}
        <Section title="Edit Profile">
          <form onSubmit={handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input label="First name" placeholder="John"
                error={errors.first_name?.message} {...register('first_name')} />
              <Input label="Last name" placeholder="Doe"
                error={errors.last_name?.message} {...register('last_name')} />
            </div>
            <Input label="Date of birth" type="date"
              error={errors.date_of_birth?.message} {...register('date_of_birth')} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 truncate">{user?.email}</span>
              </div>
            </div>

            <Button
              type="submit"
              loading={updateSettings.isPending}
              disabled={!isDirty}
              className="w-full justify-center mt-1"
            >
              Save changes
            </Button>
          </form>
        </Section>

        {/* Currency */}
        <Section title="Currency">
          <p className="text-sm text-gray-500 mb-3">
            All amounts are converted using live exchange rates when you switch.
          </p>
          <div className="flex flex-col gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => changeCurrency(c.code)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-colors
                  ${currency === c.code
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold
                    ${currency === c.code ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                    {c.symbol}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${currency === c.code ? 'text-brand-700' : 'text-gray-900'}`}>
                      {c.code}
                    </p>
                    <p className="text-xs text-gray-400">{c.name}</p>
                  </div>
                </div>
                {currency === c.code && <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
              </button>
            ))}
          </div>
        </Section>

        {/* Account */}
        <Section title="Account">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-red-500
              hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </Section>

      </div>
    </Layout>
  )
}
