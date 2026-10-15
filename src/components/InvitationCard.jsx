import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { EVENT } from '../config/event.js'
import { boxOf, X, Y } from '../lib/layers.js'
import Sparkle from './Sparkle.jsx'

const EASE = [0.22, 1, 0.36, 1]

const rise = (delay, distance = 16) => ({
  hidden: { opacity: 0, y: distance, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE, delay } },
})

function At({ x = 512, y, className = '', children }) {
  return (
    <div className={`at ${className}`} style={{ left: X(x), top: Y(y) }}>
      {children}
    </div>
  )
}

function Piece({ name, offset, from, delay = 0, duration = 1.2, spring, origin, idle }) {
  const show = { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }
  const transition = spring
    ? { type: 'spring', ...spring, delay, opacity: { duration: 0.6, delay } }
    : { duration, ease: EASE, delay }
  return (
    <motion.div className="piece" style={{ ...boxOf(name), x: offset?.x, y: offset?.y }}>
      <motion.div
        className="piece-in"
        style={origin ? { transformOrigin: origin } : undefined}
        variants={{ hidden: { opacity: 0, ...from }, show: { ...show, transition } }}
      >
        <div className={idle ? `idle ${idle}` : undefined}>
          <img src={`/img/${name}.webp`} alt="" draggable={false} decoding="async" />
        </div>
      </motion.div>
    </motion.div>
  )
}

const DUST = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  top: 40 + ((i * 37) % 60),
  size: 2 + (i % 4),
  delay: (i * 0.73) % 9,
  dur: 9 + (i % 5) * 2,
}))

