import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { CustomerProvider } from '@/contexts/CustomerContext'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { router } from '@/routes'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <CustomerProvider>
            <ToastProvider>
              <ErrorBoundary>
                <RouterProvider router={router} />
              </ErrorBoundary>
            </ToastProvider>
          </CustomerProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
