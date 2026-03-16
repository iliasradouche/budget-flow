import { createContext, useContext, useState, useCallback } from 'react'
import { useUserSettings, useUpdateUserSettings } from '../hooks/useUserSettings'
import { useToast } from './ToastContext'

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   locale: 'en-US', name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   locale: 'fr-FR', name: 'Euro' },
  { code: 'MAD', symbol: 'MAD', locale: 'fr-MA', name: 'Moroccan Dirham' },
]

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const { toast } = useToast()
  const [loadingRates, setLoadingRates] = useState(false)

  const currency = settings?.currency ?? 'USD'
  const currencyInfo = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]

  const fmt = useCallback((amount) => {
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.code,
      maximumFractionDigits: 2,
    }).format(amount ?? 0)
  }, [currencyInfo])

  async function fetchRate(from, to) {
    setLoadingRates(true)
    try {
      const key = from.toLowerCase()
      const res = await fetch(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${key}.json`
      )
      if (!res.ok) throw new Error(`Rate API error: ${res.status}`)
      const json = await res.json()
      const rate = json[key]?.[to.toLowerCase()]
      if (!rate) throw new Error('Rate not found')
      return rate
    } catch {
      toast({ message: 'Could not fetch exchange rates.', type: 'error' })
      return null
    } finally {
      setLoadingRates(false)
    }
  }

  async function changeCurrency(newCode) {
    if (newCode === currency) return null
    const rate = await fetchRate(currency, newCode)
    await updateSettings.mutateAsync({ currency: newCode })
    return rate
  }

  return (
    <CurrencyContext.Provider value={{ currency, currencyInfo, fmt, changeCurrency, loadingRates }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
