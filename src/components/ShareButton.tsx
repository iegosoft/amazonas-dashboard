import { useEffect, useState } from 'react'
import { shareLink, type ShareResult } from '../lib/share'

const LABEL: Record<ShareResult | 'idle', string> = {
  idle: 'Compartilhar',
  shared: 'Compartilhado',
  copied: 'Link copiado!',
  cancelled: 'Compartilhar',
  failed: 'Não foi possível copiar',
}

/** Compartilha a tela atual: o link já inclui indicador, município e comparação. */
export function ShareButton() {
  const [status, setStatus] = useState<ShareResult | 'idle'>('idle')

  useEffect(() => {
    if (status === 'idle' || status === 'cancelled') return
    const t = setTimeout(() => setStatus('idle'), 2500)
    return () => clearTimeout(t)
  }, [status])

  return (
    <button
      type="button"
      onClick={async () => {
        const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
        setStatus(await shareLink(window.location.href, document.title, coarse))
      }}
      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <span aria-live="polite">{LABEL[status]}</span>
    </button>
  )
}
