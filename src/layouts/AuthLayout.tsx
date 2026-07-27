import { Outlet } from 'react-router-dom'
import { useStore } from '@/contexts/StoreContext'

export function AuthLayout() {
  const { store } = useStore()
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">{store?.name || 'MeuCardápio'}</h1>
          <p className="mt-2 text-muted">Faça login para continuar</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
