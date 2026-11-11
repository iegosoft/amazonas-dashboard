import type React from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { loadDataset } from './lib/data'
import type { PublishedDataset } from './lib/types'

export type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: PublishedDataset }

export function useDataset(): [DataState, () => void] {
  const [state, setState] = useState<DataState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    loadDataset(ctrl.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Falha ao carregar os dados.' })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return [state, retry]
}

export function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('painel-am:theme')
      if (saved) return saved === 'dark'
    } catch {
      /* ignora */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('painel-am:theme', dark ? 'dark' : 'light')
    } catch {
      /* ignora */
    }
  }, [dark])

  return [dark, () => setDark((d) => !d)]
}

/** true depois que a página rolou além de `offset` pixels (para o cabeçalho ganhar fundo). */
export function useScrolled(offset = 24): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

/**
 * Anima um número do valor anterior (ou zero, na primeira vez) até `target`.
 * No servidor e com "reduzir movimento" ligado, mostra o valor final direto.
 */
export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(target)
  /** Último valor mostrado: a próxima animação parte dele. */
  const shown = useRef(0)

  const still = prefersReducedMotion() || typeof requestAnimationFrame === 'undefined'

  useLayoutEffect(() => {
    if (still) {
      shown.current = target
      return
    }
    const start = performance.now()
    const origin = shown.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      shown.current = origin + (target - origin) * (1 - Math.pow(1 - t, 3))
      setValue(shown.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    setValue(origin)
    raf = requestAnimationFrame(tick)
    // Aba em segundo plano pausa o requestAnimationFrame: garante o número final de qualquer jeito.
    const done = setTimeout(() => {
      cancelAnimationFrame(raf)
      shown.current = target
      setValue(target)
    }, duration + 150)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(done)
    }
  }, [target, duration, still])

  return still ? target : value
}

/** Largura atual de um elemento (para gráficos com texto em pixels nítidos). */
export function useElementWidth<T extends HTMLElement>(fallback = 800): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth || fallback)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, width]
}

/** Qual das seções está no meio da tela agora (para acender o item do menu). */
export function useScrollSpy(ids: string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return
    const els = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => e != null)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key, enabled])
  return active
}

/** true enquanto o elemento aparece na tela. */
export function useInView<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e?.isIntersecting ?? true), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, inView]
}
