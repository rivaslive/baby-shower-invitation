// Datos del evento: edita aquí y se actualiza toda la invitación.
export const EVENT = {
  babyName: 'Kevin Jared',
  dateLabel: '14 . 11 . 2026',
  dateLong: 'Sábado 14 de noviembre de 2026',
  timeLabel: '3:30 p.m.',
  // Inicio y fin en UTC (3:30 p.m. – 6:30 p.m. hora de El Salvador, UTC-6)
  startsAt: '2026-11-14T21:30:00Z',
  endsAt: '2026-11-15T00:30:00Z',
  placeLines: ['Cuadra Alas,', 'Barrio La Primavera'],
  placeQuery: 'Cuadra Alas, Barrio La Primavera',
  location: { lat: 14.187994, lng: -89.148504 },
  supportPhone: '7235-2158',
  supportWhatsApp: '50372352158',
}

const { lat, lng } = EVENT.location
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
export const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
export const mapEmbedUrl = `https://www.google.com/maps?q=${lat},${lng}&z=16&hl=es&output=embed`
