import { useMemo, useState } from 'react'
import { fmtPct } from '../lib/format'
import { SECTORS, SECTOR_COLORS } from '../lib/indicators'
import { sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'
import { Segmented } from './Concentration'

type SectorKey = (typeof SECTORS)[number]['key']
type Shares = Record<SectorKey, number>

interface Props {
  municipios: Municipio[]
  periods: Periods
  selectedId: string
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const FIRST = 15

/** Rótulo + 4 colunas de setor; no celular só a coluna do setor escolhido. */
const GRID = 'grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-x-3 sm:grid-cols-[2rem_minmax(9rem,13rem)_repeat(4,minmax(0,1fr))] sm:gap-x-5'

/**
 * Um setor por coluna, todas na mesma escala (0–100%): cada barra parte do zero, então dá para
 * comparar qualquer setor entre municípios. O traço vertical marca a média do estado.
 */
export function SectorProfile({ municipios, periods, selectedId, hoveredId, onSelect, onHover }: Props) {
  const [sortBy, setSortBy] = useState<SectorKey>('shareAdm')
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(
    () => municipios.filter((m) => m[sortBy] != null).sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0)),
    [municipios, sortBy],
  )
  const state = useMemo(() => {
    const v = { shareAgro: sum(municipios.map((m) => m.vaAgro)), shareInd: sum(municipios.map((m) => m.vaInd)), shareServ: sum(municipios.map((m) => m.vaServ)), shareAdm: sum(municipios.map((m) => m.vaAdm)) }
    const t = v.shareAgro + v.shareInd + v.shareServ + v.shareAdm || 1
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, (x / t) * 100])) as Shares
  }, [municipios])

  const visible = showAll ? rows : rows.slice(0, FIRST)
  const sortLabel = SECTORS.find((s) => s.key === sortBy)!.label.toLowerCase()
  const shares = (m: Municipio): Shares => ({ shareAgro: m.shareAgro ?? 0, shareInd: m.shareInd ?? 0, shareServ: m.shareServ ?? 0, shareAdm: m.shareAdm ?? 0 })

  return (
    <div className="card reveal p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">De onde vem a riqueza de cada município</h3>
          <p className="max-w-2xl text-sm muted">
            Quanto cada setor pesa no valor adicionado do município ({periods.va}). Clique num setor para ordenar: no topo, quem mais
            depende dele.
          </p>
        </div>
        <div className="sm:hidden">
          <Segmented
            label="Ordenar por setor"
            value={sortBy}
            onChange={setSortBy}
            options={SECTORS.map((s) => ({ value: s.key, label: s.label, swatch: SECTOR_COLORS[s.id] }))}
          />
        </div>
      </div>

      <div className="mt-5" onMouseLeave={() => onHover(null)}>
        <div className={`${GRID} border-b border-night-900/[0.08] pb-2 dark:border-white/[0.08]`}>
          <span />
          <span className="text-[11px] font-semibold uppercase tracking-wider muted">Município</span>
          {SECTORS.map((s) => {
            const active = s.key === sortBy
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSortBy(s.key)}
                aria-pressed={active}
                className={`${active ? 'flex' : 'hidden sm:flex'} items-center gap-1.5 rounded-md py-1 text-left text-xs font-semibold transition-colors ${
                  active ? '' : 'text-night-900/55 hover:text-night-900 dark:text-sand-100/55 dark:hover:text-white'
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: SECTOR_COLORS[s.id] }} />
                <span className="truncate">{s.label}</span>
                <span aria-hidden className={active ? '' : 'opacity-0'}>
                  ↓
                </span>
              </button>
            )
          })}
        </div>

        <Row label="Estado inteiro" shares={state} sortBy={sortBy} emphasis />

        <ol className="divide-y divide-night-900/[0.05] dark:divide-white/[0.05]">
          {visible.map((m, i) => (
            <li key={m.id}>
              <Row
                rank={i + 1}
                label={m.nome}
                shares={shares(m)}
                state={state}
                sortBy={sortBy}
                selected={m.id === selectedId}
                hovered={m.id === hoveredId}
                onEnter={() => onHover(m.id)}
                onClick={() => onSelect(m.id)}
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs muted">
          <span className="inline-block h-3.5 w-0.5 rounded-full bg-night-900/60 dark:bg-white/60" aria-hidden />
          média do estado inteiro
        </p>
        <button type="button" onClick={() => setShowAll((v) => !v)} className="btn-soft px-3 py-1.5 text-xs">
          {showAll ? `Mostrar só os ${FIRST} primeiros` : `Mostrar os ${rows.length} municípios`}
        </button>
      </div>
      <p className="sr-only">Ordenado por peso de {sortLabel}.</p>
    </div>
  )
}

function Row({
  rank,
  label,
  shares,
  state,
  sortBy,
  selected,
  hovered,
  emphasis,
  onEnter,
  onClick,
}: {
  rank?: number
  label: string
  shares: Shares
  state?: Shares
  sortBy: SectorKey
  selected?: boolean
  hovered?: boolean
  emphasis?: boolean
  onEnter?: () => void
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      aria-label={`${label}: ${SECTORS.map((s) => `${s.label} ${fmtPct(shares[s.key])}`).join(', ')}`}
      className={`${GRID} w-full rounded-lg px-1 text-left text-sm transition-colors ${emphasis ? 'my-1 bg-night-900/[0.035] py-2.5 dark:bg-white/[0.04]' : 'py-2'} ${
        selected ? 'bg-rose-500/[0.08] ring-1 ring-rose-400/70' : hovered ? 'bg-night-900/[0.04] dark:bg-white/[0.05]' : ''
      }`}
    >
      <span className="text-right text-xs tabular-nums muted">{rank ?? ''}</span>
      <span className={`truncate ${emphasis ? 'font-semibold' : 'font-medium'} ${selected ? 'text-rose-700 dark:text-rose-300' : ''}`}>{label}</span>
      {SECTORS.map((s) => (
        <Bar key={s.key} value={shares[s.key]} mark={state?.[s.key]} color={SECTOR_COLORS[s.id]} active={s.key === sortBy} strong={emphasis} />
      ))}
    </Tag>
  )
}

function Bar({ value, mark, color, active, strong }: { value: number; mark?: number; color: string; active: boolean; strong?: boolean }) {
  return (
    <span className={`${active ? 'flex' : 'hidden sm:flex'} min-w-0 items-center gap-2`} aria-hidden>
      <span className="relative h-2.5 flex-1 rounded-full bg-night-900/[0.06] dark:bg-white/[0.07]">
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width,opacity] duration-700 ease-out"
          style={{ width: `${Math.max(value, 0)}%`, background: color, opacity: active || strong ? 1 : 0.5 }}
        />
        {mark != null && <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-night-900/60 dark:bg-white/60" style={{ left: `${mark}%` }} />}
      </span>
      <span className={`w-12 shrink-0 text-right tabular-nums ${active || strong ? 'font-semibold' : 'muted'}`}>{fmtPct(value)}</span>
    </span>
  )
}
