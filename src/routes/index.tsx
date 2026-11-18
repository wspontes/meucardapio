import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom'
import { AuthLayout, AdminLayout, KitchenLayout, StoreLayout } from '@/layouts'
import { ProtectedRoute } from '@/components/shared'
import { StoreGuard } from '@/components/shared/StoreGuard'

const Landing = lazy(() => import('@/pages/public/Landing'))
const RegisterStore = lazy(() => import('@/pages/public/RegisterStore'))
const Login = lazy(() => import('@/pages/public/Login'))
const Register = lazy(() => import('@/pages/public/Register'))
const Menu = lazy(() => import('@/pages/public/Menu'))
const Cart = lazy(() => import('@/pages/public/Cart'))
const Checkout = lazy(() => import('@/pages/public/Checkout'))
const OrderConfirmed = lazy(() => import('@/pages/public/OrderConfirmed'))
const MyOrders = lazy(() => import('@/pages/public/MyOrders'))
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('@/pages/admin/Products'))
const AdminProductForm = lazy(() => import('@/pages/admin/ProductForm'))
const AdminCategories = lazy(() => import('@/pages/admin/Categories'))
const AdminOrders = lazy(() => import('@/pages/admin/OrdersAdmin'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))
const AdminCoupons = lazy(() => import('@/pages/admin/CouponsAdmin'))
const AdminMotoboys = lazy(() => import('@/pages/admin/MotoboysAdmin'))
const KitchenDashboard = lazy(() => import('@/pages/kitchen/Dashboard'))
const Seed = lazy(() => import('@/pages/dev/Seed'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

const CHUNK_RELOAD_KEY = 'meucardapio:chunk-reload-at'
const CHUNK_RELOAD_COOLDOWN = 15000

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|Failed to fetch/i.test(message)
}

function ChunkError() {
  const error = useRouteError()
  const chunkError = isChunkLoadError(error)

  useEffect(() => {
    // Só recarrega quando o problema é realmente um chunk antigo após deploy.
    // Erros de renderização NÃO devem recarregar a página (isso causava loop infinito).
    if (!chunkError) return

    try {
      const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
      if (Date.now() - lastReload < CHUNK_RELOAD_COOLDOWN) return
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
    } catch {
      // sessionStorage indisponível: não recarrega automaticamente
      return
    }

    const timer = setTimeout(() => window.location.reload(), 1500)
    return () => clearTimeout(timer)
  }, [chunkError])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">
        {chunkError ? 'Atualizando para a versão mais recente...' : 'Algo deu errado ao carregar esta página'}
      </p>
      {!chunkError && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          Recarregar
        </button>
      )}
    </div>
  )
}

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={['admin', 'manager', 'attendant']}>{children}</ProtectedRoute>
}

function ProtectedKitchen({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={['admin', 'kitchen']}>{children}</ProtectedRoute>
}

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ChunkError />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Landing /></Suspense> },
      { path: 'cadastro', element: <Suspense fallback={<PageLoader />}><RegisterStore /></Suspense> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <ChunkError />,
    children: [
      { path: 'login', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: 'register', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
    ],
  },
  {
    path: '/:slug',
    element: <StoreLayout />,
    errorElement: <ChunkError />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Menu /></Suspense> },
      { path: 'cardapio', element: <Suspense fallback={<PageLoader />}><Menu /></Suspense> },
      { path: 'carrinho', element: <Suspense fallback={<PageLoader />}><Cart /></Suspense> },
      { path: 'checkout', element: <Suspense fallback={<PageLoader />}><Checkout /></Suspense> },
      { path: 'pedido/confirmacao', element: <Suspense fallback={<PageLoader />}><OrderConfirmed /></Suspense> },
      { path: 'meus-pedidos', element: <Suspense fallback={<PageLoader />}><MyOrders /></Suspense> },
    ],
  },
  {
    path: '/:slug/admin',
    element: <StoreGuard><ProtectedAdmin><AdminLayout /></ProtectedAdmin></StoreGuard>,
    errorElement: <ChunkError />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
      { path: 'pedidos', element: <Suspense fallback={<PageLoader />}><AdminOrders /></Suspense> },
      { path: 'produtos', element: <Suspense fallback={<PageLoader />}><AdminProducts /></Suspense> },
      { path: 'produtos/novo', element: <Suspense fallback={<PageLoader />}><AdminProductForm /></Suspense> },
      { path: 'produtos/:id/editar', element: <Suspense fallback={<PageLoader />}><AdminProductForm /></Suspense> },
      { path: 'categorias', element: <Suspense fallback={<PageLoader />}><AdminCategories /></Suspense> },
      { path: 'cupons', element: <Suspense fallback={<PageLoader />}><AdminCoupons /></Suspense> },
      { path: 'configuracoes', element: <Suspense fallback={<PageLoader />}><AdminSettings /></Suspense> },
      { path: 'motoboys', element: <Suspense fallback={<PageLoader />}><AdminMotoboys /></Suspense> },
    ],
  },
  {
    path: '/:slug/cozinha',
    element: <StoreGuard><ProtectedKitchen><KitchenLayout /></ProtectedKitchen></StoreGuard>,
    errorElement: <ChunkError />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><KitchenDashboard /></Suspense> },
    ],
  },
  {
    path: '/seed',
    element: <Suspense fallback={<PageLoader />}><Seed /></Suspense>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
