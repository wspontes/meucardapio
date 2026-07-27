import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { OrderItem } from '@/types'

interface CartState {
  items: OrderItem[]
  couponCode?: string
  couponDiscount: number
  couponType?: 'percentage' | 'fixed'
  couponValue?: number
  deliveryFee: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: OrderItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'UPDATE_BORDER'; payload: { productId: string; border?: string; borderPrice?: number } }
  | { type: 'APPLY_COUPON'; payload: { code: string; type: 'percentage' | 'fixed'; value: number } }
  | { type: 'SET_DELIVERY_FEE'; payload: number }
  | { type: 'CLEAR_CART' }

interface CartContextType {
  state: CartState
  addItem: (item: OrderItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateBorder: (productId: string, border?: string, borderPrice?: number) => void
  applyCoupon: (code: string, type: 'percentage' | 'fixed', value: number) => void
  setDeliveryFee: (fee: number) => void
  clearCart: () => void
  subtotal: number
  discount: number
  total: number
}

const STORAGE_KEY = 'pizzamania_cart'

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* silent */ }
  return { items: [], couponDiscount: 0, deliveryFee: 0 }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((i) => i.productId !== action.payload.productId)
      if (newItems.length === 0) return { items: [], couponDiscount: 0, couponType: undefined, couponValue: undefined, couponCode: undefined, deliveryFee: 0 }
      return { ...state, items: newItems }
    }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      }
    case 'UPDATE_BORDER':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, border: action.payload.border, borderPrice: action.payload.borderPrice }
            : i
        ),
      }
    case 'APPLY_COUPON':
      return {
        ...state,
        couponCode: action.payload.code,
        couponType: action.payload.type,
        couponValue: action.payload.value,
        couponDiscount: action.payload.type === 'percentage' ? 0 : action.payload.value,
      }
    case 'SET_DELIVERY_FEE':
      return { ...state, deliveryFee: action.payload }
    case 'CLEAR_CART':
      return { items: [], couponDiscount: 0, deliveryFee: 0 }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const subtotal = state.items.reduce(
    (acc, item) => acc + (item.price + (item.borderPrice || 0)) * item.quantity,
    0
  )

  let calculatedDiscount = 0
  if (state.couponCode && state.couponType && state.couponValue !== undefined) {
    calculatedDiscount = state.couponType === 'percentage'
      ? (subtotal * state.couponValue) / 100
      : state.couponValue
  }

  const total = subtotal - calculatedDiscount + state.deliveryFee

  const addItem = (item: OrderItem) =>
    dispatch({ type: 'ADD_ITEM', payload: item })
  const removeItem = (productId: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  const updateQuantity = (productId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  const updateBorder = (productId: string, border?: string, borderPrice?: number) =>
    dispatch({ type: 'UPDATE_BORDER', payload: { productId, border, borderPrice } })
  const applyCoupon = (code: string, type: 'percentage' | 'fixed', value: number) =>
    dispatch({ type: 'APPLY_COUPON', payload: { code, type, value } })
  const setDeliveryFee = (fee: number) =>
    dispatch({ type: 'SET_DELIVERY_FEE', payload: fee })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        updateBorder,
        applyCoupon,
        setDeliveryFee,
        clearCart,
        subtotal,
        discount: calculatedDiscount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
