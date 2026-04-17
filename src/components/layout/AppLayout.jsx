import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { DataProvider } from '../../contexts/DataContext'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <DataProvider>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="main-area">
        <Topbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </DataProvider>
  )
}
