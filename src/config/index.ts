export const appConfig = {
  name: 'MeuCardápio',
  slogan: 'Cardápio digital para seu estabelecimento',
  description: 'Sistema de gestão para estabelecimentos',
  version: '1.0.0',
} as const

export const themeConfig = {
  colors: {
    primary: '#dc2626',
    secondary: '#16a34a',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#fafafa',
    muted: '#a3a3a3',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
} as const

export const orderStatus = {
  waitingPayment: 'Aguardando Pagamento',
  received: 'Recebido',
  accepted: 'Aceito',
  preparing: 'Preparando',
  outForDelivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
} as const

export type OrderStatus = keyof typeof orderStatus

export const userRoles = {
  admin: 'Administrador',
  manager: 'Gerente',
  attendant: 'Atendente',
  kitchen: 'Cozinha',
  delivery: 'Entregador',
  customer: 'Cliente',
} as const

export type UserRole = keyof typeof userRoles
