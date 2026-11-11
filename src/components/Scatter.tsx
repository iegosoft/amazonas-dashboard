import { scaleLinear, scaleLog, scaleSqrt } from 'd3-scale'
import { useMemo, useState } from 'react'
import { useElementWidth } from '../hooks'
import { fmtBRL, fmtBRLCompact, fmtInt } from '../lib/format'
import { median } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'
import { ChartTooltip, TipRow } from './ChartTooltip'
import { Segmented } from './Concentration'

interface Props {
  municipios: Municipio[]
  periods: Periods
  selectedId: string
  compareId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const M = { t: 30, r: 18, b: 44, l: 64 }

const compactPop = (v: number) => (v >= 1e6 ? `${fmtInt(v / 1e6)} mi` : v >= 1e3 ? `${fmtInt(v / 1e3)} mil` : fmtInt(v))
const compactBRL = (v: number) => (v >= 1e3 ? `R$ ${fmtInt(v / 1e3)} mil` : `R$ ${fmtInt(v)}`)

/** Dispersão: tamanho (população, escala log) × riqueza por pessoa (PIB per capita); bolha = PIB total. */
export function Scatter({ municipios, periods, selectedId, compareId, hoveredId, onSelect, onHover }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [meso, setMeso] = useState<string>('todas')
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)
  const height = width < 640 ? 360 : 460

  const pts = useMemo(
    () =>
      municipios
        .filter((m) => (m.popEst ?? 0) > 0 && m.pibPerCapita != null && m.pib != null)
        .map((m) => ({ m, x: m.popEst!, y: m.pibPerCapita!, pib: m.pib! * 1000 })),
    [municipios],
  )
  const mesos = useMemo(() => [...new Set(municipios.map((m) => m.mesorregiao).filter((s) => s && s !== '—'))].sort(), [municipios])

  const { x, y, r, xTicks, yTicks, medX, medY } = useMemo(() => {
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const x = scaleLog()
      .domain([Math.min(...xs) * 0.85, Math.max(...xs) * 1.25])
      .range([M.l, width - M.r])
    const y = scaleLinear()
      .domain([0, Math.max(...ys) * 1.08])
      .nice()
      .range([height - M.b, M.t])
    const r = scaleSqrt()
      .domain([0, Math.max(...pts.map((p) => p.pib))])
      .range([0, width < 640 ? 24 : 36])
    const candidates = [5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 2e6]
    const [a, b] = x.domain() as [number, number]
    return {
      x,
      y,
      r,
      xTicks: candidates.filter((t) => t >= a && t <= b).filter((_, i, arr) => width >= 640 || i % 2 === 0 || i === arr.length - 1),
      yTicks: y.ticks(width < 640 ? 4 : 6),
      medX: median(xs),
      medY: median(ys),
    }
  }, [pts, width, height])

  const radius = (pib: number) => Math.max(4.5, r(pib))
  const ordered = [...pts].sort((a, b) => b.pib - a.pib) // bolhas grandes atrás
  const focus = new Set([selectedId, compareId, hoveredId])
  const labeled = pts.filter((p) => p.m.id === selectedId || p.m.id === compareId || p === ordered[0])
  const hovered = pts.find((p) => p.m.id === hoveredId)

  const quadrant = (txt: string, cls: string) => <span className={`pointer-events-none absolute text-[11px] font-medium muted ${cls}`}>{txt}</span>

