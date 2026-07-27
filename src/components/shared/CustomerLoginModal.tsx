import { useState } from 'react'
import { X, Phone, User } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useCustomer } from '@/contexts/CustomerContext'

interface CustomerLoginModalProps {
  onClose: () => void
}

export function CustomerLoginModal({ onClose }: CustomerLoginModalProps) {
  const { login } = useCustomer()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) return
    login(name, phone)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-3 top-3 text-muted hover:text-white transition-colors">
          <X size={18} />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <User size={24} className="text-accent" />
          </div>
          <h2 className="text-lg font-bold text-white">Entrar</h2>
          <p className="mt-1 text-xs text-muted">Use seu WhatsApp para acompanhar seus pedidos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Seu nome"
            placeholder="Como gostaria de ser chamado?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="WhatsApp"
            placeholder="11999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            icon={<Phone size={16} />}
            required
          />
          <Button type="submit" className="w-full" disabled={!name.trim() || phone.replace(/\D/g, '').length < 10}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
