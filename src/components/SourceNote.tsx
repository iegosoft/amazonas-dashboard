import type { Indicator } from '../lib/indicators'
import type { Periods } from '../lib/types'
import { AlertIcon, CalendarIcon, InfoIcon } from './Icons'

/** "Referência: 2023 · Fonte: IBGE, PIB dos Municípios (tabela 5938)" e, se houver, o aviso de anos misturados. */
export function SourceNote({ indicator, periods }: { indicator: Indicator; periods: Periods }) {
  const note = indicator.note?.(periods)
  return (
    <div className="space-y-2 text-xs muted">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-forest-500/10 px-2 py-0.5 font-medium text-forest-800 dark:text-forest-200">
          <CalendarIcon className="h-3 w-3" />
          Referência: <strong className="font-semibold">{indicator.period(periods)}</strong>
        </span>
        <span>
          Fonte: IBGE,{' '}
          {indicator.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' e '}
              <a href={s.url} target="_blank" rel="noreferrer" className="link hover:text-night-900 dark:hover:text-white">
                {s.label}
              </a>
            </span>
          ))}
        </span>
        <a
          href={`#sobre-${indicator.key}`}
          className="inline-flex items-center gap-1 font-medium text-forest-700 hover:text-forest-900 dark:text-forest-300 dark:hover:text-forest-200"
        >
          <InfoIcon className="h-3.5 w-3.5" />
          Como é calculado
        </a>
      </p>
      {note && (
        <p className="flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-amber-800 dark:text-amber-300">
          <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-semibold">Atenção:</strong> {note}
          </span>
        </p>
      )}
    </div>
  )
}
