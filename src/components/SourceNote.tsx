import type { Indicator } from '../lib/indicators'
import type { Periods } from '../lib/types'

/** "Referência: 2023 · Fonte: IBGE, PIB dos Municípios (tabela 5938)" e, se houver, o aviso de anos misturados. */
export function SourceNote({ indicator, periods }: { indicator: Indicator; periods: Periods }) {
  const note = indicator.note?.(periods)
  return (
    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
      <p>
        Referência: <strong className="font-semibold text-slate-700 dark:text-slate-200">{indicator.period(periods)}</strong>
        {' · '}Fonte: IBGE,{' '}
        {indicator.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ' e '}
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-slate-800 dark:hover:text-slate-100"
            >
              {s.label}
            </a>
          </span>
        ))}
        {' · '}
        <a href={`#sobre-${indicator.key}`} className="underline decoration-dotted underline-offset-2 hover:text-slate-800 dark:hover:text-slate-100">
          Como é calculado
        </a>
      </p>
      {note && (
        <p className="text-amber-700 dark:text-amber-400">
          <strong className="font-semibold">Atenção:</strong> {note}
        </p>
      )}
    </div>
  )
}
