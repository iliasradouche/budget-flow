import { useState } from 'react'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { useCurrency, CURRENCIES } from '../context/CurrencyContext'
import { useTransactions } from '../hooks/useTransactions'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function CurrencyPicker({ compact = false }) {
  const { currency, changeCurrency, loadingRates } = useCurrency()
  const { data: transactions = [] } = useTransactions({})
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [converting, setConverting] = useState(false)

  async function handleSelect(newCode) {
    if (newCode === currency) { setOpen(false); return }
    setOpen(false)
    setConverting(true)

    try {
      const rate = await changeCurrency(newCode)

      if (rate && rate !== 1 && transactions.length > 0) {
        for (const t of transactions) {
          await supabase
            .from('transactions')
            .update({ amount: Math.round(t.amount * rate * 100) / 100 })
            .eq('id', t.id)
        }
        qc.invalidateQueries({ queryKey: ['transactions'] })
        toast({ message: `Switched to ${newCode} — ${transactions.length} transactions converted.` })
      } else {
        toast({ message: `Currency changed to ${newCode}.` })
      }
    } finally {
      setConverting(false)
    }
  }

  const current = CURRENCIES.find(c => c.code === currency)
  const busy = converting || loadingRates

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-xl transition-colors font-medium
          ${compact
            ? 'h-8 px-2.5 text-xs bg-brand-800 text-brand-200 hover:bg-brand-700 disabled:opacity-60'
            : 'px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 w-full justify-between disabled:opacity-60'
          }`}
      >
        {busy
          ? <Loader2 size={13} className="animate-spin" />
          : current?.symbol !== current?.code && <span>{current?.symbol}</span>
        }
        <span>{currency}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-1 w-52 rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 overflow-hidden
            ${compact ? 'top-full right-0' : 'bottom-full left-0 mb-1'}`}>
            <div className="py-1">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c.code)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 text-right font-medium text-gray-500 text-xs">{c.symbol}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{c.code}</p>
                      <p className="text-xs text-gray-400">{c.name}</p>
                    </div>
                  </div>
                  {c.code === currency && <Check size={14} className="text-brand-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
