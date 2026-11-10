import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson'

export interface Municipio {
  id: string
  nome: string
  mesorregiao: string
  microrregiao: string
  /** População estimada (período mais recente disponível) */
  popEst: number | null
  /** População do Censo 2022 */
  popCenso: number | null
  /** hab/km² (Censo 2022) */
  densidade: number | null
  /** PIB a preços correntes, em mil reais */
  pib: number | null
  vaAgro: number | null
  vaInd: number | null
  vaServ: number | null
  vaAdm: number | null
  /** R$ por habitante (PIB ÷ população do Censo 2022) */
  pibPerCapita: number | null
  /** % de variação entre Censo 2022 e a estimativa mais recente */
  crescimento: number | null
  /** Participação no valor adicionado bruto (%) */
  shareAgro: number | null
  shareInd: number | null
  shareServ: number | null
  shareAdm: number | null
}

export interface Periods {
  pop: string
  censo: string
  pib: string
  /** Ano do valor adicionado por setor (sai depois do PIB total) */
  va: string
}

export type MunGeo = FeatureCollection<Polygon | MultiPolygon, { codarea: string }>

export interface Dataset {
  municipios: Municipio[]
  periods: Periods
  geo: MunGeo
}

/** Resposta da API de agregados do IBGE (apenas o que usamos). */
export interface AgregadoVariavel {
  id: string
  variavel: string
  unidade: string
  resultados: {
    series: { localidade: { id: string; nome: string }; serie: Record<string, string> }[]
  }[]
}

export interface LocalidadeMunicipio {
  id: number
  nome: string
  microrregiao?: { nome: string; mesorregiao?: { nome: string } } | null
  'regiao-imediata'?: { nome: string } | null
}

/** Dataset como o site recebe: inclui quando os dados publicados mudaram pela última vez. */
export interface PublishedDataset extends Dataset {
  fetchedAt: string
}

/** Arquivo public/data/municipios.json gerado por `npm run data`. A malha fica em malha.json. */
export interface DataFile {
  schemaVersion: 1
  /** Quando os dados publicados mudaram pela última vez (ISO 8601). */
  fetchedAt: string
  periods: Periods
  municipios: Municipio[]
}
