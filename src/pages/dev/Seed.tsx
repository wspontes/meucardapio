import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { Button } from '@/components/ui'

const testUser = {
  name: 'Admin Teste',
  username: 'teste',
  email: 'admin@meucardapio.com.br',
  password: 'Teste@123',
  role: 'admin' as const,
}

export default function Seed() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const createSeedData = async () => {
    setStatus('loading')
    setMessage('')

    try {
      let uid: string

      try {
        const result = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password)
        uid = result.user.uid
      } catch (err: unknown) {
        const error = err as { code?: string }
        if (error.code === 'auth/email-already-in-use') {
          const result = await signInWithEmailAndPassword(auth, testUser.email, testUser.password)
          uid = result.user.uid
        } else {
          throw err
        }
      }

      await setDoc(doc(db, 'users', uid), {
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await setDoc(doc(db, 'categories', 'pizzas'), {
        name: 'Lanches',
        slug: 'lanches',
        order: 1,
        active: true,
      })

      await setDoc(doc(db, 'categories', 'bebidas'), {
        name: 'Bebidas',
        slug: 'bebidas',
        order: 2,
        active: true,
      })

      await setDoc(doc(db, 'categories', 'sobremesas'), {
        name: 'Sobremesas',
        slug: 'sobremesas',
        order: 3,
        active: true,
      })

      await setDoc(doc(db, 'products', 'pizza-margherita'), {
        name: 'X-Burger Especial',
        slug: 'x-burger-especial',
        description: 'Pão, hambúrguer, queijo, alface, tomate e molho especial',
        categoryId: 'pizzas',
        price: 28.90,
        active: true,
        featured: true,
        customizable: true,
      })

      await setDoc(doc(db, 'products', 'pizza-calabresa'), {
        name: 'Combo Fritas',
        slug: 'combo-fritas',
        description: 'Porção de batata frita com queijo derretido e bacon',
        categoryId: 'pizzas',
        price: 32.00,
        active: true,
        featured: true,
        customizable: true,
      })

      await setDoc(doc(db, 'products', 'coca-cola-2l'), {
        name: 'Coca-Cola 2L',
        slug: 'coca-cola-2l',
        description: 'Refrigerante Coca-Cola 2 litros',
        categoryId: 'bebidas',
        price: 10.00,
        active: true,
        featured: false,
        customizable: false,
      })

      setStatus('success')
      setMessage('Dados criados com sucesso! Você já pode fazer login.')
    } catch (err) {
      setStatus('error')
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/network-request-failed') {
        setMessage('Sem conexão com a internet')
      } else {
        setMessage('Erro: ' + (error.message || 'Desconhecido'))
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="mb-2 text-xl font-bold text-white">Seed - Dados Iniciais</h1>
        <p className="mb-6 text-sm text-muted">
          Cria usuário admin + dados de exemplo no Firestore
        </p>

        <div className="mb-6 rounded-lg bg-surface-hover p-4 text-left text-sm">
          <p className="text-white font-medium mb-2">Conta que será criada:</p>
          <p className="text-muted">Usuário: <span className="text-white">teste</span></p>
          <p className="text-muted">Senha: <span className="text-white">Teste@123</span></p>
          <p className="text-muted">+ Categorias e produtos de exemplo</p>
        </div>

        <Button
          onClick={createSeedData}
          loading={status === 'loading'}
          className="w-full"
          size="lg"
        >
          {status === 'loading' ? 'Criando...' : 'Criar Dados Iniciais'}
        </Button>

        {message && (
          <p className={`mt-4 text-sm ${
            status === 'success' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
