import { route } from '../server/http.js'
import { getInvitation } from '../server/actions.js'

export default route({
  GET: ({ query }) => getInvitation(query.code, { track: query.view === '1' }),
})
