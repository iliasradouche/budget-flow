import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ message, type = 'success', duration = 4000 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg pointer-events-auto
              text-sm font-medium transition-all
              ${t.type === 'success' ? 'bg-brand-900 text-white' : 'bg-red-600 text-white'}`}
          >
            {t.type === 'success'
              ? <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-brand-300" />
              : <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-200" />
            }
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
