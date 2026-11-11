import { geoMercator, geoPath } from 'd3-geo'
import { useMemo, useRef, useState } from 'react'
import { fmtRegiao } from '../lib/format'
import type { Indicator } from '../lib/indicators'
import type { Classes } from '../lib/stats'
import { NO_DATA_COLOR } from '../lib/stats'
import type { MunGeo, Municipio } from '../lib/types'

const W = 900
const H = 640

interface Props {
  geo: MunGeo
  byId: Map<string, Municipio>
  indicator: Indicator
  classes: Classes
  rankOf: Map<string, number>
  total: number
  selectedId: string
  compareId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

export function MapView({
  geo,
  byId,
  indicator,
  classes,
  rankOf,
  total,
  selectedId,
  compareId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; w: number } | null>(null)

  const paths = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [12, 12],
        [W - 12, H - 12],
      ],
      geo,
    )
    const path = geoPath(projection)
    return geo.features.map((f) => {
      const [cx, cy] = path.centroid(f)
      return { id: f.properties.codarea, d: path(f) ?? '', cx, cy }
    })
  }, [geo])

  // Ordem de desenho: o destacado vai por cima para a borda não ser cortada.
  const ordered = useMemo(() => {
    const top = new Set([selectedId, compareId, hoveredId])
    return [...paths.filter((p) => !top.has(p.id)), ...paths.filter((p) => top.has(p.id))]
  }, [paths, selectedId, compareId, hoveredId])

  const labels = useMemo(
    () =>
      [selectedId, compareId]
        .map((id) => paths.find((p) => p.id === id))
        .filter((p): p is (typeof paths)[number] => p != null && Number.isFinite(p.cx)),
    [paths, selectedId, compareId],
  )

  const hovered = hoveredId ? byId.get(hoveredId) : undefined
  const hoveredValue = hovered ? indicator.get(hovered) : null

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseMove={(e) => {
        const r = wrapRef.current?.getBoundingClientRect()
        if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width })
      }}
      onMouseLeave={() => {
        setPos(null)
        onHover(null)
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label={`Mapa dos municípios do Amazonas por ${indicator.label}`}
        className="h-auto w-full overflow-visible"
      >
        {ordered.map(({ id, d }) => {
          const m = byId.get(id)
          const value = m ? indicator.get(m) : null
          const isSel = id === selectedId
          const isCmp = id === compareId
          const isHover = id === hoveredId
          const dim = hoveredId != null && !isHover && !isSel && !isCmp
          return (
            <path
              key={id}
              d={d}
              className={`map-region cursor-pointer ${isSel ? 'is-selected' : isCmp ? 'is-compare' : ''}`}
              fill={classes.colorOf(value)}
              fillOpacity={dim ? 0.45 : 1}
              stroke={isSel ? '#f43f5e' : isCmp ? '#0ea5e9' : isHover ? 'var(--map-hover)' : 'var(--map-stroke)'}
              strokeWidth={isSel || isCmp ? 2.75 : isHover ? 2 : 0.7}
              strokeLinejoin="round"
              tabIndex={0}
              role="button"
              aria-pressed={isSel}
              aria-label={`${m?.nome ?? id}: ${value == null ? 'sem dados' : indicator.format(value)}`}
              onMouseEnter={() => onHover(id)}
              onFocus={() => onHover(id)}
              onBlur={() => onHover(null)}
              onClick={() => onSelect(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(id)
                }
              }}
            />
          )
        })}
        <g aria-hidden="true" className="pointer-events-none select-none">
          {labels.map((l) => {
            const isSel = l.id === selectedId
            return (
              <g key={l.id} transform={`translate(${l.cx} ${l.cy})`}>
                <circle r={5.5} fill={isSel ? '#f43f5e' : '#0ea5e9'} stroke="var(--map-label-halo)" strokeWidth={2.5} />
                <text y={-12} textAnchor="middle" className="map-label font-sans text-[19px] font-semibold">
                  {byId.get(l.id)?.nome}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {hovered && pos && (
        <div
          className="animate-fade pointer-events-none absolute z-10 w-56 rounded-2xl border border-night-900/10 bg-white/95 p-3 text-xs shadow-xl shadow-night-900/10 backdrop-blur-md dark:border-white/10 dark:bg-night-800/95"
          style={{
            left: Math.max(4, Math.min(pos.x + 16, pos.w - 228)),
            top: Math.max(pos.y - 96, 4),
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-[4px] ring-1 ring-black/10"
              style={{ background: classes.colorOf(hoveredValue) }}
            />
            <span className="truncate text-sm font-semibold">{hovered.nome}</span>
          </div>
          <div className="mt-0.5 line-clamp-2 muted">{fmtRegiao(hovered)}</div>
          <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-night-900/[0.07] pt-2 dark:border-white/10">
            <span className="font-display text-lg font-semibold tabular-nums">
              {hoveredValue == null ? 'Sem dados' : indicator.format(hoveredValue)}
            </span>
            {rankOf.has(hovered.id) && (
              <span className="rounded-full bg-night-900/[0.06] px-2 py-0.5 font-medium tabular-nums dark:bg-white/10">
                {rankOf.get(hovered.id)}º de {total}
              </span>
            )}
          </div>
          {hovered.id !== selectedId && <div className="mt-1.5 text-[11px] muted">Clique para ver os detalhes</div>}
        </div>
      )}
    </div>
  )
}

/** Legenda em barra contínua: cada faixa de cor cobre ~o mesmo número de municípios. */
export function Legend({ indicator, classes }: { indicator: Indicator; classes: Classes }) {
  const { breaks, colors } = classes
  const label = (i: number) => {
    if (i === 0) return `até ${indicator.format(breaks[0]!)}`
    if (i === colors.length - 1) return `acima de ${indicator.format(breaks[i - 1]!)}`
    return `${indicator.format(breaks[i - 1]!)} a ${indicator.format(breaks[i]!)}`
  }
  return (
    <div className="flex items-end gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex h-2.5 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10" aria-hidden>
          {colors.map((c, i) => (
            <span key={c + i} className="flex-1 transition-colors duration-500" style={{ background: c }} />
          ))}
        </div>
        <div className="relative mt-1.5 h-4 text-[10px] tabular-nums muted sm:text-[11px]" aria-hidden>
          {breaks.map((b, i) => (
            <span
              key={i}
              className={`absolute -translate-x-1/2 whitespace-nowrap ${i % 2 === 1 ? 'max-sm:hidden' : ''}`}
              style={{ left: `${((i + 1) / colors.length) * 100}%` }}
            >
              {indicator.format(b)}
            </span>
          ))}
        </div>
        <ul className="sr-only" aria-label="Legenda do mapa">
          {colors.map((c, i) => (
            <li key={c + i}>{label(i)}</li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pb-5 text-[11px] muted">
        <span className="h-2.5 w-4 rounded-sm ring-1 ring-black/10" style={{ background: NO_DATA_COLOR }} />
        <span>sem dados</span>
      </div>
    </div>
  )
}
