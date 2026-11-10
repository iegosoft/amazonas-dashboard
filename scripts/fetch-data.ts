/**
 * Coleta os dados do IBGE, valida e grava em public/data/ só se tudo estiver certo.
 *
 *   npm run data                      grava em public/data/
 *   npm run data -- --out <pasta>     grava em outra pasta
 *   npm run data -- --summary <md>    também escreve um resumo em Markdown
 *   npm run data -- --force           grava mesmo sem mudanças (renova fetchedAt)
 *
 * Saída: 0 = dados válidos (gravados se mudaram) · 1 = falha (nada é gravado).
 * No GitHub Actions, escreve changed=true|false em $GITHUB_OUTPUT.
 */
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { assembleDataset, fetchRaw } from '../src/lib/ibge'
import type { Dataset, DataFile, MunGeo } from '../src/lib/types'
import { checkRaw, describeChanges, validateDataset } from '../src/lib/validate'

const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: 'public/data' },
    summary: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
})
const outDir = path.resolve(args.out!)
const files = { data: path.join(outDir, 'municipios.json'), geo: path.join(outDir, 'malha.json') }

async function readPrevious(): Promise<Dataset | undefined> {
  try {
    const data = JSON.parse(await readFile(files.data, 'utf8')) as DataFile
    const geo = JSON.parse(await readFile(files.geo, 'utf8')) as MunGeo
    return { municipios: data.municipios, periods: data.periods, geo }
  } catch {
    return undefined
  }
}

const summaryLines: string[] = []
const log = (line = '') => {
  console.log(line)
  summaryLines.push(line)
}

async function finish(code: 0 | 1, changed: boolean): Promise<never> {
  if (args.summary) await writeFile(args.summary, summaryLines.join('\n') + '\n')
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`)
  process.exit(code)
}

function fail(title: string, errors: string[]): Promise<never> {
  log(`## ❌ ${title}`)
  log()
  for (const e of errors) log(`- ${e}`)
  log()
  log('Nada foi gravado; os dados publicados continuam os anteriores.')
  return finish(1, false)
}

const prev = await readPrevious()

let next: Dataset
try {
  const raw = await fetchRaw(AbortSignal.timeout(60_000))
  const formatErrors = checkRaw(raw)
  if (formatErrors.length) await fail('Formato inesperado na resposta do IBGE', formatErrors)
  next = assembleDataset(raw)
} catch (e) {
  await fail('Não foi possível buscar os dados do IBGE', [e instanceof Error ? e.message : String(e)])
  throw e // inalcançável: fail() encerra o processo
}

const report = validateDataset(next, prev)
if (report.errors.length) await fail('Os dados não passaram na validação', report.errors)

const changed =
  args.force ||
  !prev ||
  JSON.stringify({ p: prev.periods, m: prev.municipios }) !== JSON.stringify({ p: next.periods, m: next.municipios }) ||
  JSON.stringify(prev.geo) !== JSON.stringify(next.geo)

if (!changed) {
  log('## ✅ Dados do IBGE sem alterações')
  log()
  log(`Períodos: população ${next.periods.pop} · Censo ${next.periods.censo} · PIB ${next.periods.pib} · setores ${next.periods.va}`)
} else {
  const file: DataFile = {
    schemaVersion: 1,
    fetchedAt: new Date().toISOString(),
    periods: next.periods,
    municipios: next.municipios,
  }
  await mkdir(outDir, { recursive: true })
  await writeFile(files.data, JSON.stringify(file, null, 2) + '\n')
  await writeFile(files.geo, JSON.stringify(next.geo) + '\n')

  log('## ✅ Dados do IBGE atualizados')
  log()
  const lines = describeChanges(prev, next)
  if (!lines.length) lines.push('Republicação manual: os dados não mudaram desde a última coleta.')
  for (const line of lines) log(`- ${line}`)
  log()
  log(`Períodos: população ${next.periods.pop} · Censo ${next.periods.censo} · PIB ${next.periods.pib} · setores ${next.periods.va}`)
}

if (report.warnings.length) {
  log()
  log('### ⚠️ Avisos')
  for (const w of report.warnings) log(`- ${w}`)
}

await finish(0, changed)
