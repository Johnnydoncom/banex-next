/**
 * Typed API client for Banex Marketplace backend.
 *
 * Wraps fetch with auth-token injection, error handling, and typed responses.
 * Works both in server components (pass token manually) and client components
 * (token auto-injected when using the useApi hook).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

type FetchOptions = {
  token?: string
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, params?: FetchOptions["params"]) {
  // Fix URL construction to properly append paths to the base URL
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL
  const endpointPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${baseUrl}${endpointPath}`)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

function buildHeaders(token?: string, extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(
      data?.message || `Request failed with status ${res.status}`,
      res.status,
      data,
    )
  }

  return data as T
}

/** GET request */
export async function apiGet<T = any>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const res = await fetch(buildUrl(path, opts.params), {
    method: "GET",
    headers: buildHeaders(opts.token, opts.headers),
    signal: opts.signal,
  })
  return handleResponse<T>(res)
}

/** POST request (JSON body) */
export async function apiPost<T = any>(
  path: string,
  body?: Record<string, any> | FormData,
  opts: FetchOptions = {},
): Promise<T> {
  const isFormData = body instanceof FormData
  const headers = buildHeaders(opts.token, opts.headers)
  if (!isFormData) headers["Content-Type"] = "application/json"

  const res = await fetch(buildUrl(path, opts.params), {
    method: "POST",
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  })
  return handleResponse<T>(res)
}

/** PUT request (JSON body) */
export async function apiPut<T = any>(
  path: string,
  body?: Record<string, any>,
  opts: FetchOptions = {},
): Promise<T> {
  const res = await fetch(buildUrl(path, opts.params), {
    method: "PUT",
    headers: buildHeaders(opts.token, {
      "Content-Type": "application/json",
      ...opts.headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  })
  return handleResponse<T>(res)
}

/** DELETE request */
export async function apiDelete<T = any>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const res = await fetch(buildUrl(path, opts.params), {
    method: "DELETE",
    headers: buildHeaders(opts.token, opts.headers),
    signal: opts.signal,
  })
  return handleResponse<T>(res)
}
