import { useState } from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-page">
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main
        className="min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 56 : 208 }}
      >
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
