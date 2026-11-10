import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildMunicipios, CACHE_KEY, clearCache, loadDataset, parseAgregado, rewindForD3, toNumber } from './ibge'
import { classify, rankBy } from './stats'
import { INDICATOR_BY_KEY } from './indicators'
import type { AgregadoVariavel, LocalidadeMunicipio } from './types'

const agregado = (id: string, rows: Record<string, Record<string, string>>): AgregadoVariavel[] => [
  {
    id,
    variavel: id,
    unidade: '',
    resultados: [
      {
        series: Object.entries(rows).map(([lid, serie]) => ({ localidade: { id: lid, nome: lid }, serie })),
      },
    ],
  },
]

const meta: LocalidadeMunicipio[] = [
  { id: 1, nome: 'A', microrregiao: { nome: 'Micro A', mesorregiao: { nome: 'Meso' } } },
  { id: 2, nome: 'B', microrregiao: null, 'regiao-imediata': { nome: 'Imediata B' } },
]

describe('toNumber', () => {
  it('converte números e trata marcadores do IBGE como nulo', () => {
    expect(toNumber('123')).toBe(123)
    expect(toNumber('-')).toBeNull()
    expect(toNumber('...')).toBeNull()
    expect(toNumber('X')).toBeNull()
    expect(toNumber(undefined)).toBeNull()
  })
})

describe('parseAgregado', () => {
  it('usa o período mais recente de cada município', () => {
    const parsed = parseAgregado(agregado('9324', { '1': { '2024': '10', '2025': '20' } }))
    expect(parsed['9324']?.get('1')).toEqual({ value: 20, period: '2025' })
  })
  it('volta para o ano anterior quando o mais recente ainda não foi divulgado', () => {
    const parsed = parseAgregado(agregado('513', { '1': { '2021': '7', '2022': '...', '2023': '...' } }))
    expect(parsed['513']?.get('1')).toEqual({ value: 7, period: '2021' })
  })
})

describe('buildMunicipios', () => {
  const pop = parseAgregado(agregado('9324', { '1': { '2026': '1100' }, '2': { '2026': '50' } }))
  const censo = {
    ...parseAgregado(agregado('93', { '1': { '2022': '1000' }, '2': { '2022': '40' } })),
    ...parseAgregado(agregado('614', { '1': { '2022': '10' }, '2': { '2022': '0.5' } })),
  }
  const pib = {
    ...parseAgregado(agregado('37', { '1': { '2023': '5000' }, '2': { '2023': '-' } })),
    ...parseAgregado(agregado('513', { '1': { '2021': '100', '2023': '...' } })),
    ...parseAgregado(agregado('517', { '1': { '2021': '300', '2023': '...' } })),
    ...parseAgregado(agregado('6575', { '1': { '2021': '400', '2023': '...' } })),
    ...parseAgregado(agregado('525', { '1': { '2021': '200', '2023': '...' } })),
  }
  const { municipios, periods } = buildMunicipios(meta, pop, censo, pib)

  it('calcula indicadores derivados', () => {
    const a = municipios[0]!
    expect(a.crescimento).toBeCloseTo(10)
    expect(a.pibPerCapita).toBeCloseTo(5000) // 5.000 mil reais ÷ 1.000 hab.
    expect(a.shareAgro).toBeCloseTo(10)
    expect(a.shareInd).toBeCloseTo(30)
    expect(a.shareServ).toBeCloseTo(40)
    expect(a.shareAdm).toBeCloseTo(20)
  })

  it('mantém nulos quando o IBGE não informa e usa fallback de região', () => {
    const b = municipios[1]!
    expect(b.pib).toBeNull()
    expect(b.pibPerCapita).toBeNull()
    expect(b.shareAgro).toBeNull()
    expect(b.microrregiao).toBe('Imediata B')
    expect(b.mesorregiao).toBe('—')
  })

  it('identifica os períodos', () => {
    expect(periods).toEqual({ pop: '2026', censo: '2022', pib: '2023', va: '2021' })
  })

  it('ranking ignora município sem dado e ordena do maior ao menor', () => {
    const r = rankBy(municipios, INDICATOR_BY_KEY.pib)
    expect(r.map((x) => x.m.nome)).toEqual(['A'])
    const r2 = rankBy(municipios, INDICATOR_BY_KEY.popEst)
    expect(r2.map((x) => [x.m.nome, x.rank])).toEqual([['A', 1], ['B', 2]])
  })
})

describe('rewindForD3', () => {
  it('inverte anéis anti-horários para o d3 não desenhar o planeta inteiro', () => {
    const ccw = [[-60, -3], [-59, -3], [-59, -2], [-60, -2], [-60, -3]]
    const geo = rewindForD3({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { codarea: '1' }, geometry: { type: 'Polygon', coordinates: [ccw] } }],
    })
    const g = geo.features[0]!.geometry
    expect(g.type === 'Polygon' && g.coordinates[0]).toEqual([...ccw].reverse())
  })
})

describe('classify', () => {
  it('divide em classes por quantis e trata nulo como sem dados', () => {
    const c = classify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], () => '#000', 4)
    expect(c.breaks).toHaveLength(3)
    expect(c.classOf(1)).toBe(0)
    expect(c.classOf(12)).toBe(3)
    expect(c.classOf(null)).toBe(-1)
  })
  it('remove limites repetidos quando há muitos valores iguais', () => {
    const c = classify([1, 1, 1, 1, 1, 1, 1, 1, 9], () => '#000', 6)
    expect(new Set(c.breaks).size).toBe(c.breaks.length)
  })
})

describe('clearCache', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('apaga a mesma chave que o carregamento usa, forçando nova busca', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    })
    const fetchMock = vi.fn(() => Promise.reject(new Error('sem rede')))
    vi.stubGlobal('fetch', fetchMock)
    const cached = { municipios: [], periods: { pop: '', censo: '', pib: '', va: '' }, geo: { type: 'FeatureCollection', features: [] } }
    store.set(CACHE_KEY, JSON.stringify({ at: Date.now(), data: cached }))

    await expect(loadDataset()).resolves.toEqual(cached)
    expect(fetchMock).not.toHaveBeenCalled()

    clearCache()
    await expect(loadDataset()).rejects.toThrow('sem rede')
    expect(fetchMock).toHaveBeenCalled()
  })
})
