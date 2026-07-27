import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Lock, Eye, EyeOff, AtSign } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { registerSchema, type RegisterFormData } from '@/utils/validators'

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true)
      setError('')
      await registerUser({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      })
      navigate('/auth/login')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('email-already-in-use')) {
        setError('Este email já está em uso')
      } else if (message.includes('weak-password')) {
        setError('Senha muito fraca')
      } else {
        setError('Erro ao criar conta. Tente novamente')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-6 text-xl font-bold text-white">Criar Conta</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome"
          placeholder="Seu nome completo"
          icon={<User size={16} />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Usuário"
          placeholder="Nome de usuário para login"
          icon={<AtSign size={16} />}
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            icon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-muted hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <Input
          label="Confirmar Senha"
          type="password"
          placeholder="Repita a senha"
          icon={<Lock size={16} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" loading={loading}>
          Criar Conta
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Já tem conta?{' '}
        <Link to="/auth/login" className="text-accent hover:text-red-400">
          Faça login
        </Link>
      </p>
    </div>
  )
}
