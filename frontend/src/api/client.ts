/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api'

function token(): string | null {
  return localStorage.getItem('token')
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  const t = token()
  if (t) headers.set('Authorization', `Bearer ${t}`)

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = 'Error de servidor'
    try {
      const data = await res.json()
      message = data.error || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  const ctype = res.headers.get('content-type') || ''
  if (ctype.includes('application/pdf')) {
    return (await res.blob()) as T
  }
  return res.json() as Promise<T>
}

export async function downloadPdf(
  body: { companyIds?: string[]; extractionIds?: string[]; title?: string }
): Promise<void> {
  const blob = await api<Blob>('/export/pdf', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'directorio-export.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
