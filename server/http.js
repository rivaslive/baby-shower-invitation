// Envuelve un "action" como función serverless (formato Vercel: req, res).
export function route(methods) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    const fn = methods[req.method]
    if (!fn) {
      res.setHeader('Allow', Object.keys(methods).join(', '))
      return res.status(405).json({ error: 'Método no permitido' })
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
      const data = await fn({ query: req.query ?? {}, body, headers: req.headers })
      return res.status(200).json(data)
    } catch (err) {
      const status = err?.status ?? (err instanceof SyntaxError ? 400 : 500)
      if (status >= 500) console.error(err)
      return res.status(status).json({ error: status >= 500 && !err?.status ? 'Error interno del servidor' : err.message })
    }
  }
}
