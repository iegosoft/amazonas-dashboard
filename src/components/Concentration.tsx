import { useMemo, useState, type ReactNode } from 'react'
import { fmtBRLCompact, fmtInt, fmtPct } from '../lib/format'
import { sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'

type Measure = 'pop' | 'pib'

const MEASURES: Record<Measure, { label: string; noun: string; get: (m: Municipio) => number; period: (p: Periods) => string }> = {
  pop: { label: 'População', noun: 'das pessoas', get: (m) => m.popEst ?? 0, period: (p) => p.pop },
  pib: { label: 'PIB', noun: 'da riqueza', get: (m) => m.pib ?? 0, period: (p) => p.pib },
}

/** Quantos municípios seguem o maior na faixa do meio da barra. */
const NEXT = 4
const TOP = 10

interface Props {
  municipios: Municipio[]
  periods: Periods
  selectedId: string
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

interface Split {
  leader: Municipio
  shares: [number, number, number]
  rest: number
}

/** Fatia do maior município, dos {@link NEXT} seguintes e de todos os demais, para uma medida. */
function split(municipios: Municipio[], measure: Measure): Split {
  const get = MEASURES[measure].get
  const ranked = [...municipios].sort((a, b) => get(b) - get(a))
  const total = sum(ranked.map(get)) || 1
  const pct = (ms: Municipio[]) => (sum(ms.map(get)) / total) * 100
  return {
    leader: ranked[0],
    shares: [pct(ranked.slice(0, 1)), pct(ranked.slice(1, 1 + NEXT)), pct(ranked.slice(1 + NEXT))],
    rest: ranked.length - 1 - NEXT,
  }
}

/**
 * Pessoas × riqueza: duas barras 100% lado a lado (população e PIB), cada uma dividida em maior município,
 * os quatro seguintes e os demais. O título já dá a conclusão; a lista abaixo mostra quem é quem.
 */
export function Concentration({ municipios, periods, selectedId, hoveredId, onSelect, onHover }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [activeMeso, setActiveMeso] = useState<number | null>(null)
  const { pop, pib, totals, top, meso } = useMemo(() => {
    const totals = { pop: sum(municipios.map(MEASURES.pop.get)) || 1, pib: sum(municipios.map(MEASURES.pib.get)) || 1 }
    const byPop = [...municipios].sort((a, b) => MEASURES.pop.get(b) - MEASURES.pop.get(a))
    const groups = new Map<string, Municipio[]>()
    for (const m of municipios) {
      const k = m.mesorregiao && m.mesorregiao !== '—' ? m.mesorregiao : 'Outros'
      groups.set(k, [...(groups.get(k) ?? []), m])
    }
    const meso = [...groups]
      .map(([name, ms]) => ({
        name,
        count: ms.length,
        pop: (sum(ms.map(MEASURES.pop.get)) / totals.pop) * 100,
        pib: (sum(ms.map(MEASURES.pib.get)) / totals.pib) * 100,
      }))
      .sort((a, b) => b.pop - a.pop)
    return { pop: split(municipios, 'pop'), pib: split(municipios, 'pib'), totals, top: byPop, meso }
  }, [municipios])

  const share = (m: Municipio, k: Measure) => (MEASURES[k].get(m) / totals[k]) * 100
  const rank = top.findIndex((m) => m.id === selectedId)
  const visible = showAll ? top : top.slice(0, TOP)
  const extra = !showAll && rank >= TOP ? top[rank] : null
  const sameLeader = pop.leader.id === pib.leader.id

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="card reveal min-w-0 p-5 sm:p-7 lg:col-span-8">
        <p className="eyebrow">Concentração</p>
        <h3 className="mt-2 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
          {sameLeader ? (
            <>
              {pop.leader.nome} tem <Hl>{fmtPct(pop.shares[0])}</Hl> das pessoas e <Hl>{fmtPct(pib.shares[0])}</Hl> da riqueza do Amazonas
            </>
          ) : (
            <>Poucos municípios concentram as pessoas e a riqueza do Amazonas</>
          )}
        </h3>
        <p className="mt-2 text-sm muted">
          Fatia de cada grupo na população ({periods.pop}) e no PIB ({periods.pib}). Os outros {pop.rest} municípios, juntos, somam{' '}
          {fmtPct(pop.shares[2])} das pessoas e {fmtPct(pib.shares[2])} da riqueza.
        </p>

        <div className="mt-6 space-y-5">
          <SplitBar measure="pop" split={pop} period={periods.pop} />
          <SplitBar measure="pib" split={pib} period={periods.pib} />
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-end gap-x-3 border-b border-night-900/[0.08] pb-2 text-[11px] font-semibold uppercase tracking-wider muted sm:grid-cols-[2rem_minmax(8rem,12rem)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-5 dark:border-white/[0.08]">
            <span />
            <span>{showAll ? `Os ${top.length} municípios` : `Os ${TOP} mais populosos`}</span>
            <span>Pessoas</span>
            <span>Riqueza (PIB)</span>
          </div>
          <ol onMouseLeave={() => onHover(null)} className="divide-y divide-night-900/[0.05] dark:divide-white/[0.05]">
            {visible.map((m, i) => (
              <TopRow key={m.id} m={m} rank={i + 1} pop={share(m, 'pop')} pib={share(m, 'pib')} max={pib.shares[0]} selected={m.id === selectedId} hovered={m.id === hoveredId} onSelect={onSelect} onHover={onHover} />
            ))}
            {extra && (
              <TopRow m={extra} rank={rank + 1} pop={share(extra, 'pop')} pib={share(extra, 'pib')} max={pib.shares[0]} selected hovered={false} onSelect={onSelect} onHover={onHover} gap />
            )}
          </ol>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs muted">As barras usam a mesma escala nas duas colunas. Clique num município para vê-lo no resto do painel.</p>
            <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="btn-soft px-3 py-1.5 text-xs">
              {showAll ? `Mostrar só os ${TOP} maiores` : `Mostrar os ${top.length} municípios`}
            </button>
          </div>
        </div>
      </div>

      <aside className="card reveal flex flex-col p-5 sm:p-6 lg:col-span-4" aria-label="Concentração por mesorregião">
        <h3 className="font-display text-xl font-semibold tracking-tight">Por mesorregião</h3>
        <p className="text-sm muted">Como as pessoas e a riqueza se dividem entre as quatro partes do estado.</p>
        <div className="mt-5 grid grid-cols-2 gap-4" onMouseLeave={() => setActiveMeso(null)}>
          <Donut title="Pessoas" values={meso.map((g) => g.pop)} names={meso.map((g) => g.name)} active={activeMeso} onActive={setActiveMeso} />
          <Donut title="Riqueza" values={meso.map((g) => g.pib)} names={meso.map((g) => g.name)} active={activeMeso} onActive={setActiveMeso} />
        </div>
        <table className="mt-5 w-full text-sm" onMouseLeave={() => setActiveMeso(null)}>
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider muted">
              <th className="pb-1.5 text-left font-semibold">Mesorregião</th>
              <th className="pb-1.5 text-right font-semibold">Pessoas</th>
              <th className="pb-1.5 text-right font-semibold">Riqueza</th>
            </tr>
          </thead>
          <tbody>
            {meso.map((g, i) => (
              <tr
                key={g.name}
                onMouseEnter={() => setActiveMeso(i)}
                className={`border-t border-night-900/[0.06] transition-opacity dark:border-white/[0.06] ${activeMeso != null && activeMeso !== i ? 'opacity-45' : ''}`}
              >
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: MESO_TONES[i % MESO_TONES.length] }} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{g.name.replace(/ Amazonense$/, '')}</span>
                      <span className="block text-[11px] muted">{g.count} municípios</span>
                    </span>
                  </span>
                </td>
                <td className="py-2 text-right font-semibold tabular-nums">{fmtPct(g.pop)}</td>
                <td className="py-2 text-right font-semibold tabular-nums">{fmtPct(g.pib)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-auto pt-6 text-xs muted">
          Total do estado: {fmtInt(totals.pop)} habitantes ({periods.pop}) e {fmtBRLCompact(totals.pib * 1000)} de PIB ({periods.pib}).
        </p>
      </aside>
    </div>
  )
}

/** Destaque do número no título: só a cor da marca, sem enfeite. */
function Hl({ children }: { children: ReactNode }) {
  return <span className="text-forest-700 dark:text-forest-300">{children}</span>
}

const SEGMENT_TONES = ['var(--conc-1)', 'var(--conc-2)', 'var(--conc-3)']

function SplitBar({ measure, split: s, period }: { measure: Measure; split: Split; period: string }) {
  const M = MEASURES[measure]
  const labels = [s.leader.nome, `${NEXT} seguintes`, `Demais ${s.rest}`]
  return (
    <figure>
      <figcaption className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider muted">
        <span>{measure === 'pop' ? 'Pessoas' : 'Riqueza (PIB)'}</span>
        <span className="font-normal normal-case tracking-normal">{period}</span>
      </figcaption>
      <div
        className="flex h-10 gap-[2px] overflow-hidden rounded-lg"
        role="img"
        aria-label={`${M.label}: ${labels.map((l, i) => `${l} ${fmtPct(s.shares[i])}`).join(', ')}`}
      >
        {s.shares.map((v, i) => (
          <div
            key={i}
            className="flex min-w-0 items-center px-3 transition-[width] duration-700 ease-out first:rounded-l-lg last:rounded-r-lg"
            style={{ width: `${v}%`, background: SEGMENT_TONES[i] }}
          >
            {i === 0 && v > 18 && <span className="truncate font-display text-lg font-semibold tabular-nums text-white">{fmtPct(v)}</span>}
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-hidden>
        {labels.map((l, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SEGMENT_TONES[i] }} />
            <span className={i === 0 ? 'font-semibold' : ''}>{l}</span>
            <span className="tabular-nums muted">{fmtPct(s.shares[i])}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function TopRow({
  m,
  rank,
  pop,
  pib,
  max,
  selected,
  hovered,
  gap,
  onSelect,
  onHover,
}: {
  m: Municipio
  rank: number
  pop: number
  pib: number
  max: number
  selected: boolean
  hovered: boolean
  gap?: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  return (
    <li className={gap ? 'border-t border-dashed border-night-900/15 dark:border-white/15' : ''}>
      <button
        type="button"
        onClick={() => onSelect(m.id)}
        onMouseEnter={() => onHover(m.id)}
        onFocus={() => onHover(m.id)}
        aria-label={`${rank}º ${m.nome}: ${fmtPct(pop)} das pessoas, ${fmtPct(pib)} da riqueza`}
        className={`grid w-full grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3 rounded-lg px-1 py-2 text-left text-sm transition-colors sm:grid-cols-[2rem_minmax(8rem,12rem)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-5 ${
          selected ? 'bg-rose-500/[0.08] ring-1 ring-rose-400/70' : hovered ? 'bg-night-900/[0.04] dark:bg-white/[0.05]' : ''
        }`}
      >
        <span className="text-right text-xs tabular-nums muted">{rank}</span>
        <span className={`truncate font-medium ${selected ? 'text-rose-700 dark:text-rose-300' : ''}`}>{m.nome}</span>
        <ShareCell value={pop} max={max} tone="pop" />
        <ShareCell value={pib} max={max} tone="pib" />
      </button>
    </li>
  )
}

const TONE = { pop: 'var(--conc-pop)', pib: 'var(--conc-pib)' }

function ShareCell({ value, max, tone }: { value: number; max: number; tone: Measure }) {
  return (
    <span className="flex min-w-0 items-center gap-2" aria-hidden>
      <span className="relative h-2.5 flex-1 rounded-full bg-night-900/[0.06] dark:bg-white/[0.07]">
        <span className="absolute inset-y-0 left-0 min-w-[3px] rounded-full" style={{ width: `${(value / max) * 100}%`, background: TONE[tone] }} />
      </span>
      <span className="w-12 shrink-0 text-right tabular-nums">{fmtPct(value)}</span>
    </span>
  )
}

/** Um só verde em quatro tons: as cores de destaque já são dos setores no resto da página. */
const MESO_TONES = ['var(--meso-1)', 'var(--meso-2)', 'var(--meso-3)', 'var(--meso-4)']

/** Rosquinha de partes que somam 100%, com um respiro entre as fatias. */
function Donut({
  title,
  values,
  names,
  active,
  onActive,
}: {
  title: string
  values: number[]
  names: string[]
  active: number | null
  onActive: (i: number | null) => void
}) {
  const size = 140
  const stroke = 22
  const grow = 4
  // Margem para a fatia destacada, que engrossa, não passar da borda do desenho.
  const r = (size - stroke - grow) / 2 - 1
  const c = 2 * Math.PI * r
  const gap = 2.5
  const total = sum(values) || 1
  let start = 0
  const center = active != null ? values[active] : null
  return (
    <figure className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`${title} por mesorregião: ${names.map((n, i) => `${n} ${fmtPct(values[i])}`).join(', ')}`}
        >
          {values.map((v, i) => {
            const len = (v / total) * c
            const dash = Math.max(len - gap, 0.5)
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={MESO_TONES[i % MESO_TONES.length]}
                strokeWidth={active === i ? stroke + grow : stroke}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-start}
                className={`cursor-pointer transition-[stroke-width,opacity] duration-200 ${active != null && active !== i ? 'opacity-40' : ''}`}
                onMouseEnter={() => onActive(i)}
              />
            )
            start += len
            return el
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-lg font-semibold tabular-nums leading-none">{center != null ? fmtPct(center) : title}</span>
          {center != null && <span className="mt-1 text-[10px] uppercase tracking-wider muted">{title}</span>}
        </div>
      </div>
      <figcaption className="mt-2 text-xs font-semibold uppercase tracking-wider muted">{title}</figcaption>
    </figure>
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
