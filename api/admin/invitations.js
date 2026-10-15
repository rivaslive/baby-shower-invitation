import { route } from '../../server/http.js'
import {
  assertAdmin,
  createInvitation,
  deleteInvitation,
  listInvitations,
  resetRsvp,
  updateInvitation,
} from '../../server/actions.js'

const admin = (fn) => (ctx) => {
  assertAdmin(ctx.headers['x-admin-key'])
  return fn(ctx)
}

export default route({
  GET: admin(() => listInvitations()),
  POST: admin(({ body }) => createInvitation(body)),
  PATCH: admin(({ query, body }) => (body.resetRsvp ? resetRsvp(query.id) : updateInvitation(query.id, body))),
  DELETE: admin(({ query }) => deleteInvitation(query.id)),
})
