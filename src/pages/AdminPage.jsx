import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import BulkImport from '../components/BulkImport.jsx'
import Page from '../components/Page.jsx'
import { EVENT } from '../config/event.js'
import { actions } from '../lib/api.js'
import { toCsv } from '../lib/csv.js'

const KEY = 'bs-admin-key'
const storage = {
  get: () => {
    try {
      return sessionStorage.getItem(KEY) || ''
    } catch {
      return ''
    }
  },
  set: (v) => {
    try {
      v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY)
    } catch {}
  },
}

const linkFor = (code) => `${window.location.origin}/i/${code}`
function downloadLinks(items) {
  const status = (r) => (!r ? 'Pendiente' : r.attending ? `Asiste (${r.attendees})` : 'No asiste')
  const csv = toCsv([
    ['#', 'Invitado', 'Max', 'Estado', 'Enlace', 'Mensaje para WhatsApp'],
    ...[...items].reverse().map((inv, i) => [i + 1, inv.guestName, inv.maxGuests, status(inv.rsvp), linkFor(inv.code), shareText(inv)]),
  ])
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'invitaciones-baby-shower.csv' })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const shareText = (inv) =>
  `¡Hola ${inv.guestName}! 🤠 Con mucho cariño te invitamos al baby shower de ${EVENT.babyName}. ` +
  `Abre tu invitación y confirma tu asistencia aquí: ${linkFor(inv.code)}`

function Status({ rsvp }) {
  if (!rsvp) return <span className="badge badge-pending">Pendiente</span>
  if (rsvp.attending) return <span className="badge badge-yes">Asiste · {rsvp.attendees}</span>
  return <span className="badge badge-no">No asiste</span>
}

function Login({ onLogin }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await actions.admin.list(key)
      onLogin(key)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <motion.form className="sheet admin-login" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
      <img src="/img/minihat.webp" alt="" className="notice-hat" />
      <h1>Panel de invitaciones</h1>
      <p>Ingresa la clave de administrador.</p>
      <input
        className="input"
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Clave"
        autoFocus
        autoComplete="current-password"
      />
      {error && <p className="form-error">{error}</p>}
      <button className="leather-btn" disabled={busy || !key}>
        {busy ? <span className="spinner" /> : 'Entrar'}
      </button>
    </motion.form>
  )
}

