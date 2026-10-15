async function request(path, { method = 'GET', body, adminKey } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => ({})) : {}
  if (!res.ok || !isJson) {
    const err = new Error(
      data.error || (isJson ? 'Algo salió mal, intenta de nuevo' : 'El servidor no respondió correctamente'),
    )
    err.status = res.ok ? 502 : res.status
    throw err
  }
  return data
}

const q = encodeURIComponent

// "Actions" del cliente: cada una llama a su función de backend en /api
export const actions = {
  getInvitation: (code, { view = false } = {}) =>
    request(`/api/invitation?code=${q(code)}${view ? '&view=1' : ''}`),
  submitRsvp: (payload) => request('/api/rsvp', { method: 'POST', body: payload }),
  admin: {
    list: (key) => request('/api/admin/invitations', { adminKey: key }),
    create: (key, data) => request('/api/admin/invitations', { method: 'POST', body: data, adminKey: key }),
    update: (key, id, data) =>
      request(`/api/admin/invitations?id=${q(id)}`, { method: 'PATCH', body: data, adminKey: key }),
    importMany: (key, rows, { skipExisting = true } = {}) =>
      request('/api/admin/import', { method: 'POST', body: { rows, skipExisting }, adminKey: key }),
    remove: (key, id) => request(`/api/admin/invitations?id=${q(id)}`, { method: 'DELETE', adminKey: key }),
  },
}
