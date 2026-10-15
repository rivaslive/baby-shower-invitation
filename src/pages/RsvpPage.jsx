import confetti from 'canvas-confetti'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page from '../components/Page.jsx'
import SupportBox from '../components/SupportBox.jsx'
import { EVENT, mapsUrl } from '../config/event.js'
import { actions } from '../lib/api.js'
import { downloadIcs, googleCalendarUrl } from '../lib/calendar.js'

const EASE = [0.22, 1, 0.36, 1]
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

function celebrate() {
  const colors = ['#2f4a6e', '#8a5230', '#c99a4f', '#e8c9a0', '#5d7a4a']
  const star = confetti.shapeFromPath?.({ path: 'M12 0l3.5 8.3 9 .7-6.8 5.9 2.1 8.8L12 19l-7.8 4.7 2.1-8.8L-.5 9l9-.7z' })
  const base = { colors, disableForReducedMotion: true, zIndex: 50, ...(star ? { shapes: [star, 'circle'] } : {}) }
  confetti({ ...base, particleCount: 90, spread: 75, startVelocity: 42, origin: { y: 0.7 } })
  setTimeout(() => confetti({ ...base, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } }), 250)
  setTimeout(() => confetti({ ...base, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } }), 400)
}

function HatIcon(props) {
  return (
    <svg viewBox="0 0 48 32" aria-hidden {...props}>
      <path d="M16 6c2-4 6-4 8-2 2-2 6-2 8 2l2 13H14z" />
      <path d="M2 19c3 0 6 2 9 3h26c3-1 6-3 9-3-1 6-10 9-22 9S3 25 2 19z" />
    </svg>
  )
}

