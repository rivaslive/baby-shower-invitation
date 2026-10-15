import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import SupportBox from '../components/SupportBox.jsx'

export default function NoCodePage({ notFound = false }) {
  return (
    <Page className="page-center">
      <div className="notice">
        <img src="/img/minihat.webp" alt="" className="notice-hat" />
        <h1>{notFound ? 'Esta página no existe' : 'Usa tu enlace personal'}</h1>
        <p>
          Cada invitación tiene un enlace único para confirmar tu asistencia. Ábrelo desde el mensaje que te
          enviamos o escríbenos y te lo compartimos.
        </p>
        <Link to="/" className="link-back">
          ← Ver la invitación
        </Link>
        <SupportBox />
      </div>
    </Page>
  )
}
