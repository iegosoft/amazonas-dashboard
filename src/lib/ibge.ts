import { geoArea } from 'd3-geo'
import type {
  AgregadoVariavel,
  Dataset,
  LocalidadeMunicipio,
  MunGeo,
  Municipio,
  Periods,
} from './types'

const API = 'https://servicodados.ibge.gov.br/api'
const UF_AM = 13
const ALL_AM = `N6[N3[${UF_AM}]]`

export const ENDPOINTS = {
  /** Estimativas de população (tabela 6579, variável 9324) */
  pop: `${API}/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=${ALL_AM}`,
  /** Censo 2022: população residente (93) e densidade demográfica (614) */
  censo: `${API}/v3/agregados/4714/periodos/2022/variaveis/93|614?localidades=${ALL_AM}`,
  /**
   * PIB dos municípios: PIB (37) e valor adicionado por setor (513, 517, 6575, 525).
   * Pede vários anos porque o IBGE divulga o PIB total antes da abertura por setor.
   */
  pib: `${API}/v3/agregados/5938/periodos/-5/variaveis/37|513|517|6575|525?localidades=${ALL_AM}`,
  municipios: `${API}/v1/localidades/estados/${UF_AM}/municipios`,
  malha: `${API}/v3/malhas/estados/${UF_AM}?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`,
}

export interface ParsedValue {
  value: number | null
  period: string
}
/** variável → (id do município → valor) */
export type ParsedAgregado = Record<string, Map<string, ParsedValue>>

/** Converte o texto do IBGE ("123", "-", "...", "X") em número ou null. */
export function toNumber(raw: string | undefined): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Pega o período mais recente com valor numérico de cada município. */
export function parseAgregado(json: AgregadoVariavel[]): ParsedAgregado {
  const out: ParsedAgregado = {}
  for (const variavel of json) {
    const map = new Map<string, ParsedValue>()
    for (const { localidade, serie } of variavel.resultados[0]?.series ?? []) {
      const periods = Object.keys(serie).sort().reverse()
      const period = periods.find((p) => toNumber(serie[p]) != null) ?? periods[0]
      if (period === undefined) continue
      map.set(localidade.id, { value: toNumber(serie[period]), period })
    }
    out[variavel.id] = map
  }
  return out
}

const latestPeriod = (...maps: Map<string, ParsedValue>[]): string => {
  let best = ''
  for (const m of maps) for (const v of m.values()) if (v.value != null && v.period > best) best = v.period
  return best
}

const pct = (part: number | null, total: number): number | null =>
  part == null || total <= 0 ? null : (part / total) * 100

export function buildMunicipios(
  meta: LocalidadeMunicipio[],
  pop: ParsedAgregado,
  censo: ParsedAgregado,
  pib: ParsedAgregado,
): { municipios: Municipio[]; periods: Periods } {
  const val = (a: ParsedAgregado, variavel: string, id: string) =>
    a[variavel]?.get(id)?.value ?? null

  const municipios = meta.map((m): Municipio => {
    const id = String(m.id)
    const popEst = val(pop, '9324', id)
    const popCenso = val(censo, '93', id)
    const pibMil = val(pib, '37', id)
    const vaAgro = val(pib, '513', id)
    const vaInd = val(pib, '517', id)
    const vaServ = val(pib, '6575', id)
    const vaAdm = val(pib, '525', id)
    const vab = (vaAgro ?? 0) + (vaInd ?? 0) + (vaServ ?? 0) + (vaAdm ?? 0)

    return {
      id,
      nome: m.nome,
      mesorregiao: m.microrregiao?.mesorregiao?.nome ?? '—',
      microrregiao: m.microrregiao?.nome ?? m['regiao-imediata']?.nome ?? '—',
      popEst,
      popCenso,
      densidade: val(censo, '614', id),
      pib: pibMil,
      vaAgro,
      vaInd,
      vaServ,
      vaAdm,
      pibPerCapita: pibMil != null && popCenso ? (pibMil * 1000) / popCenso : null,
      crescimento: popEst != null && popCenso ? (popEst / popCenso - 1) * 100 : null,
      shareAgro: pct(vaAgro, vab),
      shareInd: pct(vaInd, vab),
      shareServ: pct(vaServ, vab),
      shareAdm: pct(vaAdm, vab),
    }
  })

  return {
    municipios,
    periods: {
      pop: latestPeriod(pop['9324'] ?? new Map()),
      censo: latestPeriod(censo['93'] ?? new Map()),
      pib: latestPeriod(pib['37'] ?? new Map()),
      va: latestPeriod(pib['513'] ?? new Map()),
    },
  }
}

