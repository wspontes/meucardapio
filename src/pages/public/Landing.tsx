import { Link } from 'react-router-dom'
import { UtensilsCrossed, Smartphone, Share2, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'

const features = [
  { icon: Smartphone, title: 'Cardápio Digital', desc: 'Seus clientes acessam o cardápio pelo celular, sem precisar baixar app.' },
  { icon: Share2, title: 'Compartilhe com um link', desc: 'Envie o link do seu cardápio no WhatsApp, Instagram e redes sociais.' },
  { icon: BarChart3, title: 'Gestão de Pedidos', desc: 'Receba e gerencie pedidos online com painel administrativo completo.' },
]

const steps = [
  'Faça seu cadastro gratuitamente',
  'Personalize seu cardápio com fotos e preços',
  'Compartilhe o link e comece a vender!',
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-black">
      <header className="border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <UtensilsCrossed className="text-accent" size={24} />
            MeuCardapio
          </div>
          <Link to="/auth/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-3xl md:text-6xl font-bold text-white leading-tight mb-6">
          Seu cardápio digital
          <br />
          <span className="text-accent">gratuito e sem complicação</span>
        </h1>
        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
          Crie um cardápio online para sua lanchonete, hamburgueria ou restaurante.
          Compartilhe o link e receba pedidos direto no WhatsApp.
        </p>
        <Link to="/cadastro">
          <Button size="lg" className="gap-2">
            Criar meu cardápio grátis
            <ArrowRight size={18} />
          </Button>
        </Link>
        <p className="text-xs text-muted mt-3">Sem cartão de crédito. Cadastro gratuito.</p>
      </section>

      <section className="border-t border-border/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Como funciona
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-xl border border-border bg-surface p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Comece em 3 passos
          </h2>
          <div className="mx-auto max-w-xl space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <CheckCircle size={18} className="text-accent shrink-0" />
                  <p className="text-white">{step}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/cadastro">
              <Button size="lg" className="gap-2">
                Criar meu cardápio agora
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted">
        <div className="container mx-auto px-4">MeuCardapio Digital</div>
      </footer>
    </div>
  )
}
