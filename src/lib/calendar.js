import { EVENT } from '../config/event.js'

const stamp = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const title = `Baby Shower de ${EVENT.babyName}`
const location = EVENT.placeLines.join(' ')

export function googleCalendarUrl() {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${stamp(EVENT.startsAt)}/${stamp(EVENT.endsAt)}`,
    location,
    details: `¡Te esperamos para celebrar la llegada de ${EVENT.babyName}!`,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

export function downloadIcs() {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BabyShower//ES',
    'BEGIN:VEVENT',
    `UID:babyshower-${stamp(EVENT.startsAt)}@invitacion`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(EVENT.startsAt)}`,
    `DTEND:${stamp(EVENT.endsAt)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'baby-shower.ics' })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
