/**
 * Proxy restrito para a API do IBGE, executado na Vercel em São Paulo (vercel.json → regions).
 *
 * Existe porque o IBGE recusa conexões vindas de fora do Brasil, e a coleta automática
 * roda no GitHub Actions (EUA). Para não virar um proxy aberto, só repassa GETs para
 * https://servicodados.ibge.gov.br/api/ e exige o token COLETA_TOKEN.
 *
 *   GET /api/ibge?url=<endereço da API do IBGE>
 *   Authorization: Bearer <COLETA_TOKEN>
 */
import { timingSafeEqual } from 'node:crypto'

const IBGE_ORIGIN = 'https://servicodados.ibge.gov.br'

function authorized(header: string | null, token: string | undefined): boolean {
  if (!token || !header?.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice('Bearer '.length))
  const expected = Buffer.from(token)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

function allowedTarget(raw: string | null): URL | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.origin === IBGE_ORIGIN && url.pathname.startsWith('/api/') && !url.username && !url.password ? url : null
  } catch {
    return null
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request.headers.get('authorization'), process.env.COLETA_TOKEN))
    return Response.json({ erro: 'não autorizado' }, { status: 401 })

  const target = allowedTarget(new URL(request.url).searchParams.get('url'))
  if (!target) return Response.json({ erro: `só são aceitos endereços de ${IBGE_ORIGIN}/api/` }, { status: 400 })

  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(25_000) })
    return new Response(res.body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json', 'cache-control': 'no-store' },
    })
  } catch (e) {
    const cause = e instanceof Error ? ((e.cause as { code?: string } | undefined)?.code ?? e.message) : String(e)
    return Response.json({ erro: `IBGE sem resposta: ${cause}` }, { status: 502 })
  }
}
