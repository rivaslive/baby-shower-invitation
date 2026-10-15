// Capas recortadas de la ilustración original (coordenadas sobre un lienzo de 1024×1536).
export const CARD_W = 1024
export const CARD_H = 1536

export const LAYERS = {
  minihat: { x: 456, y: 572, w: 116, h: 76 },
  plank: { x: 195, y: 728, w: 677, h: 144 },
  button: { x: 292, y: 1134, w: 460, h: 132 },
  icons: { x: 264, y: 900, w: 488, h: 85 },
  center: { x: 230, y: 305, w: 575, h: 829 },
  hat: { x: 0, y: 0, w: 600, h: 586 },
  rope: { x: 600, y: 0, w: 424, h: 760 },
  left: { x: 0, y: 586, w: 512, h: 950 },
  right: { x: 512, y: 760, w: 512, h: 776 },
}

export const px = (v, total) => `${(v / total) * 100}%`
export const X = (v) => px(v, CARD_W)
export const Y = (v) => px(v, CARD_H)

export function boxOf(name) {
  const l = LAYERS[name]
  return { left: X(l.x), top: Y(l.y), width: X(l.w), height: Y(l.h) }
}
