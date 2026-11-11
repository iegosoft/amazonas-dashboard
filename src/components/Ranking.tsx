import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { Indicator } from '../lib/indicators'
import type { Ranked } from '../lib/stats'
import { DownloadIcon, SearchIcon, SortIcon } from './Icons'

interface Props {
  indicator: Indicator
  /** Ano de referência do indicador */
  period: string
  ranking: Ranked[]
  selectedId: string
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onDownload: () => void
  /** Cor de cada valor no mapa, para a barra combinar com a legenda */
  colorOf?: (v: number | null) => string
  className?: string
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const MEDAL = ['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-800', 'bg-orange-300 text-orange-950']

export function Ranking({
  indicator,
  period,
  ranking,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onDownload,
  colorOf,
  className = '',
}: Props) {
  const [query, setQuery] = useState('')
  const [asc, setAsc] = useState(false)
  const deferred = useDeferredValue(query)
  const listRef = useRef<HTMLOListElement>(null)

  const rows = useMemo(() => {
    const q = norm(deferred.trim())
    const base = q ? ranking.filter((r) => norm(r.m.nome).includes(q)) : ranking
    return asc ? [...base].reverse() : base
  }, [ranking, deferred, asc])

  const max = ranking[0]?.value ?? 1
  const min = Math.min(0, ranking[ranking.length - 1]?.value ?? 0)
  const span = max - min || 1

  // Quando o município muda (pelo mapa, por exemplo), traz a linha dele para dentro da lista.
  // Rola só a lista, nunca a página.
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!list || !row) return
    const top = row.offsetTop // a lista é `relative`, então offsetTop já é relativo a ela
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTo?.({ top: Math.max(0, top - list.clientHeight / 2 + row.offsetHeight / 2), behavior: 'smooth' })
  }, [selectedId, indicator.key, asc])

  return (
    <section id="ranking-lista" aria-labelledby="ranking-titulo" className={`card reveal flex flex-col p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Ranking</p>
          <h2 id="ranking-titulo" className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {indicator.label} <span className="font-sans text-sm font-normal muted">({period})</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAsc((a) => !a)}
            className="btn-soft px-3 py-1.5 text-xs"
            aria-label={asc ? 'Ordenar do maior para o menor' : 'Ordenar do menor para o maior'}
          >
            <SortIcon className="h-3.5 w-3.5" />
            {asc ? 'Menor primeiro' : 'Maior primeiro'}
          </button>
          <button type="button" onClick={onDownload} className="btn-soft px-3 py-1.5 text-xs">
            <DownloadIcon className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      <label className="relative mt-4 block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar município…"
          aria-label="Buscar município"
          className="field py-2.5 pl-9 pr-3"
        />
      </label>

      <ol ref={listRef} className="scroll-thin relative -mx-2 mt-3 max-h-[26rem] flex-1 space-y-0.5 overflow-y-auto px-2 lg:max-h-[30rem]">
        {rows.map(({ m, value, rank }) => {
          const active = m.id === selectedId
          const hot = m.id === hoveredId
          const pct = Math.max(1.5, ((value - min) / span) * 100)
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
                className={`group grid w-full grid-cols-[1.9rem_1fr_auto] items-center gap-x-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'bg-rose-500/[0.08] ring-1 ring-rose-400/70 dark:bg-rose-500/10'
                    : hot
                      ? 'bg-night-900/[0.04] dark:bg-white/[0.05]'
                      : 'hover:bg-night-900/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold tabular-nums ${
                    rank <= 3 ? MEDAL[rank - 1] : 'bg-night-900/[0.05] text-night-900/60 dark:bg-white/[0.06] dark:text-sand-100/60'
                  }`}
                >
                  {rank}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate font-medium ${active ? 'text-rose-700 dark:text-rose-300' : ''}`}>{m.nome}</span>
                  <span aria-hidden className="mt-1 block h-1 overflow-hidden rounded-full bg-night-900/[0.05] dark:bg-white/[0.06]">
                    <span
                      className="block h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: colorOf ? colorOf(value) : 'currentColor' }}
                    />
                  </span>
                </span>
                <span className="text-xs font-medium tabular-nums text-night-900/75 dark:text-sand-100/75">
                  {indicator.format(value)}
                </span>
              </button>
            </li>
          )
        })}
        {rows.length === 0 && <li className="px-2 py-8 text-center text-sm muted">Nenhum município encontrado.</li>}
      </ol>
    </section>
  )
}
