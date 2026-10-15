import { useEffect, useState } from 'react'

export const CARD_IMAGES = ['paper', 'center', 'hat', 'rope', 'left', 'right', 'minihat', 'plank', 'icons', 'button'].map(
  (n) => `/img/${n}.webp`,
)

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(resolve)
    img.onerror = resolve
    img.src = src
  })
}

// Espera imágenes y fuentes antes de animar (con un tiempo máximo para no bloquear en redes lentas)
export function useAssetsReady(srcs = CARD_IMAGES, timeout = 6000) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const fonts = document.fonts?.ready ?? Promise.resolve()
    const all = Promise.all([...srcs.map(loadImage), fonts])
    const limit = new Promise((r) => setTimeout(r, timeout))
    Promise.race([all, limit]).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [srcs, timeout])
  return ready
}
