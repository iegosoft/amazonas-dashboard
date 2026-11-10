import type { Dataset, DataFile, MunGeo } from './types'

/** Arquivos gerados por `npm run data` e publicados junto com o site. */
export const DATA_FILES = { data: 'data/municipios.json', geo: 'data/malha.json' } as const

async function getJson<T>(base: string, file: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${base}${file}`, { signal })
  if (!res.ok) throw new Error(`Arquivo de dados indisponível (${res.status}): ${file}`)
  try {
    return (await res.json()) as T
  } catch {
    throw new Error(`Arquivo de dados corrompido: ${file}`)
  }
}

/**
 * Carrega os dados já coletados e validados, servidos pelo próprio site.
 * O navegador não fala com o IBGE: se a API deles cair, o painel continua no ar.
 */
export async function loadDataset(signal?: AbortSignal, base = import.meta.env.BASE_URL): Promise<Dataset> {
  const [file, geo] = await Promise.all([
    getJson<DataFile>(base, DATA_FILES.data, signal),
    getJson<MunGeo>(base, DATA_FILES.geo, signal),
  ])
  if (file?.schemaVersion !== 1 || !Array.isArray(file.municipios) || !Array.isArray(geo?.features))
    throw new Error('Arquivo de dados em formato desconhecido.')
  return { municipios: file.municipios, periods: file.periods, geo }
}
