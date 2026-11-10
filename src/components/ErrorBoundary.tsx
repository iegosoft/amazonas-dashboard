import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  /** Nome do bloco, usado na mensagem: "Não foi possível exibir o mapa." */
  label: string
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Isola falhas de renderização: se um bloco quebrar, só ele mostra o aviso e o resto
 * do painel continua funcionando (sem tela branca).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[painel] Falha ao exibir ${this.props.label}:`, error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
        <h2 className="font-semibold text-amber-900 dark:text-amber-200">Não foi possível exibir {this.props.label}.</h2>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">O restante do painel continua funcionando.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Tentar de novo
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-amber-400 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            Recarregar a página
          </button>
        </div>
      </div>
    )
  }
}
