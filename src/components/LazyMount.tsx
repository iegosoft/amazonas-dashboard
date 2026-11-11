import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Só monta o conteúdo quando ele chega perto da tela. Os gráficos mais pesados não entram
 * no primeiro carregamento da página.
 */
export function LazyMount({ children, minHeight, label }: { children: ReactNode; minHeight: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (show || !ref.current) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [show])

  if (show) return <>{children}</>
  return (
    <div ref={ref} aria-busy="true" aria-label={`Carregando ${label}`} className="card animate-pulse" style={{ minHeight }} />
  )
}
