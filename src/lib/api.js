export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
// Thin fetch wrapper. The session cookie is httpOnly and same-origin (Vite proxies /api to the server in dev).
export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch('/api' + path, {
      method, credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch { throw new ApiError(0, 'Cannot reach the server') }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (res.status === 401 && !path.startsWith('/auth/')) dispatchEvent(new Event('cranberry:signed-out')) // session expired mid-use
  if (!res.ok) throw new ApiError(res.status, data?.error?.message || `Request failed (${res.status})`)
  return data
}
