import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { Button } from '@/components/ui'

const testUser = {
  name: 'Admin Teste',
  username: 'teste',
  email: 'admin@meucardapio.com.br',
  password: 'Teste@123',
  role: 'admin' as const,
}

interface ProductSeed {
  id: string
  name: string
  slug: string
  description: string
  categorySlug: string
  price: number
}

const categories = [
  { id: 'hamburguer', name: 'Hambúrguer', slug: 'hamburguer', order: 1 },
  { id: 'combo', name: 'Combo', slug: 'combo', order: 2 },
  { id: 'bebida', name: 'Bebida', slug: 'bebida', order: 3 },
  { id: 'sobremesa', name: 'Sobremesa', slug: 'sobremesa', order: 4 },
]

const products: ProductSeed[] = [
  { id: 'classico-smash', name: 'Clássico Smash', slug: 'classico-smash', description: 'Pão brioche, smash burger 120g, queijo cheddar, ketchup, mostarda e picles.', categorySlug: 'hamburguer', price: 24.90 },
  { id: 'bacon-supreme', name: 'Bacon Supreme', slug: 'bacon-supreme', description: 'Hambúrguer 180g, cheddar, bacon crocante e molho especial.', categorySlug: 'hamburguer', price: 31.90 },
  { id: 'bbq-ranch', name: 'BBQ Ranch', slug: 'bbq-ranch', description: 'Hambúrguer 180g, cebola caramelizada, queijo prato e molho barbecue.', categorySlug: 'hamburguer', price: 33.90 },
  { id: 'duplo-cheddar', name: 'Duplo Cheddar', slug: 'duplo-cheddar', description: 'Dois hambúrgueres 120g, cheddar cremoso e cebola.', categorySlug: 'hamburguer', price: 36.90 },
  { id: 'chicken-crispy', name: 'Chicken Crispy', slug: 'chicken-crispy', description: 'Filé de frango empanado, alface, tomate e maionese da casa.', categorySlug: 'hamburguer', price: 29.90 },
  { id: 'costela-prime', name: 'Costela Prime', slug: 'costela-prime', description: 'Hambúrguer de costela 180g, queijo coalho e cebola caramelizada.', categorySlug: 'hamburguer', price: 39.90 },
  { id: 'picante-jalapeno', name: 'Picante Jalapeño', slug: 'picante-jalapeno', description: 'Hambúrguer 180g, cheddar, jalapeños e molho picante.', categorySlug: 'hamburguer', price: 34.90 },
  { id: 'australian-burger', name: 'Australian Burger', slug: 'australian-burger', description: 'Pão australiano, hambúrguer 180g, cheddar e bacon.', categorySlug: 'hamburguer', price: 35.90 },
  { id: 'onion-burger', name: 'Onion Burger', slug: 'onion-burger', description: 'Hambúrguer 180g, onion rings, cheddar e molho especial.', categorySlug: 'hamburguer', price: 32.90 },
  { id: 'egg-bacon', name: 'Egg Bacon', slug: 'egg-bacon', description: 'Hambúrguer 180g, ovo, bacon e queijo prato.', categorySlug: 'hamburguer', price: 33.90 },
  { id: 'salad-burger', name: 'Salad Burger', slug: 'salad-burger', description: 'Hambúrguer 150g, alface, tomate, cebola roxa e maionese.', categorySlug: 'hamburguer', price: 27.90 },
  { id: 'cheddar-explosion', name: 'Cheddar Explosion', slug: 'cheddar-explosion', description: 'Hambúrguer duplo, cheddar cremoso e farofa de bacon.', categorySlug: 'hamburguer', price: 37.90 },
  { id: 'monster-burger', name: 'Monster Burger', slug: 'monster-burger', description: 'Dois hambúrgueres 180g, cheddar, bacon, onion rings e barbecue.', categorySlug: 'hamburguer', price: 46.90 },
  { id: 'veggie-burger', name: 'Veggie Burger', slug: 'veggie-burger', description: 'Hambúrguer vegetal, queijo, alface, tomate e molho da casa.', categorySlug: 'hamburguer', price: 29.90 },
  { id: 'combo-classico', name: 'Combo Clássico', slug: 'combo-classico', description: 'Clássico Smash + batata frita + refrigerante 350ml.', categorySlug: 'combo', price: 39.90 },
  { id: 'combo-bacon', name: 'Combo Bacon', slug: 'combo-bacon', description: 'Bacon Supreme + batata frita + refrigerante 350ml.', categorySlug: 'combo', price: 46.90 },
  { id: 'combo-bbq', name: 'Combo BBQ', slug: 'combo-bbq', description: 'BBQ Ranch + batata rústica + refrigerante 350ml.', categorySlug: 'combo', price: 48.90 },
  { id: 'combo-chicken', name: 'Combo Chicken', slug: 'combo-chicken', description: 'Chicken Crispy + batata frita + refrigerante 350ml.', categorySlug: 'combo', price: 42.90 },
  { id: 'combo-costela', name: 'Combo Costela', slug: 'combo-costela', description: 'Costela Prime + batata rústica + refrigerante 350ml.', categorySlug: 'combo', price: 54.90 },
  { id: 'combo-casal', name: 'Combo Casal', slug: 'combo-casal', description: 'Dois hambúrgueres, duas batatas médias e dois refrigerantes.', categorySlug: 'combo', price: 89.90 },
  { id: 'combo-familia', name: 'Combo Família', slug: 'combo-familia', description: 'Quatro hambúrgueres, duas batatas grandes e quatro refrigerantes.', categorySlug: 'combo', price: 149.90 },
  { id: 'combo-monster', name: 'Combo Monster', slug: 'combo-monster', description: 'Monster Burger + batata grande + milkshake 300ml.', categorySlug: 'combo', price: 59.90 },
  { id: 'refrigerante-lata', name: 'Refrigerante Lata', slug: 'refrigerante-lata', description: 'Coca-Cola, Guaraná, Fanta ou Sprite 350ml.', categorySlug: 'bebida', price: 6.90 },
  { id: 'refrigerante-600ml', name: 'Refrigerante 600ml', slug: 'refrigerante-600ml', description: 'Coca-Cola, Guaraná ou Fanta 600ml.', categorySlug: 'bebida', price: 9.90 },
  { id: 'agua-mineral', name: 'Água Mineral', slug: 'agua-mineral', description: 'Água mineral sem gás 500ml.', categorySlug: 'bebida', price: 4.50 },
  { id: 'suco-natural', name: 'Suco Natural', slug: 'suco-natural', description: 'Sabores laranja, limão ou maracujá.', categorySlug: 'bebida', price: 8.90 },
  { id: 'milkshake-chocolate', name: 'Milkshake Chocolate', slug: 'milkshake-chocolate', description: 'Milkshake cremoso de chocolate 400ml.', categorySlug: 'bebida', price: 17.90 },
  { id: 'milkshake-morango', name: 'Milkshake Morango', slug: 'milkshake-morango', description: 'Milkshake cremoso de morango 400ml.', categorySlug: 'bebida', price: 17.90 },
  { id: 'brownie-sorvete', name: 'Brownie com Sorvete', slug: 'brownie-sorvete', description: 'Brownie artesanal com sorvete de creme e calda de chocolate.', categorySlug: 'sobremesa', price: 19.90 },
  { id: 'petit-gateau', name: 'Petit Gateau', slug: 'petit-gateau', description: 'Bolinho de chocolate com recheio cremoso e sorvete.', categorySlug: 'sobremesa', price: 21.90 },
  { id: 'churros-doce-leite', name: 'Churros com Doce de Leite', slug: 'churros-doce-leite', description: 'Churros crocantes com doce de leite e açúcar.', categorySlug: 'sobremesa', price: 16.90 },
  { id: 'sundae-chocolate', name: 'Sundae Chocolate', slug: 'sundae-chocolate', description: 'Sorvete de creme, calda de chocolate e confeitos.', categorySlug: 'sobremesa', price: 14.90 },
  { id: 'sundae-morango', name: 'Sundae Morango', slug: 'sundae-morango', description: 'Sorvete de creme, calda de morango e confeitos.', categorySlug: 'sobremesa', price: 14.90 },
  { id: 'cookie-recheado', name: 'Cookie Recheado', slug: 'cookie-recheado', description: 'Cookie artesanal com gotas de chocolate e recheio cremoso.', categorySlug: 'sobremesa', price: 13.90 },
  { id: 'cheesecake-frutas', name: 'Cheesecake de Frutas Vermelhas', slug: 'cheesecake-frutas', description: 'Cheesecake com cobertura de frutas vermelhas.', categorySlug: 'sobremesa', price: 18.90 },
  { id: 'pudim-artesanal', name: 'Pudim Artesanal', slug: 'pudim-artesanal', description: 'Pudim de leite condensado com calda de caramelo.', categorySlug: 'sobremesa', price: 12.90 },
]

const catIdBySlug: Record<string, string> = {}
categories.forEach((c) => { catIdBySlug[c.slug] = c.id })

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

      for (const cat of categories) {
        await setDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          active: true,
        })
      }

      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), {
          name: p.name,
          slug: p.slug,
          description: p.description,
          categoryId: catIdBySlug[p.categorySlug],
          price: p.price,
          active: true,
          customizable: !['bebida', 'sobremesa'].includes(p.categorySlug),
        })
      }

      setStatus('success')
      setMessage(`Dados criados! ${categories.length} categorias e ${products.length} produtos.`)
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
        <h1 className="mb-2 text-xl font-bold text-brand-white">Seed - Dados Iniciais</h1>
        <p className="mb-6 text-sm text-muted">
          Cria usuário admin + cardápio completo no Firestore
        </p>

        <div className="mb-6 rounded-lg bg-surface-hover p-4 text-left text-sm">
          <p className="text-brand-white font-medium mb-2">Conta que será criada:</p>
          <p className="text-muted">Usuário: <span className="text-brand-white">teste</span></p>
          <p className="text-muted">Senha: <span className="text-brand-white">Teste@123</span></p>
          <p className="text-muted mt-2">+ {categories.length} categorias e {products.length} produtos</p>
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
