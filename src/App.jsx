import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Upload from './pages/Upload'
import Categories from './pages/Categories'
import Presupuesto from './pages/Presupuesto'
import Coach from './pages/Coach'
import { useTransactions } from './hooks/useTransactions'

export default function App() {
  const { transactions, addTransactions, updateCategory } = useTransactions()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard    transactions={transactions} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />} />
          <Route path="/transacciones" element={<Transactions transactions={transactions} updateCategory={updateCategory} />} />
          <Route path="/presupuesto"   element={<Presupuesto  transactions={transactions} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />} />
          <Route path="/categorias"    element={<Categories   transactions={transactions} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />} />
          <Route path="/subir"         element={<Upload       addTransactions={addTransactions} />} />
          <Route path="/coach"         element={<Coach        transactions={transactions} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
