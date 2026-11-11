import { interpolateBlues, interpolateGnBu, interpolateOranges, interpolatePuRd, interpolateYlGn } from 'd3-scale-chromatic'
import type { Municipio, Periods } from './types'
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

export interface Source {
  label: string
  url: string
}

/** Tabelas do IBGE de onde vêm os dados (SIDRA). */
export const SOURCES = {
  estimativas: { label: 'Estimativas de População (tabela 6579)', url: 'https://sidra.ibge.gov.br/tabela/6579' },
  censo: { label: 'Censo Demográfico 2022 (tabela 4714)', url: 'https://sidra.ibge.gov.br/tabela/4714' },
  pib: { label: 'PIB dos Municípios (tabela 5938)', url: 'https://sidra.ibge.gov.br/tabela/5938' },
} satisfies Record<string, Source>

export interface Indicator {
  key: IndicatorKey
  group: 'Pessoas' | 'Economia' | 'Perfil econômico'
  label: string
  description: string
  get: (m: Municipio) => number | null
  format: (v: number) => string
  interpolator: (t: number) => string
  sources: Source[]
  /** Ano (ou intervalo) de referência do dado. */
  period: (p: Periods) => string
  /** Como o número é obtido, com tabelas e variáveis do IBGE (seção "Sobre os dados"). */
  method: string
  /** Aviso quando o indicador combina dados de anos diferentes. */
  note?: (p: Periods) => string | null
}

const vaNote = (p: Periods) =>
  p.va !== p.pib ? `O IBGE ainda não divulgou a divisão por setor de ${p.pib}; usamos ${p.va}, o ano mais recente disponível.` : null

export const INDICATORS: Indicator[] = [
  {
    key: 'popEst',
    group: 'Pessoas',
    label: 'População estimada',
    description: 'Estimativa mais recente do IBGE para o número de moradores.',
    get: (m) => m.popEst,
    format: fmtInt,
    interpolator: interpolateBlues,
    sources: [SOURCES.estimativas],
    period: (p) => p.pop,
    method:
      'Estimativa da população residente publicada anualmente pelo IBGE (tabela 6579, variável 9324). É uma projeção, revisada a cada novo Censo.',
  },
  {
    key: 'densidade',
    group: 'Pessoas',
    label: 'Densidade demográfica',
    description: 'Habitantes por km² no Censo 2022.',
    get: (m) => m.densidade,
    format: fmtDensity,
    interpolator: interpolateGnBu,
    sources: [SOURCES.censo],
    period: (p) => p.censo,
    method:
      'Moradores por quilômetro quadrado no Censo Demográfico 2022 (tabela 4714, variável 614), como divulgado pelo IBGE.',
  },
  {
    key: 'crescimento',
    group: 'Pessoas',
    label: 'Crescimento desde o Censo 2022',
    description: 'Variação entre a população do Censo 2022 e a estimativa mais recente.',
    get: (m) => m.crescimento,
    format: fmtSignedPct,
    interpolator: interpolateYlGn,
    sources: [SOURCES.censo, SOURCES.estimativas],
    period: (p) => `${p.censo}–${p.pop}`,
    method:
      '(estimativa de população mais recente ÷ população do Censo 2022 − 1) × 100. Usa a tabela 6579 (variável 9324) e a tabela 4714 (variável 93).',
  },
  {
    key: 'pib',
    group: 'Economia',
    label: 'PIB total',
    description: 'Produto Interno Bruto a preços correntes.',
    get: (m) => (m.pib == null ? null : m.pib * 1000),
    format: fmtBRLCompact,
    interpolator: interpolateOranges,
    sources: [SOURCES.pib],
    period: (p) => p.pib,
    method:
      'Produto Interno Bruto a preços correntes (tabela 5938, variável 37). O IBGE divulga em mil reais; o painel mostra em reais.',
  },
  {
    key: 'pibPerCapita',
    group: 'Economia',
    label: 'PIB per capita',
    description: 'PIB dividido pela população do Censo 2022.',
    get: (m) => m.pibPerCapita,
    format: fmtBRL,
    interpolator: interpolatePuRd,
    sources: [SOURCES.pib, SOURCES.censo],
    period: (p) => p.pib,
    method:
      'PIB a preços correntes (tabela 5938, variável 37) ÷ população do Censo 2022 (tabela 4714, variável 93). O PIB per capita oficial do IBGE usa a estimativa de população do mesmo ano do PIB, por isso os valores podem diferir um pouco.',
    note: (p) => (p.pib !== p.censo ? `Combina o PIB de ${p.pib} com a população do Censo ${p.censo}.` : null),
  },
  {
    key: 'shareAgro',
    group: 'Perfil econômico',
    label: 'Peso da agropecuária',
    description: '% da agropecuária no valor adicionado bruto do município.',
    get: (m) => m.shareAgro,
    format: fmtPct,
    interpolator: interpolateYlGn,
    sources: [SOURCES.pib],
    period: (p) => p.va,
    method:
      'Valor adicionado bruto da agropecuária (variável 513) dividido pela soma do valor adicionado dos quatro setores (variáveis 513, 517, 6575 e 525), em porcentagem. Os impostos sobre produtos não entram na conta.',
    note: vaNote,
  },
  {
    key: 'shareInd',
    group: 'Perfil econômico',
    label: 'Peso da indústria',
    description: '% da indústria no valor adicionado bruto do município.',
    get: (m) => m.shareInd,
    format: fmtPct,
    interpolator: interpolateOranges,
    sources: [SOURCES.pib],
    period: (p) => p.va,
    method:
      'Valor adicionado bruto da indústria (variável 517) dividido pela soma do valor adicionado dos quatro setores (variáveis 513, 517, 6575 e 525), em porcentagem. Os impostos sobre produtos não entram na conta.',
    note: vaNote,
  },
  {
    key: 'shareServ',
    group: 'Perfil econômico',
    label: 'Peso dos serviços',
    description: '% dos serviços privados no valor adicionado bruto do município.',
    get: (m) => m.shareServ,
    format: fmtPct,
    interpolator: interpolateBlues,
    sources: [SOURCES.pib],
    period: (p) => p.va,
    method:
      'Valor adicionado bruto dos serviços, exceto administração pública, (variável 6575) dividido pela soma do valor adicionado dos quatro setores (variáveis 513, 517, 6575 e 525), em porcentagem. Os impostos sobre produtos não entram na conta.',
    note: vaNote,
  },
  {
    key: 'shareAdm',
    group: 'Perfil econômico',
    label: 'Dependência do setor público',
    description: '% de administração, defesa, educação, saúde e seguridade públicas no valor adicionado.',
    get: (m) => m.shareAdm,
    format: fmtPct,
    interpolator: interpolatePuRd,
    sources: [SOURCES.pib],
    period: (p) => p.va,
    method:
      'Valor adicionado bruto da administração, defesa, educação e saúde públicas e seguridade social (variável 525) dividido pela soma do valor adicionado dos quatro setores (variáveis 513, 517, 6575 e 525), em porcentagem. Os impostos sobre produtos não entram na conta.',
    note: vaNote,
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
  agro: 'var(--sector-agro)',
  ind: 'var(--sector-ind)',
  serv: 'var(--sector-serv)',
  adm: 'var(--sector-adm)',
} as const

export const SECTORS = [
  { key: 'shareAgro', id: 'agro', label: 'Agropecuária' },
  { key: 'shareInd', id: 'ind', label: 'Indústria' },
  { key: 'shareServ', id: 'serv', label: 'Serviços' },
  { key: 'shareAdm', id: 'adm', label: 'Setor público' },
] as const
