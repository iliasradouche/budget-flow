import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMessage('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-950">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <span className="text-base font-bold text-white">B</span>
          </div>
          <span className="text-xl font-bold text-white">BudgetFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Take control of<br />your finances
          </h2>
          <p className="text-brand-300 text-lg">
            Track spending, set budgets, and reach your savings goals — all in one place.
          </p>
        </div>
        <p className="text-brand-500 text-sm">© 2025 BudgetFlow</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <h1 className="text-2xl font-bold text-white">BudgetFlow</h1>
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
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
                className="font-semibold text-brand-700 hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
