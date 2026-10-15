import { randomBytes, timingSafeEqual } from 'node:crypto'
import { ObjectId } from 'mongodb'
import { getDb } from './db.js'

export class ActionError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const MAX_GUESTS_LIMIT = 30
const CODE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789' // 32 símbolos, sin ambigüedades (l/1, o/0)
const CODE_RE = /^[a-z0-9]{4,32}$/

const invitations = async () => (await getDb()).collection('invitations')

function makeCode(length = 8) {
  return Array.from(randomBytes(length), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

function cleanText(value, max) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max)
}

function parseCode(code) {
  const c = String(code ?? '').trim().toLowerCase()
  if (!CODE_RE.test(c)) throw new ActionError(404, 'Invitación no encontrada')
  return c
}

function parseMaxGuests(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > MAX_GUESTS_LIMIT) {
    throw new ActionError(422, `El máximo de invitados debe estar entre 1 y ${MAX_GUESTS_LIMIT}`)
  }
  return n
}

function publicView(doc) {
  return {
    code: doc.code,
    guestName: doc.guestName,
    maxGuests: doc.maxGuests,
    rsvp: doc.rsvp
      ? {
          attending: doc.rsvp.attending,
          attendees: doc.rsvp.attendees,
          contactName: doc.rsvp.contactName,
          message: doc.rsvp.message,
          updatedAt: doc.rsvp.updatedAt,
        }
      : null,
  }
}

function adminView(doc) {
  return {
    id: String(doc._id),
    ...publicView(doc),
    views: doc.views ?? 0,
    lastViewedAt: doc.lastViewedAt ?? null,
    createdAt: doc.createdAt,
  }
}

/* ───────────────────────── Acciones públicas ───────────────────────── */

export async function getInvitation(code, { track = false } = {}) {
  const col = await invitations()
  const filter = { code: parseCode(code) }
  const doc = track
    ? await col.findOneAndUpdate(
        filter,
        { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } },
        { returnDocument: 'after' },
      )
    : await col.findOne(filter)
  if (!doc) throw new ActionError(404, 'Invitación no encontrada')
  return publicView(doc)
}

export async function submitRsvp(input = {}) {
  const code = parseCode(input.code)
  if (typeof input.attending !== 'boolean') {
    throw new ActionError(422, 'Indícanos si podrás asistir')
  }
  const attending = input.attending
  const attendees = attending ? Number(input.attendees) : 0
  if (attending && (!Number.isInteger(attendees) || attendees < 1)) {
    throw new ActionError(422, 'Indica cuántas personas asistirán')
  }

  const rsvp = {
    attending,
    attendees,
    contactName: cleanText(input.contactName, 80),
    message: cleanText(input.message, 500),
    updatedAt: new Date(),
  }

  const col = await invitations()
  // El límite se valida de forma atómica contra el máximo guardado en la base de datos.
  const filter = attending ? { code, maxGuests: { $gte: attendees } } : { code }
  const doc = await col.findOneAndUpdate(
    filter,
    { $set: { rsvp }, $push: { history: { ...rsvp } } },
    { returnDocument: 'after' },
  )

  if (!doc) {
    const existing = await col.findOne({ code }, { projection: { maxGuests: 1 } })
    if (!existing) throw new ActionError(404, 'Invitación no encontrada')
    const n = existing.maxGuests
    throw new ActionError(422, `Esta invitación es válida para máximo ${n} ${n === 1 ? 'persona' : 'personas'}`)
  }
  return publicView(doc)
}

/* ───────────────────────── Acciones de administración ───────────────────────── */

export function assertAdmin(key) {
  const expected = process.env.ADMIN_KEY
  if (!expected) throw new ActionError(500, 'ADMIN_KEY no está configurado')
  const a = Buffer.from(String(key ?? ''))
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ActionError(401, 'Clave de administrador incorrecta')
  }
}

function parseId(id) {
  if (!ObjectId.isValid(String(id ?? ''))) throw new ActionError(404, 'Invitación no encontrada')
  return new ObjectId(String(id))
}

export async function listInvitations() {
  const col = await invitations()
  const docs = await col.find({}, { projection: { history: 0 } }).sort({ createdAt: -1 }).toArray()
  const items = docs.map(adminView)
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
  return { items, stats }
}

