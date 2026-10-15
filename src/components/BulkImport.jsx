import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { actions } from '../lib/api.js'
import { rowsFromCsv } from '../lib/csv.js'

const key = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export default function BulkImport({ adminKey, existing, onImported, toast }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [skipExisting, setSkipExisting] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const rows = useMemo(() => {
    const parsed = rowsFromCsv(text)
    const seen = new Set(existing.map((i) => key(i.guestName)))
    return parsed.map((r) => {
      if (r.error || !skipExisting) return r
      const k = key(r.guestName)
      const dup = seen.has(k)
      seen.add(k)
      return dup ? { ...r, skip: true } : r
    })
  }, [text, existing, skipExisting])

  const valid = rows.filter((r) => !r.error && !r.skip)
  const errors = rows.filter((r) => r.error)
  const skipped = rows.filter((r) => r.skip)
  const totalGuests = valid.reduce((n, r) => n + r.maxGuests, 0)

  const readFile = async (file) => {
    if (!file) return
    setFileName(file.name)
    setText(await file.text())
  }

  const reset = () => {
    setText('')
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    setBusy(true)
    try {
      const res = await actions.admin.importMany(
        adminKey,
        valid.map(({ line, guestName, maxGuests }) => ({ line, guestName, maxGuests })),
        { skipExisting },
      )
      onImported(res.created)
      toast(
        `${res.created.length} ${res.created.length === 1 ? 'invitación creada' : 'invitaciones creadas'}` +
          (res.skipped.length ? ` · ${res.skipped.length} omitidas` : ''),
      )
      reset()
      setOpen(false)
    } catch (err) {
      toast(err.message, true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sheet bulk">
      <button type="button" className="bulk-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>
          <strong>Importar desde Google Sheets</strong>
          <small>Sube un CSV con las columnas #, Invitado, Max</small>
        </span>
        <motion.span className="bulk-chevron" animate={{ rotate: open ? 180 : 0 }}>
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="bulk-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="bulk-help">
              En Google Sheets: <b>Archivo → Descargar → Valores separados por comas (.csv)</b>. También puedes copiar
              las celdas y pegarlas abajo.
            </p>

            <label
              className={`drop ${dragging ? 'is-drag' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                readFile(e.dataTransfer.files?.[0])
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                onChange={(e) => readFile(e.target.files?.[0])}
              />
              <span className="drop-icon">📄</span>
              <span>{fileName ? <b>{fileName}</b> : 'Toca para elegir el archivo CSV o arrástralo aquí'}</span>
            </label>

            <textarea
              className="input bulk-text"
              rows={4}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setFileName('')
              }}
              placeholder={'#,Invitado,Max\n1,Familia Hernández,4\n2,Ana López,2'}
              spellCheck={false}
            />

            {rows.length > 0 && (
              <>
                <div className="bulk-summary">
                  <span className="badge badge-yes">{valid.length} por crear</span>
                  {skipped.length > 0 && <span className="badge badge-pending">{skipped.length} ya existen</span>}
                  {errors.length > 0 && <span className="badge badge-no">{errors.length} con errores</span>}
                  <span className="bulk-total">{totalGuests} personas en total</span>
                </div>

                <div className="bulk-table-wrap">
                  <table className="bulk-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Invitado</th>
                        <th>Máx.</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.line} className={r.error ? 'row-error' : r.skip ? 'row-skip' : ''}>
                          <td>{r.line}</td>
                          <td>{r.guestName || '—'}</td>
                          <td>{String(r.maxGuests || '—')}</td>
                          <td>{r.error ? r.error : r.skip ? 'Ya existe' : '✓'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <label className="check">
                  <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} />
                  Omitir invitados que ya existen o están repetidos
                </label>

                {errors.length > 0 && (
                  <p className="form-error">Corrige las filas con errores en tu hoja o se omitirán al importar.</p>
                )}

                <div className="bulk-actions">
                  <button className="leather-btn" disabled={busy || !valid.length} onClick={submit}>
                    {busy ? (
                      <span className="spinner" />
                    ) : (
                      `Crear ${valid.length} ${valid.length === 1 ? 'invitación' : 'invitaciones'}`
                    )}
                  </button>
                  <button type="button" className="text-btn" onClick={reset}>
                    Limpiar
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
