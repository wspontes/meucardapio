import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e _'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido').optional(),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

export const addressSchema = z.object({
  label: z.string().min(1, 'Identificação é obrigatória'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP inválido'),
  reference: z.string().optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  discountPrice: z.number().positive().optional(),
  active: z.boolean(),
  featured: z.boolean(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type AddressFormData = z.infer<typeof addressSchema>
export type ProductFormData = z.infer<typeof productSchema>
