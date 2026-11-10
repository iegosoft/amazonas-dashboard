import { geoMercator, geoPath } from 'd3-geo'
import { useMemo, useRef, useState } from 'react'
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
        [8, 8],
        [W - 8, H - 8],
      ],
      geo,
    )
    const path = geoPath(projection)
    return geo.features.map((f) => ({ id: f.properties.codarea, d: path(f) ?? '' }))
  }, [geo])

  // Ordem de desenho: o destacado vai por cima para a borda não ser cortada.
  const ordered = useMemo(() => {
    const top = new Set([selectedId, compareId, hoveredId])
    return [...paths.filter((p) => !top.has(p.id)), ...paths.filter((p) => top.has(p.id))]
  }, [paths, selectedId, compareId, hoveredId])

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
        className="h-auto w-full"
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
              className="map-region cursor-pointer"
              fill={classes.colorOf(value)}
              fillOpacity={dim ? 0.55 : 1}
              stroke={isSel ? '#e11d48' : isCmp ? '#0ea5e9' : isHover ? '#0f172a' : 'rgba(255,255,255,0.55)'}
              strokeWidth={isSel || isCmp ? 2.5 : isHover ? 2 : 0.6}
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
      </svg>

      {hovered && pos && (
        <div
          className="pointer-events-none absolute z-10 w-52 rounded-lg border border-slate-200 bg-white/95 p-2.5 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
          style={{
            left: Math.max(4, Math.min(pos.x + 14, pos.w - 215)),
            top: Math.max(pos.y - 70, 4),
          }}
        >
          <div className="font-semibold">{hovered.nome}</div>
          <div className="text-slate-500 dark:text-slate-400">{hovered.microrregiao}</div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-base font-bold tabular-nums">
              {hoveredValue == null ? 'Sem dados' : indicator.format(hoveredValue)}
            </span>
            {rankOf.has(hovered.id) && (
              <span className="text-slate-500 dark:text-slate-400">
                {rankOf.get(hovered.id)}º de {total}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Legend({ indicator, classes }: { indicator: Indicator; classes: Classes }) {
  const { breaks, colors } = classes
  const label = (i: number) => {
    if (i === 0) return `até ${indicator.format(breaks[0]!)}`
    if (i === colors.length - 1) return `acima de ${indicator.format(breaks[i - 1]!)}`
    return `${indicator.format(breaks[i - 1]!)} a ${indicator.format(breaks[i]!)}`
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-300" aria-label="Legenda do mapa">
      {colors.map((c, i) => (
        <li key={c + i} className="flex items-center gap-2">
          <span className="h-3 w-5 shrink-0 rounded-sm ring-1 ring-black/10" style={{ background: c }} />
          <span className="truncate tabular-nums">{label(i)}</span>
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span className="h-3 w-5 shrink-0 rounded-sm ring-1 ring-black/10" style={{ background: NO_DATA_COLOR }} />
        <span>sem dados</span>
      </li>
    </ul>
  )
}