function Stepper({ value, max, onChange }) {
  const [shake, setShake] = useState(0)
  const controls = useAnimationControls()
  const set = (v) => {
    if (v < 1 || v > max) {
      setShake((s) => s + 1)
      controls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } })
      navigator.vibrate?.(30)
      return
    }
    onChange(v)
  }
  return (
    <div className="stepper-block">
      <motion.div className="stepper" animate={controls}>
        <button type="button" className="step-btn" onClick={() => set(value - 1)} aria-label="Menos" aria-disabled={value <= 1}>
          −
        </button>
        <div className="step-value" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ y: -24, opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
          <small>de {max}</small>
        </div>
        <button type="button" className="step-btn" onClick={() => set(value + 1)} aria-label="Más" aria-disabled={value >= max}>
          +
        </button>
      </motion.div>
      <div className="seats" aria-hidden>
        {Array.from({ length: max }, (_, i) => (
          <motion.span
            key={i}
            className={`seat ${i < value ? 'on' : ''}`}
            animate={i < value ? { scale: [0.6, 1.2, 1], opacity: 1 } : { scale: 0.9, opacity: 0.35 }}
            transition={{ duration: 0.35 }}
          >
            <HatIcon />
          </motion.span>
        ))}
      </div>
      <AnimatePresence>
        {shake > 0 && value >= max && (
          <motion.p
            className="hint"
            key={`h${shake}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Tu invitación es válida para máximo {plural(max, 'persona', 'personas')}.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function RsvpForm({ invite, onSaved, onCancel }) {
  const prev = invite.rsvp
  const [attending, setAttending] = useState(prev ? prev.attending : null)
  const [attendees, setAttendees] = useState(prev?.attending ? prev.attendees : invite.maxGuests)
  const [message, setMessage] = useState(prev?.message || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (attending === null) return setError('Cuéntanos si podrás acompañarnos')
    setSaving(true)
    setError('')
    try {
      const data = await actions.submitRsvp({
        code: invite.code,
        attending,
        attendees: attending ? attendees : 0,
        message,
      })
      onSaved(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form className="rsvp-form" onSubmit={submit} variants={stagger} initial="hidden" animate="show">
      <motion.div variants={item} className="greeting">
        <span className="greeting-hi">¡Hola,</span>
        <span className="greeting-name">{invite.guestName}!</span>
        <p>
          Hemos reservado <strong>{plural(invite.maxGuests, 'lugar', 'lugares')}</strong> para ti en el baby shower
          de {EVENT.babyName}.
        </p>
      </motion.div>

      <motion.fieldset variants={item} className="field">
        <legend>¿Nos acompañas?</legend>
        <div className="choices">
          {[
            { v: true, title: '¡Sí, ahí estaré!', sub: 'Cuenten conmigo', icon: '🤠' },
            { v: false, title: 'No podré ir', sub: 'Les mando cariño', icon: '💌' },
          ].map((c) => (
            <button
              key={String(c.v)}
              type="button"
              className={`choice ${attending === c.v ? 'selected' : ''}`}
              onClick={() => {
                setAttending(c.v)
                setError('')
              }}
              aria-pressed={attending === c.v}
            >
              {attending === c.v && (
                <motion.span layoutId="choice-bg" className="choice-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <motion.span
                className="choice-icon"
                animate={attending === c.v ? { rotate: [0, -14, 10, 0], scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {c.icon}
              </motion.span>
              <span className="choice-title">{c.title}</span>
              <span className="choice-sub">{c.sub}</span>
            </button>
          ))}
        </div>
      </motion.fieldset>

      <AnimatePresence initial={false}>
        {attending && (
          <motion.fieldset
            className="field field-collapse"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <legend>¿Cuántas personas asistirán?</legend>
            <Stepper value={attendees} max={invite.maxGuests} onChange={setAttendees} />
          </motion.fieldset>
        )}
      </AnimatePresence>

      <motion.label variants={item} className="field">
        <span className="label">
          Un mensaje para los papás <em>(opcional)</em>
        </span>
        <textarea
          className="input"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe unas palabras bonitas…"
          maxLength={500}
        />
      </motion.label>

      <AnimatePresence>
        {error && (
          <motion.p className="form-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={item} className="form-actions">
        <motion.button
          type="submit"
          className="leather-btn"
          disabled={saving}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
        >
          {saving ? <span className="spinner" aria-label="Enviando" /> : prev ? 'Actualizar respuesta' : 'Enviar confirmación'}
        </motion.button>
        {onCancel && (
          <button type="button" className="text-btn" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </motion.div>
    </motion.form>
  )
}

function CheckMark() {
  return (
    <svg className="checkmark" viewBox="0 0 52 52" aria-hidden>
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
      <motion.path
        d="M15 27l7 7 15-16"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.6, ease: 'easeOut' }}
      />
    </svg>
  )
}

function Done({ invite, onEdit }) {
  const r = invite.rsvp
  return (
    <motion.div className="done" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={item} className="done-icon">
        {r.attending ? <CheckMark /> : <span className="done-emoji">💌</span>}
      </motion.div>
      <motion.h2 variants={item}>
        {r.attending ? '¡Nos vemos en el rancho!' : '¡Gracias por avisarnos!'}
      </motion.h2>
      <motion.p variants={item} className="done-text">
        {r.attending
          ? `Confirmaste ${plural(r.attendees, 'persona', 'personas')} para celebrar la llegada de ${EVENT.babyName}.`
          : `Te vamos a extrañar. ${EVENT.babyName} y su familia te mandan un abrazo enorme.`}
      </motion.p>

      {r.attending && (
        <motion.div variants={item} className="ticket">
          <div>
            <span className="ticket-label">Fecha</span>
            <strong>{EVENT.dateLabel}</strong>
          </div>
          <div>
            <span className="ticket-label">Hora</span>
            <strong>{EVENT.timeLabel}</strong>
          </div>
          <div className="ticket-wide">
            <span className="ticket-label">Lugar</span>
            <strong>{EVENT.placeLines.join(' ')}</strong>
          </div>
        </motion.div>
      )}

      {r.attending && (
        <motion.div variants={item} className="done-actions">
          <a className="chip" href={googleCalendarUrl()} target="_blank" rel="noreferrer">
            📅 Google Calendar
          </a>
          <button type="button" className="chip" onClick={downloadIcs}>
            🍎 Calendario iPhone
          </button>
          <a className="chip" href={mapsUrl} target="_blank" rel="noreferrer">
            📍 Cómo llegar
          </a>
        </motion.div>
      )}

      <motion.div variants={item} className="done-links">
        <button type="button" className="text-btn" onClick={onEdit}>
          Cambiar mi respuesta
        </button>
        <Link className="text-btn" to={`/i/${invite.code}`}>
          Ver la invitación
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default function RsvpPage() {
  const { code } = useParams()
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let alive = true
    actions
      .getInvitation(code)
      .then((data) => {
        if (!alive) return
        setInvite(data)
        setEditing(!data.rsvp)
      })
      .catch((err) => alive && setError(err))
    return () => {
      alive = false
    }
  }, [code])

  const onSaved = (data) => {
    setInvite(data)
    setEditing(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (data.rsvp.attending) setTimeout(celebrate, 350)
  }

  return (
    <Page className="page-rsvp">
      <div className="rsvp">
        <motion.header
          className="rsvp-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Link to={`/i/${code}`} className="back" aria-label="Volver a la invitación">
            ←
          </Link>
          <motion.img
            src="/img/minihat.webp"
            alt=""
            className="rsvp-hat"
            initial={{ y: -30, rotate: -25, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 10, delay: 0.2 }}
          />
          <p className="rsvp-kicker">Baby shower de</p>
          <h1 className="rsvp-name">{EVENT.babyName}</h1>
          <p className="rsvp-date">
            {EVENT.dateLabel} <span>★</span> {EVENT.timeLabel}
          </p>
        </motion.header>

        <motion.section
          className="sheet"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
        >
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div key="err" className="sheet-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2>{error.status === 404 ? 'No encontramos tu invitación' : 'Ups, algo salió mal'}</h2>
                <p>
                  {error.status === 404
                    ? 'Revisa que el enlace esté completo, tal como te lo enviamos.'
                    : 'Revisa tu conexión e intenta de nuevo.'}
                </p>
              </motion.div>
            ) : !invite ? (
              <motion.div key="load" className="sheet-loading" exit={{ opacity: 0 }}>
                <span className="lasso" />
                Cargando tu invitación…
              </motion.div>
            ) : editing ? (
              <motion.div key="form" exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <RsvpForm invite={invite} onSaved={onSaved} onCancel={invite.rsvp ? () => setEditing(false) : null} />
              </motion.div>
            ) : (
              <motion.div key="done" exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.3 }}>
                <Done invite={invite} onEdit={() => setEditing(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <SupportBox />
        </motion.div>
      </div>
    </Page>
  )
}
