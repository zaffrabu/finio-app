import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Pages
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import VistaAnual from './pages/anual/VistaAnual'
import Movimientos from './pages/movimientos/Movimientos'
import Alertas from './pages/alertas/Alertas'
import Proyecciones from './pages/proyecciones/Proyecciones'
import Recurrentes from './pages/recurrentes/Recurrentes'
import Categorias from './pages/categorias/Categorias'
import Ajustes from './pages/ajustes/Ajustes'
import Import from './pages/importar/Import'
import Conciliaciones from './pages/conciliaciones/Conciliaciones'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="login" element={<Login />} />

          {/* Auth required */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="anual" element={<VistaAnual />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="proyecciones" element={<Proyecciones />} />
            <Route path="recurrentes" element={<Recurrentes />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="importar" element={<Import />} />
            <Route path="conciliaciones" element={<Conciliaciones />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
