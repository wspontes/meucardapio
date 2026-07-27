import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface Customer {
  name: string
  phone: string
}

interface CustomerContextType {
  customer: Customer | null
  isLoggedIn: boolean
  login: (name: string, phone: string) => void
  logout: () => void
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const full = digits.startsWith('55') ? digits : '55' + digits
  return '+' + full
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const stored = localStorage.getItem('pizzasmania_customer')
      if (!stored) return null
      const parsed = JSON.parse(stored) as Customer
      return { ...parsed, phone: normalizePhone(parsed.phone) }
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (customer) {
      localStorage.setItem('pizzasmania_customer', JSON.stringify(customer))
    } else {
      localStorage.removeItem('pizzasmania_customer')
    }
  }, [customer])

  const login = (name: string, phone: string) => {
    setCustomer({ name: name.trim(), phone: normalizePhone(phone) })
  }

  const logout = () => setCustomer(null)

  return (
    <CustomerContext.Provider value={{ customer, isLoggedIn: !!customer, login, logout }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider')
  return ctx
}
