/** Error thrown for non-2xx API responses, carrying the { error, code } body. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message)
  }
}

/** fetch() wrapper for the app's JSON API routes. */
export async function apiFetch<T>(
  input: string,
  init?: Omit<RequestInit, 'body'> & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = init ?? {}
  const res = await fetch(input, {
    ...rest,
    ...(json !== undefined
      ? {
          body: JSON.stringify(json),
          headers: { 'Content-Type': 'application/json', ...rest.headers },
        }
      : {}),
  })
  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string; code?: string })
    | null
  if (!res.ok) {
    throw new ApiError(
      body?.error ?? 'Something went wrong. Please try again.',
      body?.code ?? 'unknown_error',
      res.status
    )
  }
  return body as T
}
