import type { Municipio } from './types'

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const fmtInt = (v: number) => nf0.format(v)
export const fmtDec = (v: number) => nf1.format(v)
export const fmtPct = (v: number) => `${nf1.format(v)}%`
export const fmtSignedPct = (v: number) => `${v > 0 ? '+' : ''}${nf1.format(v)}%`
export const fmtDensity = (v: number) => `${v < 10 ? nf2.format(v) : nf1.format(v)} hab/km²`

/** "10 de novembro de 2026", no fuso de Manaus. */
export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Manaus' }).format(new Date(iso))

export const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

/** Compacta valores em reais: 1,2 mi / 3,4 bi */
export function fmtBRLCompact(reais: number): string {
  const abs = Math.abs(reais)
  if (abs >= 1e9) return `R$ ${nf1.format(reais / 1e9)} bi`
  if (abs >= 1e6) return `R$ ${nf1.format(reais / 1e6)} mi`
  if (abs >= 1e3) return `R$ ${nf0.format(reais / 1e3)} mil`
  return `R$ ${nf0.format(reais)}`
}

export const fmtCompact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

/** "Microrregião: Manaus · Mesorregião: Centro Amazonense", omitindo o que o IBGE não informou. */
export const fmtRegiao = (m: Pick<Municipio, 'microrregiao' | 'mesorregiao'>) =>
  [
    m.microrregiao !== '—' && `Microrregião: ${m.microrregiao}`,
    m.mesorregiao !== '—' && `Mesorregião: ${m.mesorregiao}`,
  ]
    .filter(Boolean)
    .join(' · ')
