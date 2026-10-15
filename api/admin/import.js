import { route } from '../../server/http.js'
import { assertAdmin, bulkCreateInvitations } from '../../server/actions.js'

export default route({
  POST: ({ headers, body }) => {
    assertAdmin(headers['x-admin-key'])
    return bulkCreateInvitations(body)
  },
})
