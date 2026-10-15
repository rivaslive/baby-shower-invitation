// Adapta req/res de Node al formato de funciones de Vercel (req.query, req.body, res.status().json()).
const MAX_BODY = 2 * 1024 * 1024

export async function adapt(req, res, url) {
  res.status = (code) => ((res.statusCode = code), res)
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(data))
  }
  req.query = Object.fromEntries(url.searchParams)
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw Object.assign(new Error('Payload demasiado grande'), { status: 413 })
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  req.body = raw ? JSON.parse(raw) : {}
}
