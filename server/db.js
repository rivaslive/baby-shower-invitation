import { MongoClient } from 'mongodb'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Cache global: reutiliza la conexión entre invocaciones (serverless) y recargas (Vite).
const cache = globalThis.__babyShowerMongo ?? (globalThis.__babyShowerMongo = { promise: null })

async function resolveUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI no está configurado')
  }
  // Desarrollo sin Mongo instalado: base local persistente en .mongo-data/
  const pkg = 'mongodb-memory-server'
  const { MongoMemoryServer } = await import(/* @vite-ignore */ pkg)
  const dbPath = resolve(process.cwd(), '.mongo-data')
  mkdirSync(dbPath, { recursive: true })
  const server = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } })
  console.warn(`\n  ⚠  MONGODB_URI vacío: usando MongoDB local de desarrollo (${dbPath})\n`)
  return server.getUri()
}

export async function getDb() {
  if (!cache.promise) {
    cache.promise = (async () => {
      const client = new MongoClient(await resolveUri())
      await client.connect()
      const db = client.db(process.env.MONGODB_DB || 'babyshower')
      await db.collection('invitations').createIndex({ code: 1 }, { unique: true })
      return db
    })()
  }
  try {
    return await cache.promise
  } catch (err) {
    cache.promise = null
    throw err
  }
}