export default function InvitationCard({ play = true, onConfirm, cta = ['Confirma tu', 'asistencia'], ctaDone = false }) {
  // Paralaje / inclinación 3D con el mouse (solo puntero fino)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 18 })
  const sy = useSpring(my, { stiffness: 80, damping: 18 })
  const rotateY = useTransform(sx, (v) => v * 4)
  const rotateX = useTransform(sy, (v) => v * -4)
  const corner = { x: useTransform(sx, (v) => v * -9), y: useTransform(sy, (v) => v * -9) }

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
    my.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onPointerLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const [l1, l2] = EVENT.placeLines

  return (
    <div className="card-stage">
      <motion.article
        className="card"
        initial="hidden"
        animate={play ? 'show' : 'hidden'}
        style={{ rotateX, rotateY }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        variants={{
          hidden: { opacity: 0, scale: 0.97 },
          show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
        }}
        aria-label={`Invitación al baby shower de ${EVENT.babyName}`}
      >
        <div className="card-paper" />

        {/* Ilustraciones: arriba ancladas al borde superior, abajo al inferior */}
        <span className="frame-gap frame-gap-l" aria-hidden />
        <span className="frame-gap frame-gap-r" aria-hidden />
        <div className="grp grp-bottom">
          <Piece name="left" offset={corner} from={{ x: -90, y: 30 }} delay={0.4} duration={1.3} />
          <Piece name="right" offset={corner} from={{ x: 90, y: 40 }} delay={0.5} duration={1.3} />
        </div>
        <div className="grp grp-top">
          <Piece name="rope" offset={corner} from={{ x: 70, rotate: 5 }} delay={0.15} duration={1.4} />
          <Piece
            name="hat"
            offset={corner}
            from={{ y: -220, x: -40, rotate: -22 }}
            spring={{ stiffness: 70, damping: 10, mass: 1.1 }}
            delay={0.25}
            origin="35% 60%"
            idle="sway"
          />
          {[
            [879, 466, 1.2],
            [884, 103, 2.3],
          ].map(([x, y, d]) => (
            <Sparkle key={`${x}-${y}`} style={{ left: X(x), top: Y(y), animationDelay: `${4.5 + d}s` }} />
          ))}
        </div>

        <div className="dust" aria-hidden>
          {DUST.map((d, i) => (
            <span
              key={i}
              style={{
                left: `${d.left}%`,
                top: `${d.top}%`,
                width: d.size,
                height: d.size,
                animationDelay: `${d.delay + 2}s`,
                animationDuration: `${d.dur}s`,
              }}
            />
          ))}
        </div>

        <div className="grp grp-center">
        <Piece name="center" from={{ scale: 0.985 }} delay={0.6} duration={1.4} />

        {/* Encabezado */}
        <h1 className="sr-only">
          Acompáñanos a mi Baby Shower. Celebramos la llegada de {EVENT.babyName}
        </h1>
        <At y={291} className="t-kicker-row">
          <motion.p className="t-kicker" variants={rise(0.9)} aria-hidden>
            Acompáñanos a mi
          </motion.p>
        </At>
        <At y={414}>
          <div className="t-baby" aria-hidden>
            {'BABY'.split('').map((ch, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: '-70%', rotate: -10, scale: 1.15 },
                  show: {
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 380, damping: 15, delay: 1.05 + i * 0.1 },
                  },
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </At>
        <At y={540}>
          <div className="t-shower" aria-hidden>
            {'SHOWER'.split('').map((ch, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: '45%', filter: 'blur(8px)' },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.8, ease: EASE, delay: 1.5 + i * 0.07 },
                  },
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </At>

        <Piece
          name="minihat"
          from={{ scale: 0.2, y: -40, rotate: -30 }}
          spring={{ stiffness: 260, damping: 11 }}
          delay={2.0}
          origin="50% 80%"
          idle="tip"
        />

        <At y={687}>
          <motion.p className="t-lead" variants={rise(2.15)} aria-hidden>
            Estamos muy felices de celebrar
            <br />
            la llegada de nuestro pequeño
          </motion.p>
        </At>

        {/* Letrero de madera con el nombre */}
        <Piece
          name="plank"
          from={{ rotate: -7, y: -30, scale: 0.9 }}
          spring={{ stiffness: 110, damping: 9 }}
          delay={2.35}
          origin="12% 0%"
        />
        <At y={790}>
          <motion.div
            className="t-name"
            aria-hidden
            variants={{
              hidden: { clipPath: 'inset(-40% 100% -40% -8%)', opacity: 1 },
              show: {
                clipPath: 'inset(-40% -8% -40% -8%)',
                opacity: 1,
                transition: { duration: 1.7, ease: [0.55, 0.1, 0.35, 1], delay: 2.85 },
              },
            }}
          >
            {EVENT.babyName}
          </motion.div>
        </At>

        {/* Detalles */}
        <Piece name="icons" from={{ y: 18, scale: 0.9 }} delay={3.3} duration={0.9} />
        <dl className="sr-only">
          <dt>Fecha</dt>
          <dd>{EVENT.dateLong}</dd>
          <dt>Hora</dt>
          <dd>{EVENT.timeLabel}</dd>
          <dt>Lugar</dt>
          <dd>{EVENT.placeLines.join(' ')}</dd>
        </dl>
        {[
          { x: 320, label: 'Fecha', value: <span className="t-value">{EVENT.dateLabel}</span> },
          { x: 519, label: 'Hora', value: <span className="t-value">{EVENT.timeLabel}</span> },
          {
            x: 734,
            label: 'Lugar',
            value: (
              <span className="t-value t-place">
                {l1}
                <br />
                {l2}
              </span>
            ),
          },
        ].map((col, i) => (
          <div key={col.label} aria-hidden>
            <At x={col.x} y={1001}>
              <motion.span className="t-label" variants={rise(3.45 + i * 0.12, 10)}>
                {col.label}
              </motion.span>
            </At>
            <At x={col.x} y={i === 2 ? 1058 : 1046}>
              <motion.div variants={rise(3.55 + i * 0.12, 10)}>{col.value}</motion.div>
            </At>
          </div>
        ))}

        {/* Botón de confirmación */}
        <motion.div
          className="cta-wrap"
          style={boxOf('button')}
          variants={{
            hidden: { opacity: 0, y: 40, scale: 0.85 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: 'spring', stiffness: 200, damping: 14, delay: 3.95 },
            },
          }}
        >
          <span className="cta-ring" aria-hidden />
          <motion.button
            type="button"
            className="cta"
            onClick={onConfirm}
            whileHover={{ scale: 1.035 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            <img src="/img/button.webp" alt="" draggable={false} />
            <span className="cta-shine" aria-hidden />
            <span className="cta-body">
              <svg className="cta-icon" viewBox="0 0 24 24" aria-hidden>
                {ctaDone ? (
                  <path d="M4 12.5l5 5L20 6.5" />
                ) : (
                  <>
                    <rect x="3" y="5.5" width="18" height="13" rx="2" />
                    <path d="M3.5 7l8.5 6.5L20.5 7" />
                  </>
                )}
              </svg>
              <span className="cta-text">
                <small>{cta[0]}</small>
                {cta[1]}
              </span>
            </span>
          </motion.button>
        </motion.div>

        {/* Destellos sobre las estrellas */}
        {[
          [512, 325, 0],
          [512, 872, 0.7],
          [512, 1105, 1.8],
        ].map(([x, y, d]) => (
          <Sparkle key={`${x}-${y}`} style={{ left: X(x), top: Y(y), animationDelay: `${4.5 + d}s` }} />
        ))}
        </div>
      </motion.article>
    </div>
  )
}
