import { afterEach, describe, expect, it, vi } from 'vitest'
import { DATA_FILES, loadDataset } from './data'

const file = { schemaVersion: 1, fetchedAt: '2026-11-10T00:00:00Z', periods: { pop: '2026', censo: '2022', pib: '2023', va: '2021' }, municipios: [] }
const geo = { type: 'FeatureCollection', features: [] }

function serve(files: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = url.replace('/base/', '')
    if (!(path in files)) return new Response('', { status: 404 })
    const body = files[path]
    return new Response(typeof body === 'string' ? body : JSON.stringify(body))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('loadDataset', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('lê os dois arquivos publicados com o site, sem chamar o IBGE', async () => {
    const fetchMock = serve({ [DATA_FILES.data]: file, [DATA_FILES.geo]: geo })
    await expect(loadDataset(undefined, '/base/')).resolves.toEqual({ municipios: [], periods: file.periods, geo })
    expect(fetchMock.mock.calls.map(([u]) => u)).toEqual([`/base/${DATA_FILES.data}`, `/base/${DATA_FILES.geo}`])
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('ibge.gov.br'))).toBe(false)
  })

  it('explica quando um arquivo está faltando ou corrompido', async () => {
    serve({ [DATA_FILES.data]: file })
    await expect(loadDataset(undefined, '/base/')).rejects.toThrow('indisponível (404): data/malha.json')
    serve({ [DATA_FILES.data]: '{quebrado', [DATA_FILES.geo]: geo })
    await expect(loadDataset(undefined, '/base/')).rejects.toThrow('corrompido: data/municipios.json')
  })

  it('recusa um formato de arquivo que não conhece', async () => {
    serve({ [DATA_FILES.data]: { ...file, schemaVersion: 2 }, [DATA_FILES.geo]: geo })
    await expect(loadDataset(undefined, '/base/')).rejects.toThrow('formato desconhecido')
  })
})
