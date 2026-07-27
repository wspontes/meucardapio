import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/admin'
import { AdminHeader } from '@/components/admin'
import { useApplyTheme } from '@/hooks'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useApplyTheme()

  return (
    <div className="flex min-h-screen bg-brand-black">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