/**
 * A malha do IBGE segue o GeoJSON (anel externo anti-horário), mas o d3-geo espera
 * o sentido horário; sem inverter, cada município vira "a Terra inteira menos ele".
 */
export function rewindForD3(geo: MunGeo): MunGeo {
  return {
    ...geo,
    features: geo.features.map((f) => {
      if (geoArea(f) <= 2 * Math.PI) return f
      const g = f.geometry
      const geometry =
        g.type === 'Polygon'
          ? { ...g, coordinates: g.coordinates.map((r) => [...r].reverse()) }
          : { ...g, coordinates: g.coordinates.map((p) => p.map((r) => [...r].reverse())) }
      return { ...f, geometry }
    }),
  }
}

/** "fetch failed" sozinho não diz nada: inclui a causa de rede (DNS, TLS, timeout...). */
function networkReason(e: unknown): string {
  const cause = e instanceof Error ? (e.cause as { code?: string; message?: string } | undefined) : undefined
  const detail = cause?.code ?? cause?.message
  const msg = e instanceof Error ? e.message : String(e)
  return detail ? `${msg} (${detail})` : msg
}

/**
 * Intermediário com IP brasileiro (api/ibge.ts na Vercel, região São Paulo).
 * O IBGE recusa conexões de fora do Brasil, como os servidores do GitHub Actions.
 */
export interface IbgeProxy {
  url: string
  token: string
}

async function getJson<T>(url: string, signal?: AbortSignal, proxy?: IbgeProxy): Promise<T> {
  const { pathname } = new URL(url)
  const via = proxy ? ' (via proxy)' : ''
  let res: Response
  try {
    res = proxy
      ? await fetch(`${proxy.url}?url=${encodeURIComponent(url)}`, { signal, headers: { authorization: `Bearer ${proxy.token}` } })
      : await fetch(url, { signal })
  } catch (e) {
    throw new Error(`Sem resposta do IBGE em ${pathname}${via}: ${networkReason(e)}`, { cause: e })
  }
  if (proxy && res.status === 401) throw new Error('O proxy recusou o token (401): confira IBGE_PROXY_TOKEN e COLETA_TOKEN')
  if (!res.ok) throw new Error(`IBGE respondeu ${res.status} em ${pathname}${via}`)
  return (await res.json()) as T
}

/** Respostas do IBGE como chegaram, antes de qualquer interpretação. */
export interface RawIbge {
  meta: LocalidadeMunicipio[]
  pop: AgregadoVariavel[]
  censo: AgregadoVariavel[]
  pib: AgregadoVariavel[]
  geo: MunGeo
}

export async function fetchRaw(signal?: AbortSignal, proxy?: IbgeProxy): Promise<RawIbge> {
  const [meta, pop, censo, pib, geo] = await Promise.all([
    getJson<LocalidadeMunicipio[]>(ENDPOINTS.municipios, signal, proxy),
    getJson<AgregadoVariavel[]>(ENDPOINTS.pop, signal, proxy),
    getJson<AgregadoVariavel[]>(ENDPOINTS.censo, signal, proxy),
    getJson<AgregadoVariavel[]>(ENDPOINTS.pib, signal, proxy),
    getJson<MunGeo>(ENDPOINTS.malha, signal, proxy),
  ])
  return { meta, pop, censo, pib, geo }
}

export function assembleDataset(raw: RawIbge): Dataset {
  const { municipios, periods } = buildMunicipios(
    raw.meta,
    parseAgregado(raw.pop),
    parseAgregado(raw.censo),
    parseAgregado(raw.pib),
  )
  return { municipios, periods, geo: rewindForD3(raw.geo) }
}