  return (
    <div className="card reveal p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">Tamanho × riqueza por pessoa</h3>
          <p className="max-w-2xl text-sm muted">
            Cada bolha é um município: mais à direita, mais moradores ({periods.pop}); mais alto, maior o PIB per capita ({periods.pib}); bolha
            maior, maior o PIB total. As linhas tracejadas marcam as medianas.
          </p>
        </div>
        <Segmented
          label="Destacar mesorregião"
          value={meso}
          onChange={setMeso}
          options={[{ value: 'todas', label: 'Todas' }, ...mesos.map((s) => ({ value: s, label: s.replace(' Amazonense', '') }))]}
        />
      </div>

      <div
        ref={ref}
        className="relative w-full"
        style={{ height }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }}
        onMouseLeave={() => {
          setTip(null)
          onHover(null)
        }}
      >
        {width > 0 && <svg width={width} height={height} className="absolute inset-0 overflow-visible" role="img" aria-labelledby="scatter-desc">
          <desc id="scatter-desc">
            Gráfico de dispersão de população por PIB per capita dos municípios do Amazonas. Use o ranking para ver os valores em lista.
          </desc>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
              <text x={M.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--chart-axis)] text-[11px]">
                {compactBRL(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={M.t} y2={height - M.b} stroke="var(--chart-grid)" />
              <text x={x(t)} y={height - M.b + 18} textAnchor="middle" className="fill-[var(--chart-axis)] text-[11px]">
                {compactPop(t)}
              </text>
            </g>
          ))}
          <text x={width - M.r} y={height - 6} textAnchor="end" className="fill-[var(--chart-axis)] text-[11px] font-medium">
            População (escala log) →
          </text>
          <text x={4} y={M.t - 16} className="fill-[var(--chart-axis)] text-[11px] font-medium">
            ↑ PIB per capita
          </text>
          {medX != null && (
            <line x1={x(medX)} x2={x(medX)} y1={M.t} y2={height - M.b} stroke="var(--chart-axis)" strokeOpacity={0.5} strokeDasharray="4 4" />
          )}
          {medY != null && (
            <line x1={M.l} x2={width - M.r} y1={y(medY)} y2={y(medY)} stroke="var(--chart-axis)" strokeOpacity={0.5} strokeDasharray="4 4" />
          )}

          {ordered.map((p) => {
            const isSel = p.m.id === selectedId
            const isCmp = p.m.id === compareId
            const isHot = p.m.id === hoveredId
            const dim = meso !== 'todas' && p.m.mesorregiao !== meso && !isSel && !isCmp
            return (
              <circle
                key={p.m.id}
                cx={x(p.x)}
                cy={y(p.y)}
                r={radius(p.pib)}
                fill={isSel ? '#f43f5e' : isCmp ? '#0ea5e9' : 'var(--chart-point)'}
                fillOpacity={dim ? 0.08 : isSel || isCmp || isHot ? 0.95 : 0.5}
                stroke={isHot ? 'var(--map-hover)' : 'var(--chart-surface)'}
                strokeWidth={isHot ? 2 : 1.5}
                className="cursor-pointer transition-[fill-opacity,cx,cy,r] duration-500"
                onMouseEnter={() => onHover(p.m.id)}
                onClick={() => onSelect(p.m.id)}
              />
            )
          })}
          {/* Destacados redesenhados por cima, com anel de superfície */}
          {pts
            .filter((p) => focus.has(p.m.id) && (p.m.id === selectedId || p.m.id === compareId))
            .map((p) => (
              <circle
                key={`top-${p.m.id}`}
                cx={x(p.x)}
                cy={y(p.y)}
                r={radius(p.pib)}
                fill={p.m.id === selectedId ? '#f43f5e' : '#0ea5e9'}
                stroke="var(--chart-surface)"
                strokeWidth={2}
                className="pointer-events-none"
              />
            ))}
          {labeled.map((p) => {
            const cx = x(p.x)
            const anchorEnd = cx > width - 120
            return (
              <text
                key={`l-${p.m.id}`}
                x={cx + (anchorEnd ? -1 : 1) * (radius(p.pib) + 6)}
                y={y(p.y)}
                dy="0.32em"
                textAnchor={anchorEnd ? 'end' : 'start'}
                className="map-label pointer-events-none text-[12px] font-semibold"
              >
                {p.m.nome}
              </text>
            )
          })}
        </svg>}
        {quadrant('Pequenos, PIB/hab. alto', 'left-[4.5rem] top-9')}
        {quadrant('Grandes, PIB/hab. alto', 'right-5 top-9 text-right')}
        {quadrant('Pequenos, PIB/hab. baixo', 'bottom-14 left-[4.5rem] max-sm:hidden')}
        {quadrant('Grandes, PIB/hab. baixo', 'bottom-14 right-5 text-right max-sm:hidden')}

        {hovered && tip && (
          <ChartTooltip x={tip.x} y={tip.y} width={width}>
            <p className="text-sm font-semibold">{hovered.m.nome}</p>
            <p className="mb-1.5 muted">{hovered.m.mesorregiao}</p>
            <TipRow label={`População (${periods.pop})`} value={fmtInt(hovered.x)} />
            <TipRow label={`PIB per capita (${periods.pib})`} value={fmtBRL(hovered.y)} />
            <TipRow label={`PIB total (${periods.pib})`} value={fmtBRLCompact(hovered.pib)} />
          </ChartTooltip>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-point)] opacity-60" /> Município
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Selecionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Comparação
        </span>
        <span>Clique numa bolha para abrir o perfil.</span>
      </div>
    </div>
  )
}
