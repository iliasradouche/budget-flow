import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Input from '../components/ui/Input'
import logo from '../logo.png'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', dateOfBirth: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
      } else {
        if (!form.firstName.trim()) throw new Error('First name is required')
        if (!form.lastName.trim()) throw new Error('Last name is required')

        const { data, error } = await signUp(form.email, form.password, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dateOfBirth: form.dateOfBirth || null,
        })
        if (error) throw error

        // Save profile fields into user_settings once row is created
        if (data?.user) {
          await supabase.from('user_settings').upsert({
            user_id: data.user.id,
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            date_of_birth: form.dateOfBirth || null,
          })
        }

        setMessage('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError(''); setMessage('')
  }

  return (
    <div className="flex min-h-screen bg-brand-950">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Beztami" className="h-10 w-10 rounded-xl object-cover" />
          <span className="brand-text text-xl">Beztami</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Take control of<br />your finances
          </h2>
          <p className="text-brand-300 text-lg">
            Track spending, set budgets, and reach your savings goals — all in one place.
          </p>
        </div>
        <p className="text-brand-500 text-sm">© 2025 Beztami</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="Beztami" className="mx-auto mb-3 h-20 w-20 rounded-3xl object-cover shadow-2xl" />
            <h1 className="brand-text text-3xl">Beztami</h1>
            <p className="mt-1 text-sm text-brand-300">Your personal finance tracker</p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="mb-1 text-xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              {mode === 'login' ? 'Sign in to continue' : 'Start tracking your finances'}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Signup-only fields */}
              {mode === 'signup' && (
                <>
                  <div className="flex gap-3">
                    <Input
                      label="First name"
                      placeholder="John"
                      value={form.firstName}
                      onChange={set('firstName')}
                      required
                    />
                    <Input
                      label="Last name"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={set('lastName')}
                      required
                    />
                  </div>
                  <Input
                    label="Date of birth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={set('dateOfBirth')}
                  />
                </>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
              )}
              {message && (
                <p className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-brand-900 py-3 text-sm font-semibold text-white
                  hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-400">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={switchMode} className="font-semibold text-brand-700 hover:underline">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
