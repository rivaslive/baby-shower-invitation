// Lector de CSV/TSV tolerante: Google Sheets (.csv), Excel (; como separador) o texto pegado (tabulaciones).

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? ''
  const counts = { '\t': 0, ',': 0, ';': 0 }
  let quoted = false
  for (const ch of firstLine) {
    if (ch === '"') quoted = !quoted
    else if (!quoted && ch in counts) counts[ch]++
  }
  const [best, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return n > 0 ? best : ','
}

export function parseCsv(text) {
  const src = text.replace(/^﻿/, '')
  const delim = detectDelimiter(src)
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.map((r) => r.map((c) => c.trim()))
}

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z#]/g, '')

const NAME_HEADERS = ['invitado', 'invitados', 'nombre', 'familia', 'guest', 'guestname']
const MAX_HEADERS = ['max', 'maximo', 'maxpersonas', 'cupo', 'personas', 'pases', 'lugares']

// Convierte el CSV en filas { line, guestName, maxGuests, error }
export function rowsFromCsv(text) {
  const table = parseCsv(text).filter((r) => r.some((c) => c !== ''))
  if (!table.length) return []

  const header = table[0].map(norm)
  let nameIdx = header.findIndex((h) => NAME_HEADERS.includes(h))
  let maxIdx = header.findIndex((h) => MAX_HEADERS.includes(h))
  const hasHeader = nameIdx !== -1 || maxIdx !== -1 || header.includes('#')
  if (nameIdx === -1 || maxIdx === -1) {
    // Sin encabezados reconocibles: "#, Invitado, Max" o "Invitado, Max"
    const width = Math.max(...table.map((r) => r.length))
    nameIdx = width >= 3 ? 1 : 0
    maxIdx = width >= 3 ? 2 : 1
  }

  return table.slice(hasHeader ? 1 : 0).map((r, i) => {
    const line = i + (hasHeader ? 2 : 1)
    const guestName = (r[nameIdx] ?? '').replace(/\s+/g, ' ').trim()
    const rawMax = (r[maxIdx] ?? '').trim()
    const maxGuests = Number(rawMax)
    let error = null
    if (!guestName) error = 'Falta el nombre'
    else if (!rawMax || !Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 30) error = 'Máx. inválido (1–30)'
    return { line, guestName, maxGuests: Number.isInteger(maxGuests) ? maxGuests : rawMax, error }
  })
}

export function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')
}
