import { useState, useEffect } from 'react'
import { Clock, MapPin, CreditCard, Image, Plus, Phone, Trash2, Sparkles, CircleDot, Eye, EyeOff, Palette, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { ImageUpload, ProductCard } from '@/components/shared'
import { settingsService, productsService } from '@/services'
import { type BusinessSettings } from '@/services/settings'
import type { Product } from '@/types'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { formatCurrency } from '@/utils'

export default function Settings() {
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState([
    { day: 'Domingo', open: '18:00', close: '22:00', closed: false },
    { day: 'Segunda-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Terça-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quarta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Quinta-feira', open: '18:00', close: '23:00', closed: false },
    { day: 'Sexta-feira', open: '18:00', close: '00:00', closed: false },
    { day: 'Sábado', open: '18:00', close: '00:00', closed: false },
  ])

  const [neighborhoods, setNeighborhoods] = useState<{ name: string; fee: number; estimatedTime: number; active: boolean }[]>([
    { name: 'Centro', fee: 5.00, estimatedTime: 25, active: true },
  ])
  const [newNb, setNewNb] = useState({ name: '', fee: '', time: '' })
  const [editingNb, setEditingNb] = useState<number | null>(null)
  const [editNb, setEditNb] = useState({ name: '', fee: '', time: '', active: true })
  const [nbCepLoading, setNbCepLoading] = useState(false)
  const [nbZipForLookup, setNbZipForLookup] = useState('')
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixQrCode, setPixQrCode] = useState('')
  const [acceptCard, setAcceptCard] = useState(true)
  const [acceptCash, setAcceptCash] = useState(true)
  const [banners, setBanners] = useState<NonNullable<BusinessSettings['banners']>>({
    items: [
      { title: 'A melhor opção da cidade', subtitle: 'Ingredientes selecionados e muito amor.', align: 'left', textColor: '#ffffff', opacity: 20 },
    ],
    active: true,
    scrollStyle: 'dots',
  })
  const [products, setProducts] = useState<Product[]>([])
  const [editingBanner, setEditingBanner] = useState<number | null>(null)
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(true)
  const [crustOptions, setCrustOptions] = useState<{ name: string; price: number }[]>([])
  const [newCrust, setNewCrust] = useState({ name: '', price: '' })
  const [themeLogo, setThemeLogo] = useState('')
  const [themeColorPrimary, setThemeColorPrimary] = useState('#dc2626')
  const [themeColorSecondary, setThemeColorSecondary] = useState('#16a34a')
  const [themeButtonColor, setThemeButtonColor] = useState('#dc2626')

  useEffect(() => {
    settingsService.get().then((data) => {
      if (data) {
        if (data.neighborhoods?.length) setNeighborhoods(data.neighborhoods)
        if (data.businessHours?.length) {
          const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
          setHours(data.businessHours.map((h) => ({
            day: dayNames[h.dayOfWeek] || `Dia ${h.dayOfWeek}`,
            open: h.open,
            close: h.close,
            closed: h.closed,
          })))
        }
        if (data.businessHoursEnabled !== undefined) setBusinessHoursEnabled(data.businessHoursEnabled)
        if (data.paymentMethods) {
          const pm = data.paymentMethods
          if (pm.pix) { setPixKey(pm.pix.key || ''); setPixQrCode(pm.pix.qrCode || '') }
          if (pm.credit) setAcceptCard(pm.credit.enabled)
          if (pm.cash) setAcceptCash(pm.cash.enabled)
        }
        if (data.banners) {
          setBanners(data.banners)
        }
        if (data.whatsapp) setWhatsapp(data.whatsapp)
        if (data.instagram) setInstagram(data.instagram)
        if (data.phone) setPhone(data.phone)
        if (data.address) setAddress(data.address)
        if (data.crustOptions?.length) setCrustOptions(data.crustOptions)
        if (data.defaultDeliveryFee !== undefined) setDefaultDeliveryFee(String(data.defaultDeliveryFee))
        if (data.theme) {
          if (data.theme.logo) setThemeLogo(data.theme.logo)
          if (data.theme.colorPrimary) setThemeColorPrimary(data.theme.colorPrimary)
          if (data.theme.colorSecondary) setThemeColorSecondary(data.theme.colorSecondary)
          if (data.theme.buttonColor) setThemeButtonColor(data.theme.buttonColor)
        }
      }
    }).catch(() => {})
    productsService.getActiveProducts().then(setProducts).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: BusinessSettings = {
        businessHours: hours.map((h, i) => ({
          dayOfWeek: i,
          open: h.open,
          close: h.close,
          closed: h.closed,
        })),
        businessHoursEnabled,
        neighborhoods,
        defaultDeliveryFee: defaultDeliveryFee !== '' ? Number(defaultDeliveryFee) : undefined,
        paymentMethods: {
          pix: { enabled: true, key: pixKey, qrCode: pixQrCode },
          credit: { enabled: acceptCard },
          cash: { enabled: acceptCash },
        },
        banners,
        crustOptions,
        whatsapp,
        instagram,
        phone,
        address,
        theme: {
          logo: themeLogo || undefined,
          colorPrimary: themeColorPrimary,
          colorSecondary: themeColorSecondary,
          buttonColor: themeButtonColor,
        },
      }
      await settingsService.save(JSON.parse(JSON.stringify(data)))
    } catch (err) {
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
    setSaving(false)
  }

  const toggleDay = (index: number) => {
    setHours((prev) => prev.map((d, i) => i === index ? { ...d, closed: !d.closed } : d))
  }

  const addNeighborhood = () => {
    if (!newNb.name.trim() || !newNb.fee || !newNb.time) return
    setNeighborhoods((prev) => [...prev, { name: newNb.name, fee: Number(newNb.fee), estimatedTime: Number(newNb.time), active: true }])
    setNewNb({ name: '', fee: '', time: '' })
    setNbZipForLookup('')
  }

  const startEditNb = (index: number) => {
    const n = neighborhoods[index]
    setEditNb({ name: n.name, fee: String(n.fee), time: String(n.estimatedTime), active: n.active })
    setEditingNb(index)
  }

  const saveEditNb = () => {
    if (editingNb === null) return
    setNeighborhoods((prev) => prev.map((n, i) => i === editingNb ? { ...n, name: editNb.name, fee: Number(editNb.fee), estimatedTime: Number(editNb.time), active: editNb.active } : n))
    setEditingNb(null)
  }

  const handleNbCepLookup = async (cep: string) => {
    const clean = cep.replace(/\D/g, '')
    setNbZipForLookup(cep)
    if (clean.length !== 8) return
    setNbCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro && data.bairro) {
        setNewNb((prev) => ({ ...prev, name: data.bairro }))
      }
    } catch { /* silent */ } finally {
      setNbCepLoading(false)
    }
  }

  const removeNeighborhood = (index: number) => {
    setNeighborhoods((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-muted">Gerencie as configurações do estabelecimento</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Image size={18} className="text-accent" />
            Banner Principal
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors" style={{ backgroundColor: banners.active ? '#22c55e' : '#374151' }}>
                  <input type="checkbox" checked={banners.active} onChange={(e) => setBanners((prev) => ({ ...prev, active: e.target.checked }))} className="sr-only" />
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${banners.active ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                </label>
                <span className="text-sm text-white">{banners.active ? 'Banners ativos' : 'Banners inativos'}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted mr-1">Estilo:</label>
                {(['dots', 'arrows', 'none'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setBanners((prev) => ({ ...prev, scrollStyle: style }))}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      banners.scrollStyle === style ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-hover text-muted hover:text-white'
                    }`}
                  >
                    {style === 'dots' ? 'Pontos' : style === 'arrows' ? 'Setas' : 'Nenhum'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {banners.items.map((item, idx) => {
                const isOpen = editingBanner === idx
                return (
                  <div key={idx} className="rounded-xl border border-border bg-surface-hover overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface transition-colors"
                      onClick={() => setEditingBanner(isOpen ? null : idx)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical size={16} className="text-muted shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.title || 'Sem título'}</p>
                          <p className="text-[11px] text-muted truncate">{item.subtitle || 'Sem subtítulo'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.image && <img src={resolveImageUrl(item.image)} alt="" className="h-8 w-12 rounded object-cover" />}
                        {item.linkProductId && (
                          <span className="text-[10px] text-accent font-medium">Vinculado</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBanners((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
                            if (editingBanner === idx) setEditingBanner(null)
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-border px-4 py-4 space-y-4">
                        <div className="relative overflow-hidden rounded-xl bg-surface min-h-[160px] flex">
                          {item.image && (
                            <>
                              <img
                                src={resolveImageUrl(item.image)}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                              <div className="absolute inset-0 bg-black/70" />
                              <div className="absolute inset-0 w-1/2 left-1/2 z-10">
                                <img
                                  src={resolveImageUrl(item.image)}
                                  alt=""
                                  className="h-full w-full object-cover object-right"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              </div>
                            </>
                          )}
                          {!item.image && (
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-surface to-surface" />
                          )}
                          <div className="relative z-20 flex w-full items-center justify-center px-4 py-6" style={{ textAlign: item.align || 'left' }}>
                            <div className={item.align === 'center' ? 'mx-auto' : 'w-full'}>
                              <p className="text-lg md:text-xl font-extrabold leading-tight drop-shadow-lg" style={{ color: item.textColor || '#ffffff' }}>
                                {item.title || 'Título do banner'}
                              </p>
                              <p className="mt-1 text-xs md:text-sm leading-relaxed max-w-md" style={{ color: item.textColor || '#ffffff', opacity: 0.85 }}>
                                {item.subtitle || 'Subtítulo do banner'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input label="Título" value={item.title} onChange={(e) => {
                            const updated = [...banners.items]
                            updated[idx] = { ...updated[idx], title: e.target.value }
                            setBanners((prev) => ({ ...prev, items: updated }))
                          }} placeholder="Ex: A melhor pizza da cidade" />
                          <Input label="Subtítulo" value={item.subtitle} onChange={(e) => {
                            const updated = [...banners.items]
                            updated[idx] = { ...updated[idx], subtitle: e.target.value }
                            setBanners((prev) => ({ ...prev, items: updated }))
                          }} placeholder="Ex: Massa artesanal, ingredientes frescos" />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <ImageUpload value={item.image || ''} onChange={(val) => {
                            const updated = [...banners.items]
                            updated[idx] = { ...updated[idx], image: val }
                            setBanners((prev) => ({ ...prev, items: updated }))
                          }} label="Imagem de fundo" />
                          <Input label="Ou cole uma URL" placeholder="https://..." value={item.image?.startsWith('data:') ? '' : (item.image || '')} onChange={(e) => {
                            const updated = [...banners.items]
                            updated[idx] = { ...updated[idx], image: e.target.value }
                            setBanners((prev) => ({ ...prev, items: updated }))
                          }} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-white">Vincular a um produto</label>
                            <select
                              value={item.linkProductId || ''}
                              onChange={(e) => {
                                const updated = [...banners.items]
                                updated[idx] = { ...updated[idx], linkProductId: e.target.value || undefined }
                                setBanners((prev) => ({ ...prev, items: updated }))
                              }}
                              className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-white transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                              <option value="">Nenhum</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-white">Alinhamento do texto</label>
                            <div className="flex gap-1.5">
                              {(['left', 'center', 'right'] as const).map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...banners.items]
                                    updated[idx] = { ...updated[idx], align }
                                    setBanners((prev) => ({ ...prev, items: updated }))
                                  }}
                                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                    (item.align || 'left') === align ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-hover text-muted hover:text-white'
                                  }`}
                                >
                                  {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-white">Cor do texto</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={item.textColor || '#ffffff'} onChange={(e) => {
                                const updated = [...banners.items]
                                updated[idx] = { ...updated[idx], textColor: e.target.value }
                                setBanners((prev) => ({ ...prev, items: updated }))
                              }} className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent" />
                              <span className="text-xs text-muted">{item.textColor || '#ffffff'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <Button variant="ghost" size="sm" onClick={() => {
              setBanners((prev) => ({
                ...prev,
                items: [...prev.items, { title: '', subtitle: '', align: 'left', textColor: '#ffffff', opacity: 20 }],
              }))
              setEditingBanner(banners.items.length)
            }}>
              <Plus size={14} />
              Adicionar banner
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <CreditCard size={18} className="text-accent" />
            Métodos de Pagamento
          </h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <Input label="Chave PIX" placeholder="CNPJ, CPF, email ou telefone" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
              <ImageUpload value={pixQrCode} onChange={setPixQrCode} label="QR Code PIX (opcional)" />
              <Input label="Ou cole uma URL" placeholder="Google Drive ou outro link" value={pixQrCode.startsWith('data:') ? '' : pixQrCode} onChange={(e) => setPixQrCode(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptCard} onChange={(e) => setAcceptCard(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Cartão crédito/débito na entrega/retirada</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface-hover p-3">
                <input type="checkbox" checked={acceptCash} onChange={(e) => setAcceptCash(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
                <span className="text-sm text-white">Dinheiro</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Clock size={18} className="text-accent" />
            Horários de Funcionamento
          </h2>
          <div className="flex items-center justify-between rounded-lg bg-surface-hover px-4 py-3 mb-4">
            <div>
              <p className="text-sm font-medium text-white">Restrição de horário</p>
              <p className="text-xs text-muted mt-0.5">{businessHoursEnabled ? 'Pedidos bloqueados fora do horário' : 'Pedidos aceitos em qualquer horário'}</p>
            </div>
            <button
              onClick={() => setBusinessHoursEnabled(!businessHoursEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${businessHoursEnabled ? 'bg-accent' : 'bg-surface-hover border border-border'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${businessHoursEnabled ? 'translate-x-5.5 mt-0.5 ml-0.5' : 'translate-x-0.5 mt-0.5 ml-0.5'}`} />
            </button>
          </div>
          <div className="space-y-2">
            {hours.map((day, index) => (
              <div key={day.day} className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="w-20 md:w-28 text-xs md:text-sm text-white shrink-0">{day.day}</span>
                {day.closed ? (
                  <span className="text-xs md:text-sm text-red-400 font-medium">Fechado</span>
                ) : (
                  <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                    <input type="time" value={day.open} onChange={(e) => setHours((prev) => prev.map((d, i) => i === index ? { ...d, open: e.target.value } : d))} className="w-24 md:w-auto rounded-lg border border-border bg-surface-hover px-2 md:px-3 py-1.5 text-xs md:text-sm text-white" />
                    <span className="text-muted text-xs md:text-sm">às</span>
                    <input type="time" value={day.close} onChange={(e) => setHours((prev) => prev.map((d, i) => i === index ? { ...d, close: e.target.value } : d))} className="w-24 md:w-auto rounded-lg border border-border bg-surface-hover px-2 md:px-3 py-1.5 text-xs md:text-sm text-white" />
                  </div>
                )}
                <button onClick={() => toggleDay(index)} className={`ml-auto shrink-0 rounded-full px-2.5 md:px-3 py-1 text-[10px] md:text-xs font-medium transition-colors ${day.closed ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                  {day.closed ? 'Abrir' : 'Fechar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Phone size={18} className="text-accent" />
            Contato do Estabelecimento
          </h2>
          <div className="space-y-4">
            <Input label="WhatsApp" placeholder="5511999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))} />
            <Input label="Telefone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Instagram" placeholder="@seuestabelecimento" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <p className="text-xs text-muted">URL ou @ do Instagram que aparece no rodapé do site</p>
            <Input label="Endereço" placeholder="Rua, número - Bairro, Cidade" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <MapPin size={18} className="text-accent" />
            Bairros Atendidos
          </h2>
          <div className="mb-4 rounded-lg bg-surface-hover p-3">
            <Input label="Taxa padrão (bairros não cadastrados)" placeholder="R$ 0,00" type="number" step="0.50" value={defaultDeliveryFee} onChange={(e) => setDefaultDeliveryFee(e.target.value)} />
            <p className="mt-1 text-[11px] text-muted">Valor cobrado quando o bairro do cliente não está na lista acima</p>
          </div>
          <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Input placeholder="Bairro" value={newNb.name} onChange={(e) => setNewNb({ ...newNb, name: e.target.value })} className="col-span-2 sm:col-span-1" />
            <div className="relative">
              <Input placeholder="CEP (auto-preenche bairro)" value={nbZipForLookup} onChange={(e) => handleNbCepLookup(e.target.value)} />
              {nbCepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 animate-pulse">...</span>}
            </div>
            <Input placeholder="Taxa R$" type="number" value={newNb.fee} onChange={(e) => setNewNb({ ...newNb, fee: e.target.value })} />
            <Input placeholder="Tempo (min)" type="number" value={newNb.time} onChange={(e) => setNewNb({ ...newNb, time: e.target.value })} />
            <Button onClick={addNeighborhood} className="col-span-2 sm:col-span-1"><Plus size={16} />Adicionar</Button>
          </div>
          <div className="space-y-2">
            {neighborhoods.map((n, index) => (
              editingNb === index ? (
                <div key={index} className="rounded-lg bg-surface-hover border border-accent/30 p-3 space-y-2">
                  <input type="text" value={editNb.name} onChange={(e) => setEditNb({ ...editNb, name: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white" placeholder="Bairro" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={editNb.fee} onChange={(e) => setEditNb({ ...editNb, fee: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white" placeholder="Taxa R$" step="0.50" />
                    <input type="number" value={editNb.time} onChange={(e) => setEditNb({ ...editNb, time: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white" placeholder="Tempo min" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditNb({ ...editNb, active: !editNb.active })} className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${editNb.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {editNb.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => setEditingNb(null)} className="text-xs text-muted hover:text-white transition-colors px-2 py-1">Cancelar</button>
                      <button onClick={saveEditNb} className="text-xs text-accent hover:text-accent/80 font-medium transition-colors px-2 py-1">Salvar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={index} className="flex items-center justify-between gap-2 rounded-lg bg-surface-hover px-3 md:px-4 py-2.5">
                  <div className="min-w-0">
                    <span className={`text-sm font-medium truncate block ${n.active ? 'text-white' : 'text-muted line-through'}`}>{n.name}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted shrink-0">
                    <span>R$ {n.fee.toFixed(2)}</span>
                    <span>~{n.estimatedTime}min</span>
                    <button onClick={() => startEditNb(index)} className="text-accent hover:text-accent/80 transition-colors text-xs">Editar</button>
                    <button onClick={() => removeNeighborhood(index)} className="text-red-400 hover:text-red-300 transition-colors text-xs">Remover</button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Palette size={18} className="text-accent" />
            Aparência
          </h2>
          <p className="mb-4 text-xs text-muted">Personalize as cores e o logo que aparecem no site do seu estabelecimento.</p>
          <div className="space-y-4">
            <ImageUpload value={themeLogo} onChange={setThemeLogo} label="Logo do estabelecimento" />
            <Input label="Ou cole a URL do logo" placeholder="https://..." value={themeLogo.startsWith('data:') ? '' : themeLogo} onChange={(e) => setThemeLogo(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">Cor principal</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={themeColorPrimary} onChange={(e) => setThemeColorPrimary(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent" />
                  <span className="text-xs text-muted">{themeColorPrimary}</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">Cor secundária</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={themeColorSecondary} onChange={(e) => setThemeColorSecondary(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent" />
                  <span className="text-xs text-muted">{themeColorSecondary}</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">Cor dos botões</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={themeButtonColor} onChange={(e) => setThemeButtonColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent" />
                  <span className="text-xs text-muted">{themeButtonColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <CircleDot size={18} className="text-accent" />
            Bordas da Pizza
          </h2>
          <p className="mb-3 text-xs text-muted">Opções de borda recheada que o cliente pode escolher ao pedir</p>
          <div className="space-y-3">
            {crustOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-2.5">
                <span className="flex-1 text-sm text-white font-medium">{opt.name}</span>
                <span className="text-sm text-accent font-semibold">{formatCurrency(opt.price)}</span>
                <button onClick={() => setCrustOptions(crustOptions.filter((_, idx) => idx !== i))} className="ml-2 text-muted hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Nome da borda" value={newCrust.name} onChange={(e) => setNewCrust({ ...newCrust, name: e.target.value })} />
              <Input placeholder="Preço R$" type="number" step="0.01" value={newCrust.price} onChange={(e) => setNewCrust({ ...newCrust, price: e.target.value })} />
              <Button onClick={() => {
                if (!newCrust.name.trim() || !newCrust.price) return
                setCrustOptions([...crustOptions, { name: newCrust.name.trim(), price: Number(newCrust.price) }])
                setNewCrust({ name: '', price: '' })
              }}><Plus size={16} /></Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  )
}
