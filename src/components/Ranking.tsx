import { useDeferredValue, useMemo, useState } from 'react'
import type { Indicator } from '../lib/indicators'
import type { Ranked } from '../lib/stats'

interface Props {
  indicator: Indicator
  ranking: Ranked[]
  selectedId: string
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Ranking({ indicator, ranking, selectedId, hoveredId, onSelect, onHover }: Props) {
  const [query, setQuery] = useState('')
  const [asc, setAsc] = useState(false)
  const deferred = useDeferredValue(query)

  const rows = useMemo(() => {
    const q = norm(deferred.trim())
    const base = q ? ranking.filter((r) => norm(r.m.nome).includes(q)) : ranking
    return asc ? [...base].reverse() : base
  }, [ranking, deferred, asc])

  const max = ranking[0]?.value ?? 1
  const min = Math.min(0, ranking[ranking.length - 1]?.value ?? 0)
  const span = max - min || 1

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Ranking · {indicator.label}</h2>
        <button
          type="button"
          onClick={() => setAsc((a) => !a)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={asc ? 'Ordenar do maior para o menor' : 'Ordenar do menor para o maior'}
        >
          {asc ? '↑ menor primeiro' : '↓ maior primeiro'}
        </button>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar município…"
        aria-label="Buscar município"
        className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-800"
      />
      <ol className="max-h-80 space-y-0.5 overflow-y-auto pr-1">
        {rows.map(({ m, value, rank }) => {
          const active = m.id === selectedId
          const hot = m.id === hoveredId
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                onMouseEnter={() => onHover(m.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(m.id)}
                onBlur={() => onHover(null)}
                aria-current={active ? 'true' : undefined}
                className={`relative grid w-full grid-cols-[1.75rem_1fr_auto] items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm ${
                  active
                    ? 'bg-rose-50 ring-1 ring-rose-400 dark:bg-rose-950/40'
                    : hot
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-sky-500/15"
                  style={{ width: `${Math.max(2, ((value - min) / span) * 100)}%` }}
                />
                <span className="relative text-xs tabular-nums text-slate-400">{rank}</span>
                <span className="relative truncate font-medium">{m.nome}</span>
                <span className="relative text-xs tabular-nums text-slate-600 dark:text-slate-300">
                  {indicator.format(value)}
                </span>
              </button>
            </li>
          )
        })}
        {rows.length === 0 && <li className="px-2 py-4 text-center text-sm text-slate-500">Nenhum município encontrado.</li>}
      </ol>
    </section>
  )
}