function InviteRow({ inv, adminKey, onChange, onDelete, toast }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(inv.guestName)
  const [max, setMax] = useState(inv.maxGuests)
  const [busy, setBusy] = useState(false)

  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      okMsg && toast(okMsg)
    } catch (err) {
      toast(err.message, true)
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    run(async () => {
      onChange(await actions.admin.update(adminKey, inv.id, { guestName: name, maxGuests: Number(max) }))
      setEditing(false)
    }, 'Invitación actualizada')

  const copy = () =>
    run(async () => {
      await navigator.clipboard.writeText(linkFor(inv.code))
    }, 'Enlace copiado')

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Baby shower de ${EVENT.babyName}`, text: shareText(inv) })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(inv))}`, '_blank', 'noopener')
  }

  return (
    <motion.li
      layout
      className="inv"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0, padding: 0 }}
    >
      {editing ? (
        <div className="inv-edit">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input className="input input-num" type="number" min={1} max={30} value={max} onChange={(e) => setMax(e.target.value)} />
          <button className="mini-btn primary" onClick={save} disabled={busy}>
            Guardar
          </button>
          <button className="mini-btn" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <div className="inv-main">
            <div className="inv-title">
              <strong>{inv.guestName}</strong>
              <Status rsvp={inv.rsvp} />
            </div>
            <div className="inv-meta">
              <span>Máx. {inv.maxGuests}</span>
              <span>👁 {inv.views} {inv.views === 1 ? 'vista' : 'vistas'}</span>
              <code>/i/{inv.code}</code>
            </div>
            {inv.rsvp?.message && <p className="inv-msg">“{inv.rsvp.message}”</p>}
            {inv.rsvp?.contactName && <p className="inv-contact">Confirmó: {inv.rsvp.contactName}</p>}
          </div>
          <div className="inv-actions">
            <button className="mini-btn primary" onClick={share}>
              Enviar
            </button>
            <button className="mini-btn" onClick={copy} disabled={busy}>
              Copiar enlace
            </button>
            <button className="mini-btn" onClick={() => setEditing(true)}>
              Editar
            </button>
            {inv.rsvp && (
              <button
                className="mini-btn"
                disabled={busy}
                onClick={() =>
                  confirm('¿Borrar la respuesta de esta invitación?') &&
                  run(async () => onChange(await actions.admin.update(adminKey, inv.id, { resetRsvp: true })), 'Respuesta reiniciada')
                }
              >
                Reiniciar
              </button>
            )}
            <button
              className="mini-btn danger"
              disabled={busy}
              onClick={() =>
                confirm(`¿Eliminar la invitación de ${inv.guestName}?`) &&
                run(async () => {
                  await actions.admin.remove(adminKey, inv.id)
                  onDelete(inv.id)
                }, 'Invitación eliminada')
              }
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </motion.li>
  )
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(storage.get)
  const [data, setData] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [maxGuests, setMaxGuests] = useState(2)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toastMsg, setToastMsg] = useState(null)

  const toast = useCallback((text, isError = false) => {
    setToastMsg({ text, isError, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2600)
    return () => clearTimeout(t)
  }, [toastMsg])

  const load = useCallback(async () => {
    try {
      setData(await actions.admin.list(adminKey))
    } catch (err) {
      if (err.status === 401) {
        storage.set('')
        setAdminKey('')
      }
      toast(err.message, true)
    }
  }, [adminKey, toast])

  useEffect(() => {
    if (adminKey) load()
  }, [adminKey, load])

  const recompute = (items) => {
    const stats = items.reduce(
      (s, i) => {
        s.invitations += 1
        s.capacity += i.maxGuests
        if (!i.rsvp) s.pending += 1
        else if (i.rsvp.attending) {
          s.confirmedInvitations += 1
          s.confirmedGuests += i.rsvp.attendees
        } else s.declined += 1
        return s
      },
      { invitations: 0, capacity: 0, pending: 0, confirmedInvitations: 0, confirmedGuests: 0, declined: 0 },
    )
    setData({ items, stats })
  }

  const create = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const inv = await actions.admin.create(adminKey, { guestName, maxGuests: Number(maxGuests) })
      recompute([inv, ...data.items])
      setGuestName('')
      toast(`Invitación creada para ${inv.guestName}`)
    } catch (err) {
      toast(err.message, true)
    } finally {
      setCreating(false)
    }
  }

  const visible = useMemo(() => {
    if (!data) return []
    const s = search.trim().toLowerCase()
    return data.items.filter((i) => {
      if (s && !i.guestName.toLowerCase().includes(s)) return false
      if (filter === 'yes') return i.rsvp?.attending
      if (filter === 'no') return i.rsvp && !i.rsvp.attending
      if (filter === 'pending') return !i.rsvp
      return true
    })
  }, [data, filter, search])

  if (!adminKey) {
    return (
      <Page className="page-center page-admin">
        <Login
          onLogin={(k) => {
            storage.set(k)
            setAdminKey(k)
          }}
        />
      </Page>
    )
  }

  const st = data?.stats

  return (
    <Page className="page-admin">
      <div className="admin">
        <header className="admin-head">
          <div>
            <p className="rsvp-kicker">Baby shower de {EVENT.babyName}</p>
            <h1>Invitaciones</h1>
          </div>
          <div className="admin-head-actions">
          <button className="mini-btn" disabled={!data?.items.length} onClick={() => downloadLinks(data.items)}>
            Descargar enlaces
          </button>
          <button
            className="mini-btn"
            onClick={() => {
              storage.set('')
              setAdminKey('')
              setData(null)
            }}
          >
            Salir
          </button>
          </div>
        </header>

        <section className="stats">
          {[
            ['Personas confirmadas', st?.confirmedGuests, 'yes'],
            ['Pendientes', st?.pending, 'pending'],
            ['No asistirán', st?.declined, 'no'],
            ['Invitaciones', st?.invitations, ''],
            ['Cupo total', st?.capacity, ''],
          ].map(([label, value, tone]) => (
            <div key={label} className={`stat stat-${tone || 'plain'}`}>
              <motion.strong key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {value ?? '—'}
              </motion.strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <form className="sheet create" onSubmit={create}>
          <h2>Nueva invitación</h2>
          <div className="create-row">
            <label className="field">
              <span className="label">Invitado o familia</span>
              <input
                className="input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej. Familia Hernández"
                maxLength={80}
                required
              />
            </label>
            <label className="field field-num">
              <span className="label">Máx.</span>
              <input
                className="input input-num"
                type="number"
                min={1}
                max={30}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                required
              />
            </label>
          </div>
          <button className="leather-btn" disabled={creating || !guestName.trim()}>
            {creating ? <span className="spinner" /> : 'Crear invitación'}
          </button>
        </form>

        {data && (
          <BulkImport
            adminKey={adminKey}
            existing={data.items}
            toast={toast}
            onImported={(created) => recompute([...created, ...data.items])}
          />
        )}

        <div className="toolbar">
          <input className="input" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="tabs">
            {[
              ['all', 'Todas'],
              ['yes', 'Asisten'],
              ['pending', 'Pendientes'],
              ['no', 'No asisten'],
            ].map(([v, l]) => (
              <button key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>
                {filter === v && <motion.span layoutId="tab-bg" className="tab-bg" />}
                <span>{l}</span>
              </button>
            ))}
          </div>
        </div>

        {!data ? (
          <p className="empty">Cargando…</p>
        ) : visible.length === 0 ? (
          <p className="empty">{data.items.length ? 'Sin resultados' : 'Aún no hay invitaciones. ¡Crea la primera!'}</p>
        ) : (
          <ul className="inv-list">
            <AnimatePresence initial={false}>
              {visible.map((inv) => (
                <InviteRow
                  key={inv.id}
                  inv={inv}
                  adminKey={adminKey}
                  toast={toast}
                  onChange={(u) => recompute(data.items.map((i) => (i.id === u.id ? u : i)))}
                  onDelete={(id) => recompute(data.items.filter((i) => i.id !== id))}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key={toastMsg.id}
            className={`toast ${toastMsg.isError ? 'toast-error' : ''}`}
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
          >
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  )
}
