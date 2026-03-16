import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useUserSettings, useUpdateUserSettings } from '../hooks/useUserSettings'
import { useToast } from './ToastContext'

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   locale: 'en-US',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   locale: 'de-DE',  name: 'Euro' },
  { code: 'GBP', symbol: '£',   locale: 'en-GB',  name: 'British Pound' },
  { code: 'AED', symbol: 'AED', locale: 'ar-AE',  name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', locale: 'ar-SA',  name: 'Saudi Riyal' },
  { code: 'CAD', symbol: 'CA$', locale: 'en-CA',  name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  locale: 'en-AU',  name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥',   locale: 'ja-JP',  name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', locale: 'de-CH',  name: 'Swiss Franc' },
  { code: 'MAD', symbol: 'MAD', locale: 'fr-MA',  name: 'Moroccan Dirham' },
  { code: 'TRY', symbol: '₺',   locale: 'tr-TR',  name: 'Turkish Lira' },
  { code: 'INR', symbol: '₹',   locale: 'en-IN',  name: 'Indian Rupee' },
]

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const { toast } = useToast()
  const [rates, setRates] = useState({})
  const [loadingRates, setLoadingRates] = useState(false)

  const currency = settings?.currency ?? 'USD'
  const currencyInfo = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]

  // Fetch exchange rates from Frankfurter (free, no API key)
  async function fetchRates(base = 'USD') {
    setLoadingRates(true)
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`)
      const json = await res.json()
      setRates({ ...json.rates, [base]: 1 })
      return json.rates
    } catch {
      toast({ message: 'Could not fetch exchange rates. Using 1:1 rate.', type: 'error' })
      return {}
    } finally {
      setLoadingRates(false)
    }
  }

  // Format an amount in the current currency
  const fmt = useCallback((amount) => {
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.code,
      maximumFractionDigits: currencyInfo.code === 'JPY' ? 0 : 2,
    }).format(amount ?? 0)
  }, [currencyInfo])

  // Change currency — optionally returns the exchange rate for callers to convert amounts
  async function changeCurrency(newCode) {
    if (newCode === currency) return null

    const newInfo = CURRENCIES.find(c => c.code === newCode)
    if (!newInfo) return null

    const fetchedRates = await fetchRates(currency)
    const rate = fetchedRates[newCode] ?? 1

    await updateSettings.mutateAsync({ currency: newCode })
    return rate
  }

  return (
    <CurrencyContext.Provider value={{ currency, currencyInfo, fmt, changeCurrency, rates, loadingRates }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
