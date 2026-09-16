// Split out of api.ts so both the real fetch-backed client and demoApi.ts
// (the standalone, no-backend implementation, see demoApi.ts) can throw the
// exact same class. Pages check errors with `err instanceof ApiError` (see
// Login.tsx, Checkout.tsx), which only works if every caller imports the
// same module instance, so this stays the one place the class is defined.
export class ApiError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
