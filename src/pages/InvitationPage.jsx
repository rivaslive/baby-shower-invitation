import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import InvitationCard from '../components/InvitationCard.jsx'
import Page from '../components/Page.jsx'
import SupportBox from '../components/SupportBox.jsx'
import { actions } from '../lib/api.js'
import { useAssetsReady } from '../lib/preload.js'

// Cuenta una sola visita por sesión del navegador (no cada recarga)
const viewedKey = (code) => `viewed:${code}`
function firstViewInSession(code) {
  try {
    if (sessionStorage.getItem(viewedKey(code)) === '1') return false
    sessionStorage.setItem(viewedKey(code), '1')
    return true
  } catch {
    return true
  }
}

export default function InvitationPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState(null)
  const assetsReady = useAssetsReady()

  useEffect(() => {
    if (!code) return
    let alive = true
    actions
      .getInvitation(code, { view: firstViewInSession(code) })
      .then((data) => alive && setInvite(data))
      .catch((err) => alive && setError(err))
    return () => {
      alive = false
    }
  }, [code])

  if (error) {
    return (
      <Page className="page-center">
        <div className="notice">
          <img src="/img/minihat.webp" alt="" className="notice-hat" />
          <h1>{error.status === 404 ? 'No encontramos tu invitación' : 'Ups, algo salió mal'}</h1>
          <p>
            {error.status === 404
              ? 'Revisa que el enlace esté completo, tal como te lo enviamos.'
              : 'Revisa tu conexión e intenta de nuevo en un momento.'}
          </p>
          <SupportBox />
        </div>
      </Page>
    )
  }

  const confirmed = invite?.rsvp
  const cta = confirmed ? (confirmed.attending ? ['Asistencia', 'confirmada'] : ['Ver mi', 'respuesta']) : undefined

  return (
    <Page className="page-invite">
      <AnimatePresence>
        {!assetsReady && (
          <motion.div
            key="loader"
            className="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            role="status"
            aria-label="Cargando invitación"
          >
            <span className="loader-star">★</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="invite-wrap">
        <InvitationCard
          play={assetsReady}
          cta={cta}
          ctaDone={!!confirmed?.attending}
          onConfirm={() => navigate(code ? `/i/${code}/confirmar` : '/confirmar')}
        />
      </div>
    </Page>
  )
}
