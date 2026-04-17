import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { useAuthContext } from './AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import { useUserSettings } from '../hooks/useUserSettings'
import { useUserCategories } from '../hooks/useUserCategories'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuthContext()
  const { transactions, addTransactions: _addTransactions, updateCategory: updateTxCategory, updateTransaction, deleteTransaction, deleteAllTransactions, syncing } = useTransactions(user)

  const [lastImportAt, setLastImportAt] = useState(() => localStorage.getItem('finio_last_import') || null)

  const addTransactions = useCallback(async (txs) => {
    await _addTransactions(txs)
    const now = new Date().toISOString()
    localStorage.setItem('finio_last_import', now)
    setLastImportAt(now)
  }, [_addTransactions])

  const { settings, loading: settingsLoading, saveSettings } = useUserSettings(user?.id)
  const { categories, loading: catsLoading, addCategory, updateCategory, deleteCategory } = useUserCategories(user?.id)

  const income = settings?.income || 0
  const fixedExpenses = settings?.fixed_expenses || []
  const totalFixed = fixedExpenses.reduce((s, f) => s + (f.importe || 0), 0)

  // Current month transactions
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
  }, [transactions, currentMonth, currentYear])

  // Spending by category this month
  const spendingByCategory = useMemo(() => {
    const map = {}
    for (const t of monthTransactions) {
      if (t.amount >= 0) continue // skip income
      const cat = t.category || 'Otros'
      map[cat] = (map[cat] || 0) + Math.abs(t.amount)
    }
    return map
  }, [monthTransactions])

  // Monthly income from transactions
  const monthIncome = useMemo(() => {
    return monthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  }, [monthTransactions])

  // Monthly spending
  const monthSpending = useMemo(() => {
    return monthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  }, [monthTransactions])

  const margen = (income || monthIncome) - monthSpending

  // Days remaining
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysRemaining = lastDay - now.getDate() + 1

  const loading = syncing || settingsLoading || catsLoading

  const value = {
    // Raw data
    transactions,
    monthTransactions,
    categories,
    settings,
    user,
    loading,

    // Computed
    income,
    fixedExpenses,
    totalFixed,
    monthIncome,
    monthSpending,
    spendingByCategory,
    margen,
    daysRemaining,
    currentMonth,
    currentYear,

    // Import tracking
    lastImportAt,

    // Actions
    addTransactions,
    updateTxCategory,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
    saveSettings,
    addCategory,
    updateCategory,
    deleteCategory,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
