import { AnimatePresence, MotionConfig } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage.jsx'
import RsvpPage from './pages/RsvpPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import NoCodePage from './pages/NoCodePage.jsx'

export default function App() {
  const location = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<InvitationPage />} />
          <Route path="/i/:code" element={<InvitationPage />} />
          <Route path="/i/:code/confirmar" element={<RsvpPage />} />
          <Route path="/confirmar" element={<NoCodePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NoCodePage notFound />} />
        </Routes>
      </AnimatePresence>
    </MotionConfig>
  )
}
