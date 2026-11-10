import { fmtDate } from './format'
import { INDICATORS, SOURCES, type Indicator } from './indicators'
import type { Ranked } from './stats'
import type { Municipio, Periods } from './types'

type Cell = string | number | null

/** BOM: faz o Excel reconhecer UTF-8 e mostrar os acentos certos. */
const BOM = '﻿'

/** Número com vírgula decimal e sem separador de milhar, como o Excel em português espera. */
const num = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',')

const cell = (v: Cell) => {
  if (v == null) return ''
  const s = typeof v === 'number' ? num(v) : v
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV no padrão do Excel em português: separador ";", vírgula decimal e BOM. */
export function toCsv(rows: Cell[][]): string {
  return BOM + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n'
}

const UNITS: Partial<Record<Indicator['key'], string>> = {
  popEst: 'habitantes',
  densidade: 'hab/km²',
  crescimento: '%',
  pib: 'R$',
  pibPerCapita: 'R$',
  shareAgro: '%',
  shareInd: '%',
  shareServ: '%',
  shareAdm: '%',
}

const header = (ind: Indicator, periods: Periods) => `${ind.label} (${UNITS[ind.key]}, ${ind.period(periods)})`

/** Primeira linha de todo arquivo: de onde vêm os dados e de quando são. */
const sourceLine = (fetchedAt: string, sources = Object.values(SOURCES)): Cell[] => [
  `Fonte: IBGE (${sources.map((s) => s.label).join('; ')}). Dados atualizados em ${fmtDate(fetchedAt)}. amazonas-dashboard.vercel.app`,
]

export function rankingCsv(ind: Indicator, ranking: Ranked[], periods: Periods, fetchedAt: string): string {
  return toCsv([
    sourceLine(fetchedAt, ind.sources),
    ['Posição', 'Código IBGE', 'Município', header(ind, periods)],
    ...ranking.map((r) => [r.rank, r.m.id, r.m.nome, r.value]),
  ])
}

export function municipiosCsv(municipios: Municipio[], periods: Periods, fetchedAt: string): string {
  return toCsv([
    sourceLine(fetchedAt),
    ['Código IBGE', 'Município', 'Microrregião', 'Mesorregião', ...INDICATORS.map((i) => header(i, periods))],
    ...[...municipios]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((m) => [m.id, m.nome, m.microrregiao, m.mesorregiao, ...INDICATORS.map((i) => i.get(m))]),
  ])
}

/** Dispara o download de um texto como arquivo. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
