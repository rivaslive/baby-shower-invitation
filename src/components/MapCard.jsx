import { EVENT, mapEmbedUrl, mapsUrl, wazeUrl } from '../config/event.js'

export default function MapCard() {
  return (
    <section className="sheet map-card">
      <div className="map-head">
        <span className="map-pin" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
        </span>
        <div>
          <h2>¿Cómo llegar?</h2>
          <p>{EVENT.placeLines.join(' ')}</p>
        </div>
      </div>
      <div className="map-frame">
        <iframe
          title={`Mapa: ${EVENT.placeLines.join(' ')}`}
          src={mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="map-actions">
        <a className="chip" href={mapsUrl} target="_blank" rel="noreferrer">
          📍 Google Maps
        </a>
        <a className="chip" href={wazeUrl} target="_blank" rel="noreferrer">
          🚗 Waze
        </a>
      </div>
    </section>
  )
}