export async function createInvitation(input = {}) {
  const guestName = cleanText(input.guestName, 80)
  if (!guestName) throw new ActionError(422, 'Escribe el nombre del invitado')
  const maxGuests = parseMaxGuests(input.maxGuests)
  const col = await invitations()
  for (let attempt = 0; attempt < 5; attempt++) {
    const doc = { code: makeCode(), guestName, maxGuests, rsvp: null, views: 0, createdAt: new Date() }
    try {
      const { insertedId } = await col.insertOne(doc)
      return adminView({ ...doc, _id: insertedId })
    } catch (err) {
      if (err?.code !== 11000) throw err // 11000 = código duplicado, reintentar
    }
  }
  throw new ActionError(500, 'No se pudo generar un código único')
}

const BULK_LIMIT = 500
const nameKey = (name) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

// Crea muchas invitaciones de una vez (importación desde CSV / Google Sheets).
// Si skipExisting es true, omite nombres que ya existen o que se repiten en el archivo.
export async function bulkCreateInvitations(input = {}) {
  const rows = Array.isArray(input.rows) ? input.rows : []
  const skipExisting = input.skipExisting !== false
  if (!rows.length) throw new ActionError(422, 'No hay invitaciones para importar')
  if (rows.length > BULK_LIMIT) throw new ActionError(422, `Máximo ${BULK_LIMIT} invitaciones por importación`)

  const parsed = rows.map((row, i) => {
    const guestName = cleanText(row?.guestName, 80)
    const line = row?.line ?? i + 1
    if (!guestName) throw new ActionError(422, `Fila ${line}: falta el nombre del invitado`)
    try {
      return { guestName, maxGuests: parseMaxGuests(row?.maxGuests) }
    } catch (err) {
      throw new ActionError(422, `Fila ${line} (${guestName}): ${err.message}`)
    }
  })

  const col = await invitations()
  const seen = new Set()
  if (skipExisting) {
    const existing = await col.find({}, { projection: { guestName: 1 } }).toArray()
    existing.forEach((d) => seen.add(nameKey(d.guestName)))
  }

  const skipped = []
  const toCreate = []
  for (const row of parsed) {
    const key = nameKey(row.guestName)
    if (skipExisting && seen.has(key)) {
      skipped.push(row.guestName)
      continue
    }
    seen.add(key)
    toCreate.push(row)
  }
  if (!toCreate.length) return { created: [], skipped }

  // Códigos únicos: evita choques con los existentes y entre sí
  const codes = new Set()
  while (codes.size < toCreate.length) codes.add(makeCode())
  const taken = await col.find({ code: { $in: [...codes] } }, { projection: { code: 1 } }).toArray()
  taken.forEach((d) => codes.delete(d.code))
  while (codes.size < toCreate.length) codes.add(makeCode())

  // createdAt descendente para que el listado conserve el orden de la hoja
  const now = Date.now()
  const codeList = [...codes]
  const docs = toCreate.map((row, i) => ({
    code: codeList[i],
    guestName: row.guestName,
    maxGuests: row.maxGuests,
    rsvp: null,
    views: 0,
    createdAt: new Date(now - i),
  }))
  const { insertedIds } = await col.insertMany(docs)
  return { created: docs.map((d, i) => adminView({ ...d, _id: insertedIds[i] })), skipped }
}

export async function updateInvitation(id, input = {}) {
  const _id = parseId(id)
  const col = await invitations()
  const current = await col.findOne({ _id })
  if (!current) throw new ActionError(404, 'Invitación no encontrada')

  const $set = {}
  if (input.guestName !== undefined) {
    const guestName = cleanText(input.guestName, 80)
    if (!guestName) throw new ActionError(422, 'Escribe el nombre del invitado')
    $set.guestName = guestName
  }
  if (input.maxGuests !== undefined) {
    const maxGuests = parseMaxGuests(input.maxGuests)
    const confirmed = current.rsvp?.attending ? current.rsvp.attendees : 0
    if (maxGuests < confirmed) {
      throw new ActionError(422, `Ya confirmaron ${confirmed} personas; el máximo no puede ser menor`)
    }
    $set.maxGuests = maxGuests
  }
  const doc = await col.findOneAndUpdate({ _id }, { $set }, { returnDocument: 'after' })
  return adminView(doc)
}

export async function resetRsvp(id) {
  const col = await invitations()
  const doc = await col.findOneAndUpdate({ _id: parseId(id) }, { $set: { rsvp: null } }, { returnDocument: 'after' })
  if (!doc) throw new ActionError(404, 'Invitación no encontrada')
  return adminView(doc)
}

export async function deleteInvitation(id) {
  const col = await invitations()
  const { deletedCount } = await col.deleteOne({ _id: parseId(id) })
  if (!deletedCount) throw new ActionError(404, 'Invitación no encontrada')
  return { ok: true }
}
