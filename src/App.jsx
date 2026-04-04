import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Upload from './pages/Upload'
import Categories from './pages/Categories'
import Presupuesto from './pages/Presupuesto'
import Coach from './pages/Coach'
import Login from './pages/Login'
import Onboarding from './components/ui/Onboarding'
import { useTransactions } from './hooks/useTransactions'
import { useCategories } from './hooks/useCategories'
import { useAuth } from './hooks/useAuth'

const ONBOARDING_KEY = 'finio_onboarding_done'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2F9FB' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#185FA5' }}>
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>F</span>
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-tri-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-tri-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-tri-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function AppInner({ user, signOut }) {
  const { transactions, addTransactions, updateCategory } = useTransactions(user)
  const cats = useCategories()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    if (!user) return
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done && transactions.length === 0) setShowOnboarding(true)
  }, [user, transactions.length])

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  const shared = { transactions, selectedMonth, onMonthChange: setSelectedMonth, cats }

  return (
    <>
      {showOnboarding && <Onboarding onDismiss={dismissOnboarding} />}
      <Routes>
        <Route element={<Layout user={user} onSignOut={signOut} />}>
          <Route path="/"              element={<Dashboard    {...shared} />} />
          <Route path="/transacciones" element={<Transactions {...shared} updateCategory={updateCategory} />} />
          <Route path="/presupuesto"   element={<Presupuesto  {...shared} />} />
          <Route path="/categorias"    element={<Categories   {...shared} />} />
          <Route path="/subir"         element={<Upload       addTransactions={addTransactions} cats={cats} />} />
          <Route path="/coach"         element={<Coach        {...shared} addTransactions={addTransactions} />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  const { user, loading, signInWithEmail, signOut } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login signInWithEmail={signInWithEmail} />}
        />
        <Route
          path="/*"
          element={user ? <AppInner user={user} signOut={signOut} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </HashRouter>
  )
}
