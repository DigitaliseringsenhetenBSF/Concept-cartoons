/**
 * Små inline-SVG-ikoner för knapparna. currentColor gör att de ärver knappens
 * textfärg (vit på lila). Inga externa beroenden – fungerar offline och i export.
 */
type IkonProps = { className?: string }

const bas = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

/** Generera med AI – gnistor/trollstav. */
export function IkonAi({ className }: IkonProps) {
  return (
    <svg {...bas} className={className}>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
    </svg>
  )
}

/** Ladda upp bild – bild med uppåtpil. */
export function IkonBild({ className }: IkonProps) {
  return (
    <svg {...bas} className={className}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 15l4-4 3 3 4-5 5 6" />
      <path d="M12 22V16m0 0l-2.2 2.2M12 16l2.2 2.2" />
    </svg>
  )
}

/** Exportera – nedåtpil mot bricka. */
export function IkonExport({ className }: IkonProps) {
  return (
    <svg {...bas} className={className}>
      <path d="M12 3v11m0 0l-4-4m4 4l4-4" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  )
}

/** Visa/dölj – öga. */
export function IkonOga({ className }: IkonProps) {
  return (
    <svg {...bas} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/** Liten chevron för menyknapparna. */
export function IkonChevron({ className }: IkonProps) {
  return (
    <svg {...bas} className={className} width={16} height={16}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** Bock för aktiva val i menyerna. */
export function IkonBock({ className }: IkonProps) {
  return (
    <svg {...bas} className={className} width={18} height={18}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
