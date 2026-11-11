import { useMemo, useState } from 'react'
import { fmtPct } from '../lib/format'
import { SECTORS, SECTOR_COLORS } from '../lib/indicators'
import { sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'
import { ChartTooltip, TipRow } from './ChartTooltip'
import { Segmented } from './Concentration'

type SectorKey = (typeof SECTORS)[number]['key']

interface Props {
  municipios: Municipio[]
  periods: Periods
  selectedId: string
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

/** Barras 100% empilhadas: a composição da economia de cada um dos municípios, ordenadas pelo setor escolhido. */
export function SectorProfile({ municipios, periods, selectedId, hoveredId, onSelect, onHover }: Props) {
  const [sortBy, setSortBy] = useState<SectorKey>('shareAdm')
  const [showAll, setShowAll] = useState(false)
  const [tip, setTip] = useState<{ x: number; y: number; w: number } | null>(null)

  const rows = useMemo(
    () => municipios.filter((m) => m[sortBy] != null).sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0)),
    [municipios, sortBy],
  )
  const state = useMemo(() => {
    const v = { shareAgro: sum(municipios.map((m) => m.vaAgro)), shareInd: sum(municipios.map((m) => m.vaInd)), shareServ: sum(municipios.map((m) => m.vaServ)), shareAdm: sum(municipios.map((m) => m.vaAdm)) }
    const t = v.shareAgro + v.shareInd + v.shareServ + v.shareAdm || 1
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, (x / t) * 100])) as Record<SectorKey, number>
  }, [municipios])

  const visible = showAll ? rows : rows.slice(0, 16)
  const half = Math.ceil(visible.length / 2)
  const columns = showAll ? [visible.slice(0, half), visible.slice(half)] : [visible]
  const hovered = municipios.find((m) => m.id === hoveredId)
  const sortLabel = SECTORS.find((s) => s.key === sortBy)!.label.toLowerCase()

  return (
    <div className="card reveal p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">De onde vem a riqueza de cada município</h3>
          <p className="max-w-2xl text-sm muted">
            Divisão do valor adicionado entre os quatro setores ({periods.va}). Escolha um setor para ordenar: no topo, quem mais depende dele.
          </p>
        </div>
        <Segmented
          label="Ordenar por setor"
          value={sortBy}
          onChange={setSortBy}
          options={SECTORS.map((s) => ({ value: s.key, label: s.label, swatch: SECTOR_COLORS[s.id] }))}
        />
      </div>

      <div className="mt-5 rounded-xl bg-night-900/[0.035] py-1.5 dark:bg-white/[0.04]">
        <Row
          label="Estado inteiro"
          shares={state}
          emphasis
          sortBy={sortBy}
          onEnter={() => {}}
        />
      </div>

      <div
        className="relative mt-3"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setTip({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width })
        }}
        onMouseLeave={() => {
          setTip(null)
          onHover(null)
        }}
      >
        <div className={`grid gap-x-8 ${showAll ? 'lg:grid-cols-2' : ''}`}>
          {columns.map((col, ci) => (
            <ol key={ci} className="space-y-0.5" start={ci === 0 ? 1 : half + 1}>
              {col.map((m) => {
                const rank = rows.indexOf(m) + 1
                return (
                  <li key={m.id}>
                    <Row
                      rank={rank}
                      label={m.nome}
                      shares={{ shareAgro: m.shareAgro ?? 0, shareInd: m.shareInd ?? 0, shareServ: m.shareServ ?? 0, shareAdm: m.shareAdm ?? 0 }}
                      sortBy={sortBy}
                      selected={m.id === selectedId}
                      hovered={m.id === hoveredId}
                      onEnter={() => onHover(m.id)}
                      onClick={() => onSelect(m.id)}
                    />
                  </li>
                )
              })}
            </ol>
          ))}
        </div>
        {hovered && tip && hovered.shareAgro != null && (
          <ChartTooltip x={tip.x} y={tip.y} width={tip.w}>
            <p className="mb-1.5 text-sm font-semibold">{hovered.nome}</p>
            {SECTORS.map((s) => (
              <TipRow key={s.key} label={s.label} value={fmtPct(hovered[s.key] ?? 0)} swatch={SECTOR_COLORS[s.id]} />
            ))}
          </ChartTooltip>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs muted" aria-label="Legenda dos setores">
          {SECTORS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SECTOR_COLORS[s.id] }} />
              {s.label}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setShowAll((v) => !v)} className="btn-soft px-3 py-1.5 text-xs">
          {showAll ? 'Mostrar só os 16 primeiros' : `Mostrar os ${rows.length} municípios`}
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
  sortBy,
  selected,
  hovered,
  emphasis,
  onEnter,
  onClick,
}: {
  rank?: number
  label: string
  shares: Record<SectorKey, number>
  sortBy: SectorKey
  selected?: boolean
  hovered?: boolean
  emphasis?: boolean
  onEnter: () => void
  onClick?: () => void
}) {
  // O setor escolhido vai primeiro, encostado no eixo, para a ordenação ficar visível.
  const order = [SECTORS.find((s) => s.key === sortBy)!, ...SECTORS.filter((s) => s.key !== sortBy)]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      aria-label={`${label}: ${order.map((s) => `${s.label} ${fmtPct(shares[s.key])}`).join(', ')}`}
      className={`grid w-full grid-cols-[1.75rem_minmax(0,8.5rem)_1fr_3rem] items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs transition-colors sm:grid-cols-[1.75rem_9.5rem_1fr_3rem] ${
        selected ? 'bg-rose-500/[0.08] ring-1 ring-rose-400/70' : hovered ? 'bg-night-900/[0.04] dark:bg-white/[0.05]' : ''
      }`}
    >
      <span className="text-right tabular-nums muted">{rank ?? ''}</span>
      <span className={`truncate ${emphasis ? 'font-semibold' : 'font-medium'} ${selected ? 'text-rose-700 dark:text-rose-300' : ''}`}>{label}</span>
      <span className={`flex gap-[2px] overflow-hidden rounded ${emphasis ? 'h-4' : 'h-3'}`} aria-hidden>
        {order.map((s) => (
          <span
            key={s.key}
            className="h-full transition-[width] duration-700 ease-out first:rounded-l last:rounded-r"
            style={{ width: `${shares[s.key]}%`, background: SECTOR_COLORS[s.id] }}
          />
        ))}
      </span>
      <span className="text-right font-semibold tabular-nums">{fmtPct(shares[sortBy])}</span>
    </Tag>
  )
}
