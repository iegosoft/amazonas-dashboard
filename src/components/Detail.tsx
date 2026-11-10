import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtPct } from '../lib/format'
import { INDICATORS, SECTORS, SECTOR_COLORS } from '../lib/indicators'
import { median, rankBy, sum } from '../lib/stats'
import type { Municipio, Periods } from '../lib/types'

interface Props {
  municipios: Municipio[]
  selected: Municipio
  compare: Municipio | null
  periods: Periods
  onCompareChange: (id: string | null) => void
}

function stateShares(municipios: Municipio[]) {
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

export function Detail({ municipios, selected, compare, periods, onCompareChange }: Props) {
  const state = stateShares(municipios)
  const compareLabel = compare ? compare.nome : 'Mediana do AM'

  const chartData = [
    { name: selected.nome, ...pickShares(selected) },
    compare ? { name: compare.nome, ...pickShares(compare) } : { name: 'Amazonas (total)', ...state },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">Município selecionado</p>
          <h2 className="text-2xl font-bold leading-tight">{selected.nome}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selected.microrregiao} · {selected.mesorregiao}
          </p>
        </div>
        <label className="text-xs text-slate-500 dark:text-slate-400">
          <span className="mb-1 block font-medium">Comparar com</span>
          <select
            value={compare?.id ?? ''}
            onChange={(e) => onCompareChange(e.target.value || null)}
            className="w-44 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Mediana do Amazonas</option>
            {municipios
              .filter((m) => m.id !== selected.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-1.5 pr-2 font-medium">Indicador</th>
              <th className="py-1.5 pr-2 text-right font-medium text-rose-600 dark:text-rose-400">{selected.nome}</th>
              <th className="py-1.5 pr-2 text-right font-medium text-sky-600 dark:text-sky-400">{compareLabel}</th>
              <th className="py-1.5 text-right font-medium">Posição</th>
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((ind) => {
              const v = ind.get(selected)
              const other = compare ? ind.get(compare) : median(municipios.map(ind.get).filter((x): x is number => x != null))
              const rank = rankBy(municipios, ind).find((r) => r.m.id === selected.id)?.rank
              return (
                <tr key={ind.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-1.5 pr-2 text-slate-600 dark:text-slate-300">{ind.label}</td>
                  <td className="py-1.5 pr-2 text-right font-semibold tabular-nums">{v == null ? '—' : ind.format(v)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {other == null ? '—' : ind.format(other)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-500">{rank ? `${rank}º` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h3 className="mt-5 text-sm font-semibold">De onde vem a riqueza (valor adicionado, {periods.va})</h3>
      <div className="mt-2 h-40" role="img" aria-label={`Composição setorial: ${chartData.map((d) => `${d.name}: ${SECTORS.map((s) => `${s.label} ${fmtPct(d[s.key])}`).join(', ')}`).join('; ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 4 }} barCategoryGap={14}>
            <CartesianGrid horizontal={false} stroke="currentColor" strokeOpacity={0.12} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: 'currentColor' }} stroke="currentColor" strokeOpacity={0.3} />
            <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12, fill: 'currentColor' }} stroke="currentColor" strokeOpacity={0.3} />
            <Tooltip
              cursor={{ fill: 'currentColor', fillOpacity: 0.06 }}
              formatter={(v) => fmtPct(Number(v))}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            {SECTORS.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={SECTOR_COLORS[s.id]} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
        {SECTORS.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SECTOR_COLORS[s.id] }} />
            {s.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

function pickShares(m: Municipio) {
  return {
    shareAgro: m.shareAgro ?? 0,
    shareInd: m.shareInd ?? 0,
    shareServ: m.shareServ ?? 0,
    shareAdm: m.shareAdm ?? 0,
  }
}
