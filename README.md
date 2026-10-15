# Invitación Baby Shower · Kevin Jared 🤠

Invitación web animada (React + Vite) con confirmación de asistencia guardada en MongoDB.

## Cómo funciona
- `/i/<código>` → sobre con el nombre del invitado → se abre la tarjeta animada.
- Botón **Confirma tu asistencia** → `/i/<código>/confirmar` (formulario con máximo de personas por invitación, validado también en el servidor).
- `/admin` → crea invitaciones, define el máximo de personas, copia o envía el enlace por WhatsApp y ve quién confirmó.

## Desarrollo
```bash
npm install
cp .env.example .env   # define ADMIN_KEY (y MONGODB_URI si ya tienes una base)
npm run dev
```
Si `MONGODB_URI` está vacío, en desarrollo se levanta una base MongoDB local automática (carpeta `.mongo-data/`).

## Producción (Vercel)
1. Crea una base gratis en MongoDB Atlas y copia la cadena de conexión.
2. Importa el proyecto en Vercel y define las variables: `MONGODB_URI`, `MONGODB_DB`, `ADMIN_KEY`, `VITE_SITE_URL` (tu dominio, para la vista previa en WhatsApp).
3. Deploy. Las funciones de `api/` son el backend ("actions" en `server/actions.js`).

## Personalizar
- Datos del evento (fecha, hora, lugar, teléfono de soporte): `src/config/event.js`.
- Las ilustraciones son capas recortadas de la imagen original en `public/img/`.
