import { route } from '../server/http.js'
import { submitRsvp } from '../server/actions.js'

export default route({
  POST: ({ body }) => submitRsvp(body),
})
