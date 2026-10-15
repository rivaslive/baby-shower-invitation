export default function Sparkle({ style, className = '' }) {
  return (
    <svg className={`sparkle ${className}`} style={style} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" />
    </svg>
  )
}
