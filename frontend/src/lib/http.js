import { API_BASE_URL } from './config'

function extractErrorMessage(data, status) {
  if (!data) return `Request failed with status ${status}`
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    const msgs = data.detail
      .map((d) => (typeof d?.msg === 'string' ? d.msg : null))
      .filter(Boolean)
    if (msgs.length) return msgs.join('; ')
  }
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  try {
    return JSON.stringify(data)
  } catch {
    return `Request failed with status ${status}`
  }
}

export async function postJson(path, body) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  let data = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null)
  } else {
    const text = await res.text().catch(() => '')
    data = text ? { detail: text } : null
  }

  if (!res.ok) {
    const message = extractErrorMessage(data, res.status)
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

/** NEW: application/x-www-form-urlencoded submit */
export async function postForm(path, paramsObject) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const body = new URLSearchParams()
  Object.entries(paramsObject || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) body.append(k, String(v))
  })

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  let data = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null)
  } else {
    const text = await res.text().catch(() => '')
    data = text ? { detail: text } : null
  }

  if (!res.ok) {
    const message = extractErrorMessage(data, res.status)
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}