import { Navigate, useParams } from 'react-router-dom'

/**
 * A Home antiga foi incorporada ao cardápio (Menu).
 * Este componente mantém a rota compatível redirecionando para o cardápio.
 */
export default function Home() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={slug ? `/${slug}` : '/'} replace />
}
