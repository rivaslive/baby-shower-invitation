import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { adapt } from './server/adapter.js'

// En desarrollo ejecuta las funciones de /api igual que lo hace Vercel en producción.
function apiDevServer() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.slice('/api/'.length).replace(/\/$/, '')
        const file = resolve(server.config.root, 'api', `${name}.js`)
        if (!/^[a-z0-9/-]+$/.test(name) || !existsSync(file)) {
          res.statusCode = 404
          return res.end(JSON.stringify({ error: 'Ruta no encontrada' }))
        }
        try {
          await adapt(req, res, url)
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (err) {
          console.error(err)
          if (!res.writableEnded) res.status(500).json({ error: 'Error interno del servidor' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v
  return {
    plugins: [react(), apiDevServer()],
    server: { host: true },
  }
})
