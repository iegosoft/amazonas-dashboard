/**
 * Baixa os dados publicados (branch `data` do repositório) para public/data/.
 * Roda antes do `dev` e do `build`, para o site sempre sair com os dados mais recentes.
 *
 *   npm run data:pull
 *   DATA_URL=<url base> npm run data:pull     usa outra origem
 *
 * Se o download falhar mas já houver dados locais, mantém os locais e só avisa.
 * Sem dados locais, sai com erro: o site nunca é gerado sem dados.
 */
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DATA_FILES } from '../src/lib/data'
import type { DataFile, MunGeo } from '../src/lib/types'
import { validateDataset } from '../src/lib/validate'

const BASE = process.env.DATA_URL ?? 'https://raw.githubusercontent.com/iegosoft/amazonas-dashboard/data/'
const out = (file: string) => path.resolve('public', file)

async function download<T>(file: string): Promise<{ text: string; json: T }> {
  const url = `${BASE}${path.basename(file)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`${res.status} em ${url}`)
  const text = await res.text()
  return { text, json: JSON.parse(text) as T }
}

const exists = (p: string) => access(p).then(() => true, () => false)

try {
  const [data, geo] = await Promise.all([download<DataFile>(DATA_FILES.data), download<MunGeo>(DATA_FILES.geo)])
  const { errors } = validateDataset({ municipios: data.json.municipios, periods: data.json.periods, geo: geo.json })
  if (data.json.schemaVersion !== 1) errors.unshift(`schemaVersion ${data.json.schemaVersion} desconhecido`)
  if (errors.length) throw new Error(`dados publicados inválidos:\n  - ${errors.join('\n  - ')}`)

  await mkdir(path.dirname(out(DATA_FILES.data)), { recursive: true })
  await writeFile(out(DATA_FILES.data), data.text)
  await writeFile(out(DATA_FILES.geo), geo.text)
  const p = data.json.periods
  console.log(`✅ Dados de ${data.json.fetchedAt.slice(0, 10)} (população ${p.pop} · Censo ${p.censo} · PIB ${p.pib} · setores ${p.va})`)
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  if ((await exists(out(DATA_FILES.data))) && (await exists(out(DATA_FILES.geo)))) {
    console.warn(`⚠️  Não foi possível baixar os dados publicados (${msg}). Usando os dados locais em public/data/.`)
  } else {
    console.error(`❌ Sem dados para o site: ${msg}\n   Rode \`npm run data\` para coletar direto do IBGE.`)
    process.exit(1)
  }
}
