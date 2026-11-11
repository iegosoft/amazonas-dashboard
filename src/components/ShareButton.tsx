import { useEffect, useState } from 'react'
import { shareLink, type ShareResult } from '../lib/share'
import { CheckIcon, ShareIcon } from './Icons'

const LABEL: Record<ShareResult | 'idle', string> = {
  idle: 'Compartilhar',
  shared: 'Compartilhado',
  copied: 'Link copiado!',
  cancelled: 'Compartilhar',
  failed: 'Não foi possível copiar',
}

/** Compartilha a tela atual: o link já inclui indicador, município e comparação. */
export function ShareButton({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<ShareResult | 'idle'>('idle')

  useEffect(() => {
    if (status === 'idle' || status === 'cancelled') return
    const t = setTimeout(() => setStatus('idle'), 2500)
    return () => clearTimeout(t)
  }, [status])

  const ok = status === 'copied' || status === 'shared'

  return (
    <button
      type="button"
      onClick={async () => {
        const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
        setStatus(await shareLink(window.location.href, document.title, coarse))
      }}
      className={className}
    >
      {ok ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
      <span aria-live="polite" className="max-sm:sr-only">
        {LABEL[status]}
      </span>
    </button>
  )
}
