import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout, AdminLayout, KitchenLayout, StoreLayout } from '@/layouts'
import { ProtectedRoute } from '@/components/shared'
import { StoreGuard } from '@/components/shared/StoreGuard'

const Landing = lazy(() => import('@/pages/public/Landing'))
const RegisterStore = lazy(() => import('@/pages/public/RegisterStore'))
const Login = lazy(() => import('@/pages/public/Login'))
const Register = lazy(() => import('@/pages/public/Register'))
const Home = lazy(() => import('@/pages/public/Home'))
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
const KitchenDashboard = lazy(() => import('@/pages/kitchen/Dashboard'))
const Seed = lazy(() => import('@/pages/dev/Seed'))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

function ChunkError() {
  setTimeout(() => window.location.reload(), 2000)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Atualizando... Nova versão disponível</p>
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
      { index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
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
