import { interpolateBlues, interpolateGnBu, interpolateOranges, interpolatePuRd, interpolateYlGn } from 'd3-scale-chromatic'
import type { Municipio } from './types'
import { fmtBRL, fmtBRLCompact, fmtDensity, fmtInt, fmtPct, fmtSignedPct } from './format'

export type IndicatorKey =
  | 'popEst'
  | 'densidade'
  | 'crescimento'
  | 'pib'
  | 'pibPerCapita'
  | 'shareAgro'
  | 'shareInd'
  | 'shareServ'
  | 'shareAdm'

export interface Indicator {
  key: IndicatorKey
  group: 'Pessoas' | 'Economia' | 'Perfil econômico'
  label: string
  description: string
  get: (m: Municipio) => number | null
  format: (v: number) => string
  interpolator: (t: number) => string
}

export const INDICATORS: Indicator[] = [
  {
    key: 'popEst',
    group: 'Pessoas',
    label: 'População estimada',
    description: 'Estimativa mais recente do IBGE para o número de moradores.',
    get: (m) => m.popEst,
    format: fmtInt,
    interpolator: interpolateBlues,
  },
  {
    key: 'densidade',
    group: 'Pessoas',
    label: 'Densidade demográfica',
    description: 'Habitantes por km² no Censo 2022.',
    get: (m) => m.densidade,
    format: fmtDensity,
    interpolator: interpolateGnBu,
  },
  {
    key: 'crescimento',
    group: 'Pessoas',
    label: 'Crescimento desde o Censo 2022',
    description: 'Variação entre a população do Censo 2022 e a estimativa mais recente.',
    get: (m) => m.crescimento,
    format: fmtSignedPct,
    interpolator: interpolateYlGn,
  },
  {
    key: 'pib',
    group: 'Economia',
    label: 'PIB total',
    description: 'Produto Interno Bruto a preços correntes.',
    get: (m) => (m.pib == null ? null : m.pib * 1000),
    format: fmtBRLCompact,
    interpolator: interpolateOranges,
  },
  {
    key: 'pibPerCapita',
    group: 'Economia',
    label: 'PIB per capita',
    description: 'PIB dividido pela população do Censo 2022.',
    get: (m) => m.pibPerCapita,
    format: fmtBRL,
    interpolator: interpolatePuRd,
  },
  {
    key: 'shareAgro',
    group: 'Perfil econômico',
    label: 'Peso da agropecuária',
    description: '% da agropecuária no valor adicionado bruto do município.',
    get: (m) => m.shareAgro,
    format: fmtPct,
    interpolator: interpolateYlGn,
  },
  {
    key: 'shareInd',
    group: 'Perfil econômico',
    label: 'Peso da indústria',
    description: '% da indústria no valor adicionado bruto do município.',
    get: (m) => m.shareInd,
    format: fmtPct,
    interpolator: interpolateOranges,
  },
  {
    key: 'shareServ',
    group: 'Perfil econômico',
    label: 'Peso dos serviços',
    description: '% dos serviços privados no valor adicionado bruto do município.',
    get: (m) => m.shareServ,
    format: fmtPct,
    interpolator: interpolateBlues,
  },
  {
    key: 'shareAdm',
    group: 'Perfil econômico',
    label: 'Dependência do setor público',
    description: '% de administração, defesa, educação, saúde e seguridade públicas no valor adicionado.',
    get: (m) => m.shareAdm,
    format: fmtPct,
    interpolator: interpolatePuRd,
  },
]

export const INDICATOR_BY_KEY = Object.fromEntries(INDICATORS.map((i) => [i.key, i])) as Record<
  IndicatorKey,
  Indicator
>

export const isIndicatorKey = (v: string | null): v is IndicatorKey =>
  v != null && v in INDICATOR_BY_KEY

/** Cores distintas por setor, usadas no gráfico de composição e na legenda. */
export const SECTOR_COLORS = {
  agro: '#16a34a',
  ind: '#f97316',
  serv: '#2563eb',
  adm: '#a21caf',
} as const

export const SECTORS = [
  { key: 'shareAgro', id: 'agro', label: 'Agropecuária' },
  { key: 'shareInd', id: 'ind', label: 'Indústria' },
  { key: 'shareServ', id: 'serv', label: 'Serviços' },
  { key: 'shareAdm', id: 'adm', label: 'Setor público' },
] as const
