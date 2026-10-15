// Servidor de producción (Railway, Render, VPS…): sirve el frontend compilado (dist/) y la API.
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapt } from './adapter.js'
import invitation from '../api/invitation.js'
import rsvp from '../api/rsvp.js'
import adminInvitations from '../api/admin/invitations.js'
import adminImport from '../api/admin/import.js'

process.env.NODE_ENV ??= 'production'

const routes = {
  invitation,
  rsvp,
  'admin/invitations': adminInvitations,
  'admin/import': adminImport,
}

const DIST = resolve(fileURLToPath(new URL('.', import.meta.url)), '../dist')
const INDEX = join(DIST, 'index.html')
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function sendFile(res, file, cache) {
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': cache,
  })
  createReadStream(file).pipe(res)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname.startsWith('/api/')) {
    const handler = routes[url.pathname.slice(5).replace(/\/$/, '')]
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
      return res.end(JSON.stringify({ error: 'Ruta no encontrada' }))
    }
    try {
      await adapt(req, res, url)
      return await handler(req, res)
    } catch (err) {
      const status = err?.status ?? (err instanceof SyntaxError ? 400 : 500)
      if (status >= 500) console.error(err)
      const message = status >= 500 ? 'Error interno del servidor' : err instanceof SyntaxError ? 'JSON inválido' : err.message
      if (!res.writableEnded) res.status(status).json({ error: message })
      return
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    return res.end()
  }

  // Archivos estáticos; cualquier otra ruta devuelve index.html (SPA)
  const file = normalize(join(DIST, decodeURIComponent(url.pathname)))
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()) {
    const cache = url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
    return sendFile(res, file, cache)
  }
  sendFile(res, INDEX, 'no-cache')
})

const port = Number(process.env.PORT) || 3000
server.listen(port, '0.0.0.0', () => console.log(`Invitación lista en el puerto ${port}`))
