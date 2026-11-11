import { hierarchy, treemap, type HierarchyRectangularNode } from 'd3-hierarchy'
import { interpolateGreens } from 'd3-scale-chromatic'
import { useMemo, useState } from 'react'
import { useElementWidth } from '../hooks'
import { fmtBRLCompact, fmtInt, fmtPct } from '../lib/format'
import { sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'
import { ChartTooltip, TipRow } from './ChartTooltip'

type Measure = 'pop' | 'pib'

const MEASURES: Record<Measure, { label: string; get: (m: Municipio) => number; format: (v: number) => string; period: (p: Periods) => string }> = {
  pop: { label: 'População', get: (m) => m.popEst ?? 0, format: fmtInt, period: (p) => p.pop },
  pib: { label: 'PIB', get: (m) => (m.pib ?? 0) * 1000, format: fmtBRLCompact, period: (p) => p.pib },
}

interface Node {
  name: string
  m?: Municipio
  value?: number
  children?: Node[]
}

interface Props {
  municipios: Municipio[]
  periods: Periods
  selectedId: string
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

/**
 * Onde estão as pessoas e a riqueza: cada retângulo é um município, com área proporcional ao valor,
 * agrupado por mesorregião. Uma só cor (verde), mais escura quanto maior a fatia.
 */
export function Concentration({ municipios, periods, selectedId, hoveredId, onSelect, onHover }: Props) {
  const [measure, setMeasure] = useState<Measure>('pop')
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)
  const M = MEASURES[measure]
  const height = width < 640 ? 460 : 440
  const total = sum(municipios.map(M.get)) || 1

  const { leaves, groups } = useMemo(() => {
    const byMeso = new Map<string, Municipio[]>()
    for (const m of municipios) {
      const k = m.mesorregiao && m.mesorregiao !== '—' ? m.mesorregiao : 'Outros'
      byMeso.set(k, [...(byMeso.get(k) ?? []), m])
    }
    const root = hierarchy<Node>({
      name: 'Amazonas',
      children: [...byMeso].map(([name, ms]) => ({ name, children: ms.map((m) => ({ name: m.nome, m, value: M.get(m) })) })),
    })
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    const laid = treemap<Node>().size([width, height]).paddingOuter(2).paddingTop(24).paddingInner(2).round(true)(root)
    return { leaves: laid.leaves(), groups: laid.children ?? [] }
  }, [municipios, M, width, height])

  // Escala de cor pela fatia do estado (log, porque Manaus sozinha passa de metade).
  const shares = leaves.map((l) => (l.value ?? 0) / total).filter((s) => s > 0)
  const lo = Math.log(Math.min(...shares))
  const hi = Math.log(Math.max(...shares))
  const tone = (share: number) => (share <= 0 ? 0 : (Math.log(share) - lo) / (hi - lo || 1))

  const hovered = leaves.find((l) => l.data.m?.id === hoveredId)
  const top5 = [...leaves].sort((a, b) => (b.value ?? 0) - (a.value ?? 0)).slice(0, 5)
  const top5Share = (sum(top5.map((l) => l.value ?? 0)) / total) * 100
  const leader = top5[0]

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="card reveal min-w-0 p-5 sm:p-6 lg:col-span-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">Onde está {measure === 'pop' ? 'a população' : 'a riqueza'}</h3>
            <p className="text-sm muted">
              Área de cada bloco proporcional {measure === 'pop' ? 'aos moradores' : 'ao PIB'} ({M.period(periods)}), agrupado por mesorregião.
            </p>
          </div>
          <Segmented
            value={measure}
            onChange={setMeasure}
            options={[
              { value: 'pop', label: 'População' },
              { value: 'pib', label: 'PIB' },
            ]}
          />
        </div>

        <div
          ref={ref}
          className="relative w-full select-none"
          style={{ height }}
          role="img"
          aria-label={`Treemap de ${M.label.toLowerCase()} por município. ${top5.map((l) => `${l.data.name}: ${fmtPct(((l.value ?? 0) / total) * 100)}`).join('; ')}.`}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setTip({ x: e.clientX - r.left, y: e.clientY - r.top })
          }}
          onMouseLeave={() => {
            setTip(null)
            onHover(null)
          }}
        >
          {width > 0 && groups.map((g) => (
            <div
              key={g.data.name}
              className="pointer-events-none absolute rounded-lg border border-night-900/[0.08] dark:border-white/[0.08]"
              style={{ left: g.x0, top: g.y0, width: g.x1 - g.x0, height: g.y1 - g.y0 }}
            >
              <div className="flex h-6 items-center justify-between gap-2 overflow-hidden px-2 text-[11px] font-semibold uppercase tracking-wider">
                <span className="truncate">{g.data.name.replace(/ Amazonense$/, '')}</span>
                <span className="shrink-0 tabular-nums muted">{fmtPct(((g.value ?? 0) / total) * 100)}</span>
              </div>
            </div>
          ))}
          {width > 0 && leaves.map((l) => (
            <Tile
              key={l.data.m!.id}
              node={l}
              t={tone((l.value ?? 0) / total)}
              share={((l.value ?? 0) / total) * 100}
              selected={l.data.m!.id === selectedId}
              hovered={l.data.m!.id === hoveredId}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
          {hovered && tip && (
            <ChartTooltip x={tip.x} y={tip.y} width={width}>
              <p className="text-sm font-semibold">{hovered.data.name}</p>
              <p className="mb-1.5 muted">{hovered.data.m?.mesorregiao}</p>
              <TipRow label={M.label} value={M.format(hovered.value ?? 0)} />
              <TipRow label="Fatia do estado" value={fmtPct(((hovered.value ?? 0) / total) * 100)} />
            </ChartTooltip>
          )}
        </div>
      </div>

      <aside className="card reveal flex flex-col p-5 sm:p-6 lg:col-span-4" aria-label="Destaques da concentração">
        <h3 className="font-display text-xl font-semibold tracking-tight">Concentração</h3>
        <p className="text-sm muted">Quanto {measure === 'pop' ? 'da população' : 'do PIB'} fica em poucos lugares.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat value={fmtPct(((leader?.value ?? 0) / total) * 100)} label={`em ${leader?.data.name ?? '—'}`} />
          <Stat value={fmtPct(top5Share)} label="nos 5 maiores" />
        </div>
        <h4 className="mt-6 text-[11px] font-semibold uppercase tracking-wider muted">Por mesorregião</h4>
        <ul className="mt-2 space-y-3">
          {groups.map((g) => {
            const pct = ((g.value ?? 0) / total) * 100
            return (
              <li key={g.data.name}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">{g.data.name}</span>
                  <span className="font-semibold tabular-nums">{fmtPct(pct)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-night-900/[0.06] dark:bg-white/[0.07]">
                  <div className="h-full rounded-full bg-forest-600 transition-[width] duration-700 dark:bg-forest-400" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-0.5 text-[11px] muted">
                  {g.children?.length ?? 0} municípios · {M.format(g.value ?? 0)}
                </p>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}

function Tile({
  node,
  t,
  share,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  node: HierarchyRectangularNode<Node>
  t: number
  share: number
  selected: boolean
  hovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const w = node.x1 - node.x0
  const h = node.y1 - node.y0
  const m = node.data.m!
  const dark = t > 0.5
  const showName = w > 54 && h > 22
  const showPct = w > 46 && h > 40
  return (
    <button
      type="button"
      onClick={() => onSelect(m.id)}
      onMouseEnter={() => onHover(m.id)}
      onFocus={() => onHover(m.id)}
      onBlur={() => onHover(null)}
      aria-label={`${m.nome}: ${fmtPct(share)} do estado`}
      className={`absolute overflow-hidden rounded-[5px] p-1.5 text-left transition-[left,top,width,height,filter] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose-500 ${
        hovered ? 'brightness-110' : ''
      } ${selected ? 'z-10 ring-[3px] ring-rose-500 ring-offset-1 ring-offset-white dark:ring-offset-night-900' : ''}`}
      style={{
        left: node.x0,
        top: node.y0,
        width: w,
        height: h,
        background: interpolateGreens(0.2 + t * 0.72),
        color: dark ? '#fff' : '#0b3b2e',
      }}
    >
      {showName && <span className="block truncate text-[11px] font-semibold leading-tight sm:text-xs">{m.nome}</span>}
      {showPct && <span className="block text-[11px] tabular-nums opacity-80">{fmtPct(share)}</span>}
    </button>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-forest-500/[0.08] p-3.5">
      <p className="font-display text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="truncate text-xs muted">{label}</p>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; swatch?: string }[]
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-full bg-night-900/[0.05] p-1 dark:bg-white/[0.06]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
            o.value === value
              ? 'bg-white text-night-900 shadow-sm dark:bg-night-700 dark:text-white'
              : 'text-night-900/65 hover:text-night-900 dark:text-sand-100/65 dark:hover:text-white'
          }`}
        >
          {o.swatch && <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: o.swatch }} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
