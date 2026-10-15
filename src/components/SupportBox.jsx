import { EVENT } from '../config/event.js'

export default function SupportBox({ text = '¿Tienes alguna pregunta? Con gusto te ayudamos.' }) {
  const wa = `https://wa.me/${EVENT.supportWhatsApp}?text=${encodeURIComponent(
    `¡Hola! Tengo una pregunta sobre el baby shower de ${EVENT.babyName} 🤠`,
  )}`
  return (
    <aside className="support">
      <p className="support-text">{text}</p>
      <a className="support-phone" href={`tel:+${EVENT.supportWhatsApp}`}>
        {EVENT.supportPhone}
      </a>
      <div className="support-actions">
        <a className="chip chip-wa" href={wa} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
          </svg>
          WhatsApp
        </a>
        <a className="chip" href={`tel:+${EVENT.supportWhatsApp}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.3 1z" />
          </svg>
          Llamar
        </a>
      </div>
    </aside>
  )
}
