import { fmtPct, fmtRegiao } from '../lib/format'
import { INDICATORS, SECTORS, SECTOR_COLORS, type Indicator } from '../lib/indicators'
import { median, rankBy, sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'
import { ChevronDownIcon, PinIcon } from './Icons'

interface Props {
  municipios: Municipio[]
  selected: Municipio
  compare: Municipio | null
  periods: Periods
  onCompareChange: (id: string | null) => void
  /** Indicador em destaque no mapa, para mostrar a posição do município nele. */
  indicator?: Indicator
}

type Shares = Record<(typeof SECTORS)[number]['key'], number>

function stateShares(municipios: Municipio[]): Shares {
  const agro = sum(municipios.map((m) => m.vaAgro))
  const ind = sum(municipios.map((m) => m.vaInd))
  const serv = sum(municipios.map((m) => m.vaServ))
  const adm = sum(municipios.map((m) => m.vaAdm))
  const t = agro + ind + serv + adm || 1
  return {
    shareAgro: (agro / t) * 100,
    shareInd: (ind / t) * 100,
    shareServ: (serv / t) * 100,
    shareAdm: (adm / t) * 100,
  }
}

export function Detail({ municipios, selected, compare, periods, onCompareChange, indicator }: Props) {
  const state = stateShares(municipios)
  const compareLabel = compare ? compare.nome : 'Mediana dos municípios'

  const chartData: { name: string; tone: string; shares: Shares }[] = [
    { name: selected.nome, tone: 'bg-rose-500', shares: pickShares(selected) },
    compare
      ? { name: compare.nome, tone: 'bg-sky-500', shares: pickShares(compare) }
      : { name: 'Estado inteiro', tone: 'bg-night-900/40 dark:bg-white/40', shares: state },
  ]

  const highlight = indicator ? rankBy(municipios, indicator) : null
  const highlightRank = highlight?.find((r) => r.m.id === selected.id)?.rank

  return (
    <section aria-labelledby="detalhe-titulo" className="card animate-rise flex h-full flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-400">
            <PinIcon className="h-3.5 w-3.5" />
            Município selecionado
          </p>
          <h2 id="detalhe-titulo" className="mt-1 font-display text-3xl font-semibold leading-tight tracking-tight">
            {selected.nome}
          </h2>
          <p className="mt-0.5 text-sm muted">{fmtRegiao(selected)}</p>
          {indicator && highlight && highlightRank && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-800 dark:text-rose-200">
              <strong className="font-semibold tabular-nums">{highlightRank}º</strong> de {highlight.length} em {indicator.label.toLowerCase()}
            </p>
          )}
        </div>
        <label className="w-full text-xs sm:w-56">
          <span className="mb-1 flex items-center gap-1.5 font-medium muted">
            <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden />
            Comparar com
          </span>
          <span className="relative block">
            <select
              value={compare?.id ?? ''}
              onChange={(e) => onCompareChange(e.target.value || null)}
              className="field cursor-pointer appearance-none py-2 pl-3 pr-9"
            >
              <option value="">Mediana dos {municipios.length} municípios</option>
              {municipios
                .filter((m) => m.id !== selected.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" />
          </span>
        </label>
      </div>

      <div className="scroll-thin -mx-1 mt-5 overflow-x-auto px-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider muted">
              <th className="pb-2 pr-2 font-medium">Indicador</th>
              <th className="pb-2 pr-2 text-right font-semibold text-rose-600 normal-case tracking-normal dark:text-rose-400">{selected.nome}</th>
              <th className="pb-2 pr-2 text-right font-semibold text-sky-600 normal-case tracking-normal dark:text-sky-400">{compareLabel}</th>
              <th className="pb-2 text-right font-medium">Posição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-night-900/[0.06] dark:divide-white/[0.06]">
            {INDICATORS.map((ind) => {
              const v = ind.get(selected)
              const other = compare ? ind.get(compare) : median(municipios.map(ind.get).filter((x): x is number => x != null))
              const ranked = rankBy(municipios, ind)
              const rank = ranked.find((r) => r.m.id === selected.id)?.rank
              const scale = Math.max(Math.abs(v ?? 0), Math.abs(other ?? 0)) || 1
              const active = ind.key === indicator?.key
              return (
                <tr key={ind.key} className={active ? 'bg-forest-500/[0.06]' : ''}>
                  <td className="py-2 pr-2">
                    <span className="block leading-tight">{ind.label}</span>
                    <span className="text-[11px] muted">{ind.period(periods)}</span>
                  </td>
                  <td className="py-2 pr-2 text-right align-top">
                    <span className="whitespace-nowrap font-semibold tabular-nums">{v == null ? '—' : ind.format(v)}</span>
                    <MiniBar pct={v == null ? 0 : (Math.abs(v) / scale) * 100} className="bg-rose-500" />
                  </td>
                  <td className="py-2 pr-2 text-right align-top">
                    <span className="whitespace-nowrap tabular-nums muted">{other == null ? '—' : ind.format(other)}</span>
                    <MiniBar pct={other == null ? 0 : (Math.abs(other) / scale) * 100} className="bg-sky-500" />
                  </td>
                  <td className="py-2 text-right align-top">
                    {rank ? (
                      <span
                        className={`inline-block min-w-9 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${
                          rank <= Math.ceil(ranked.length / 10)
                            ? 'bg-forest-500/15 text-forest-800 dark:text-forest-200'
                            : 'bg-night-900/[0.05] text-night-900/60 dark:bg-white/[0.06] dark:text-sand-100/60'
                        }`}
                      >
                        {rank}º
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t border-night-900/[0.06] pt-5 dark:border-white/[0.06]">
        <h3 className="font-display text-lg font-semibold tracking-tight">De onde vem a riqueza</h3>
        <p className="text-xs muted">Valor adicionado por setor, {periods.va}</p>
        <div
          className="mt-3 space-y-3"
          role="img"
          aria-label={`Composição setorial: ${chartData.map((d) => `${d.name}: ${SECTORS.map((s) => `${s.label} ${fmtPct(d.shares[s.key])}`).join(', ')}`).join('; ')}`}
        >
          {chartData.map((d) => (
            <div key={d.name}>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                <span className={`h-2 w-2 rounded-full ${d.tone}`} aria-hidden />
                {d.name}
              </div>
              <div className="flex h-7 overflow-hidden rounded-lg bg-night-900/[0.05] dark:bg-white/[0.06]">
                {SECTORS.map((s) => {
                  const pct = d.shares[s.key]
                  return (
                    <span
                      key={s.key}
                      title={`${s.label}: ${fmtPct(pct)}`}
                      className="flex items-center justify-center overflow-hidden text-[11px] font-semibold text-night-950 transition-[width] duration-700 ease-out [&:not(:last-child)]:border-r [&:not(:last-child)]:border-white/40 dark:[&:not(:last-child)]:border-night-900/40"
                      style={{ width: `${pct}%`, background: SECTOR_COLORS[s.id] }}
                    >
                      {pct >= 9 && <span>{Math.round(pct)}%</span>}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs muted">
          {SECTORS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SECTOR_COLORS[s.id] }} />
              {s.label}
            </li>
          ))}
        </ul>
        {!compare && (
          <p className="mt-3 text-xs muted">
            Sem município de comparação, a tabela mostra a mediana dos municípios (o município típico) e o gráfico mostra a
            composição da economia do estado inteiro.
          </p>
        )}
      </div>
    </section>
  )
}

function MiniBar({ pct, className }: { pct: number; className: string }) {
  return (
    <span aria-hidden className="ml-auto mt-1 block h-1 w-16 overflow-hidden rounded-full bg-night-900/[0.05] dark:bg-white/[0.06]">
      <span className={`ml-auto block h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${pct}%` }} />
    </span>
  )
}

function pickShares(m: Municipio): Shares {
  return {
    shareAgro: m.shareAgro ?? 0,
    shareInd: m.shareInd ?? 0,
    shareServ: m.shareServ ?? 0,
    shareAdm: m.shareAdm ?? 0,
  }
}
