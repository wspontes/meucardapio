import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { storesService } from '@/services'
import { loginSchema, type LoginFormData } from '@/utils/validators'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      const redirect = searchParams.get('redirect') || (user.storeId ? undefined : '/cadastro')
      if (redirect) {
        navigate(redirect, { replace: true })
      } else if (user.storeId) {
        storesService.getById(user.storeId).then((store) => {
          if (store) {
            navigate(`/${store.slug}/admin`, { replace: true })
          }
        }).catch(() => {
          navigate('/cadastro', { replace: true })
        })
      }
    }
  }, [user, loading, navigate, searchParams])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      setError('')
      await login(data.identifier, data.password)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('user-not-found') || message.includes('wrong-password') || message.includes('invalid-credential') || message === 'Usuário não encontrado') {
        setError('Usuário ou senha inválidos')
      } else if (message.includes('too-many-requests')) {
        setError('Muitas tentativas. Tente novamente mais tarde')
      } else {
        setError('Erro ao fazer login. Verifique suas credenciais')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-6 text-xl font-bold text-white">Entrar</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Usuário"
          type="text"
          placeholder="Seu usuário ou email"
          icon={<User size={16} />}
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Sua senha"
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

        <Button type="submit" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Não tem conta?{' '}
        <Link to="/auth/register" className="text-accent hover:text-red-400">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
