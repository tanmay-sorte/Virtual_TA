import { API_BASE_URL } from './config'


function extractErrorMessage(data, fallback) {
  // Common FastAPI error shapes
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length) {
      // Pydantic validation errors array
      return data.detail.map(d => d.msg || d.loc?.join('.') || '').filter(Boolean).join('; ');
    }
  }
  if (data.message) return data.message;
  return fallback;
}


/**
 * Fetch list of jobs with pagination/sort.
 * Defaults: limit=10, sort=opening_date, order=asc (earlier openings first).
 */
export async function fetchJobs({ page = 1, limit = 10, sort = 'opening_date', order = 'asc' } = {}) {
  const url = new URL(`${API_BASE_URL}/v1/jobs`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('sort', sort)
  url.searchParams.set('order', order)

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  })

  let data = null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
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
  // Expected shape: { items: [...], total, page, limit }
  return data
}


export async function createJob(payload) {
  const res = await fetch(`${API_BASE_URL}/v1/jobs/create`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const message = extractErrorMessage(data, `Failed to create job (HTTP ${res.status})`);
    throw new Error(message);
  }
  return data;
}

