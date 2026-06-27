/**
 * Shared API client utilities.
 * All feature services should import from here instead of duplicating this logic.
 */

/** URLs attempted in order; first successful response wins. */
const API_BASE_URLS: string[] = [
  import.meta.env.VITE_API_BASE_URL,
  'https://localhost:7093',
  'http://localhost:5166',
].filter((url): url is string => Boolean(url))

/** Shape every backend endpoint returns. */
interface ApiResponse<T> {
  apiCodeStatus: string
  statusCode: number
  message: string
  status: string
  payload: T
}

/**
 * Unwraps an API response, throwing on non-SUCCESS status codes so React Query
 * can surface the error correctly.
 */
export async function unwrap<T>(response: Response): Promise<T> {
  const body = (await response.json()) as Partial<ApiResponse<T>> & { payload?: T; data?: T }

  if (!response.ok || (body.status && body.status !== 'SUCCESS')) {
    throw new Error(body.message ?? 'API request failed')
  }

  return (body.payload ?? body.data) as T
}

/**
 * Tries each base URL in order and returns the first successful Response.
 * Falls back gracefully if a server is not reachable (CORS / network errors).
 */
export async function fetchWithFallback(path: string): Promise<Response> {
  let lastError: unknown = null

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`)
      // Return immediately on success or on any non-404 status
      if (response.ok || response.status !== 404) return response
      lastError = new Error(`404 from ${baseUrl}`)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to reach API')
}
