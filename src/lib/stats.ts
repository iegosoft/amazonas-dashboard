import { quantile } from 'd3-array'
import type { Indicator } from './indicators'
import type { Municipio } from './types'

export interface Ranked {
  m: Municipio
  value: number
  rank: number
}

/** Ordena do maior para o menor ignorando municípios sem dado. */
export function rankBy(municipios: Municipio[], ind: Indicator): Ranked[] {
  return municipios
    .map((m) => ({ m, value: ind.get(m) }))
    .filter((r): r is { m: Municipio; value: number } => r.value != null)
    .sort((a, b) => b.value - a.value || a.m.nome.localeCompare(b.m.nome, 'pt-BR'))
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export function median(values: number[]): number | null {
  return values.length ? (quantile(values, 0.5) ?? null) : null
}

export interface Classes {
  /** Limites internos (n - 1 valores, crescentes e sem repetição) */
  breaks: number[]
  colors: string[]
  colorOf: (v: number | null) => string
  classOf: (v: number | null) => number
}

export const NO_DATA_COLOR = '#94a3b8'

/** Classes por quantis: cada cor cobre aproximadamente o mesmo número de municípios. */
export function classify(values: number[], interpolator: (t: number) => string, n = 6): Classes {
  const sorted = [...values].sort((a, b) => a - b)
  const raw = Array.from({ length: n - 1 }, (_, i) => quantile(sorted, (i + 1) / n) ?? 0)
  const breaks = raw.filter((b, i) => i === 0 || b > raw[i - 1])
  const k = breaks.length + 1
  const colors = Array.from({ length: k }, (_, i) => interpolator(0.18 + (k === 1 ? 0 : (i / (k - 1)) * 0.74)))

  const classOf = (v: number | null) => {
    if (v == null) return -1
    let c = 0
    while (c < breaks.length && v >= breaks[c]!) c++
    return c
  }
  return { breaks, colors, classOf, colorOf: (v) => (v == null ? NO_DATA_COLOR : colors[classOf(v)]!) }
}

/** Soma ponderada de uma lista (ignora nulos). */
export const sum = (xs: (number | null)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0)
