import { useMemo } from 'react'
import type { Indicator } from '../lib/indicators'
import { median, sum, type Classes, type Ranked } from '../lib/stats'

interface Props {
  indicator: Indicator
  ranking: Ranked[]
  classes: Classes
  selectedId: string
  compareId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  className?: string
}

/** Indicadores em que somar os municípios dá o total do estado. */
const ADDITIVE = new Set(['popEst', 'pib'])
const LANE = 15
const GAP = 2.1 // distância mínima entre pontos na mesma linha, em % da largura

/** Faixa de pontos: cada município é um ponto posicionado pelo seu valor. */
export function Panorama({ indicator, ranking, classes, selectedId, compareId, hoveredId, onSelect, onHover, className = '' }: Props) {
  const values = ranking.map((r) => r.value)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  // Dados muito concentrados (Manaus) espremem todo o resto num canto: aí a escala vira logarítmica.
  const log = lo > 0 && hi / lo > 60
  const med = median(values)

  const x = useMemo(() => {
    const f = log ? Math.log : (v: number) => v
    const a = f(lo)
    const b = f(hi)
    return (v: number) => 2 + ((f(v) - a) / (b - a || 1)) * 96
  }, [lo, hi, log])

  const dots = useMemo(() => {
    const lanes: number[] = []
    return [...ranking]
      .sort((p, q) => p.value - q.value)
      .map((r) => {
        const px = x(r.value)
        let lane = lanes.findIndex((last) => px - last >= GAP)
        if (lane === -1) lane = lanes.length
        lanes[lane] = px
        return { ...r, px, lane }
      })
  }, [ranking, x])
  const laneCount = Math.max(1, ...dots.map((d) => d.lane + 1))
  const height = Math.max(150, laneCount * LANE + 34)

  const top = ranking[0]
  const bottom = ranking[ranking.length - 1]
  const stats = [
    { label: 'Maior', value: top?.value, who: top?.m.nome },
    { label: 'Mediana', value: med ?? undefined, who: 'município típico' },
    { label: 'Menor', value: bottom?.value, who: bottom?.m.nome },
    ADDITIVE.has(indicator.key)
      ? { label: 'Total do estado', value: sum(values), who: `${ranking.length} municípios` }
      : { label: 'Média simples', value: values.length ? sum(values) / values.length : undefined, who: `${ranking.length} municípios` },
  ]

  return (
    <section aria-labelledby="panorama-titulo" className={`card reveal flex flex-col p-5 sm:p-6 ${className}`}>
      <p className="eyebrow">Panorama</p>
      <h2 id="panorama-titulo" className="mt-1 font-display text-2xl font-semibold tracking-tight">
        Como os municípios se distribuem
      </h2>
      <p className="mt-1 text-sm muted">
        Cada ponto é um município, posicionado pelo valor de {indicator.label.toLowerCase()}.
        {log && ' Escala logarítmica, para os valores extremos não esconderem o resto.'}
      </p>

      <div className="relative mt-6" style={{ height }} aria-hidden>
        <div className="absolute inset-x-0 bottom-0 h-px bg-night-900/10 dark:bg-white/10" />
        {med != null && (
          <div className="absolute bottom-0 top-0 border-l border-dashed border-night-900/25 dark:border-white/25" style={{ left: `${x(med)}%` }}>
            <span className="absolute top-0 ml-1.5 whitespace-nowrap text-[10px] font-medium muted">mediana</span>
          </div>
        )}
        {dots.map((d) => {
          const isSel = d.m.id === selectedId
          const isCmp = d.m.id === compareId
          const isHot = d.m.id === hoveredId
          const big = isSel || isCmp || isHot
          return (
            <span
              key={d.m.id}
              title={`${d.m.nome}: ${indicator.format(d.value)}`}
              onMouseEnter={() => onHover(d.m.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(d.m.id)}
              className={`absolute -translate-x-1/2 translate-y-1/2 cursor-pointer rounded-full ring-white transition-all duration-500 dark:ring-night-900 ${
                big ? 'z-10 h-4 w-4 ring-2' : 'h-3 w-3 ring-1 hover:scale-150'
              } ${isSel ? 'outline-2 outline-offset-1 outline-rose-500' : isCmp ? 'outline-2 outline-offset-1 outline-sky-500' : ''}`}
              style={{ left: `${d.px}%`, bottom: 5 + d.lane * LANE + 'px', background: classes.colorOf(d.value) }}
            />
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums muted" aria-hidden>
        <span>{indicator.format(lo)}</span>
        <span>{indicator.format(hi)}</span>
      </div>

      <div className="min-h-6 flex-1" />
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-night-900/[0.06] bg-night-900/[0.06] dark:border-white/[0.06] dark:bg-white/[0.06]">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-3.5 dark:bg-night-900">
            <dt className="text-[11px] font-medium uppercase tracking-wider muted">{s.label}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums">{s.value == null ? '—' : indicator.format(s.value)}</dd>
            <dd className="truncate text-xs muted">{s.who}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
