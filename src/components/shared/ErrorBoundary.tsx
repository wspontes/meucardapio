import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  isStale: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isStale: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    const isStale = error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      error.message?.includes('Loading chunk')
    this.setState({ isStale })

    if (isStale) {
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <h1 className="text-lg font-bold text-brand-white">
          {this.state.isStale ? 'Atualizando...' : 'Algo deu errado'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {this.state.isStale
            ? 'Uma nova versão foi carregada. Recarregando...'
            : 'Tente recarregar a página.'}
        </p>
        {!this.state.isStale && (
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white">
            Recarregar
          </button>
        )}
      </div>
    )
  }
}
