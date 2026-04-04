import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Upload from './pages/Upload'
import Categories from './pages/Categories'
import Presupuesto from './pages/Presupuesto'
import Coach from './pages/Coach'
import Onboarding from './components/ui/Onboarding'
import { useTransactions } from './hooks/useTransactions'
import { useCategories } from './hooks/useCategories'

const ONBOARDING_KEY = 'finio_onboarding_done'

export default function App() {
  const { transactions, addTransactions, updateCategory } = useTransactions()
  const cats = useCategories()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Show onboarding if never dismissed AND no transactions yet
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done && transactions.length === 0) setShowOnboarding(true)
  }, [transactions.length])

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  const shared = { transactions, selectedMonth, onMonthChange: setSelectedMonth, cats }

  return (
    <HashRouter>
      {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard    {...shared} />} />
          <Route path="/transacciones" element={<Transactions {...shared} updateCategory={updateCategory} />} />
          <Route path="/presupuesto"   element={<Presupuesto  {...shared} />} />
          <Route path="/categorias"    element={<Categories   {...shared} />} />
          <Route path="/subir"         element={<Upload       addTransactions={addTransactions} cats={cats} />} />
          <Route path="/coach"         element={<Coach        {...shared} addTransactions={addTransactions} />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
