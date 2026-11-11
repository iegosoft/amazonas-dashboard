import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/** Ícones em traço (estilo Lucide, licença ISC), sem dependência extra. */
function Svg({ className = 'h-4 w-4', children, ...rest }: IconProps & { children: ReactNode }) {
  return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        {...rest}
      >
        {children}
      </svg>
  )
}

export function SunIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>,</Svg>
}
export function MoonIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>
}
export function ShareIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.59 13.51 6.83 3.98m-.01-10.98-6.82 3.98" />
  </>,</Svg>
}
export function CheckIcon(p: IconProps) {
  return <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>
}
export function DownloadIcon(p: IconProps) {
  return <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" /></Svg>
}
export function SearchIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m21 21-4.3-4.3" />
  </>,</Svg>
}
export function SortIcon(p: IconProps) {
  return <Svg {...p}><path d="m21 16-4 4-4-4m4 4V4M3 8l4-4 4 4M7 4v16" /></Svg>
}
export function ChevronDownIcon(p: IconProps) {
  return <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
}
export function ArrowRightIcon(p: IconProps) {
  return <Svg {...p}><path d="M5 12h14m-7-7 7 7-7 7" /></Svg>
}
export function InfoIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4m0-4h.01" />
  </>,</Svg>
}
export function AlertIcon(p: IconProps) {
  return <Svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4m0 4h.01" /></Svg>
}
export function PinIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>,</Svg>
}
export function UsersIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>,</Svg>
}
export function CoinsIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4m8.71 3.88.7.71-2.82 2.82" />
  </>,</Svg>
}
export function PieIcon(p: IconProps) {
  return <Svg {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10Z" /></Svg>
}
export function MapIcon(p: IconProps) {
  return <Svg {...p}>  <path d="M14.1 5.1 9.9 3a2 2 0 0 0-1.8 0L3.6 5.3A1 1 0 0 0 3 6.2v13.2a.6.6 0 0 0 .9.5l4.2-2.1a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9V3.6a.6.6 0 0 0-.9-.5l-4.2 2.1a2 2 0 0 1-1.8 0ZM9 3.2v14.6m6-12.6v14.6" />,</Svg>
}
export function LandmarkIcon(p: IconProps) {
  return <Svg {...p}><path d="M3 22h18M6 18v-7m4 7v-7m4 7v-7m4 7v-7M12 2l8 5H4Z" /></Svg>
}
export function RefreshIcon(p: IconProps) {
  return <Svg {...p}>  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0-5v5h-5m5 4a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m5 0H3v5" />,</Svg>
}
export function ShieldIcon(p: IconProps) {
  return <Svg {...p}>  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Zm-11-1 2 2 4-4" />,</Svg>
}
export function CalendarIcon(p: IconProps) {
  return <Svg {...p}>  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4m-5 4h18" />
  </>,</Svg>
}
export function FileIcon(p: IconProps) {
  return <Svg {...p}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Zm-1 0v4a2 2 0 0 0 2 2h4M16 13H8m8 4H8" /></Svg>
}
export function SparkIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" /></Svg>
}
export function CodeIcon(p: IconProps) {
  return <Svg {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></Svg>
}

/** Marca do painel: um rio cortando o território, com um ponto de destaque. */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="#0b3b2e" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#fff" strokeOpacity="0.12" />
      <path d="M5 21c4-7 8 3 12-4s7-4 10-9" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
      <circle cx="17" cy="17" r="2.6" fill="#fff" />
    </svg>
  )
}
