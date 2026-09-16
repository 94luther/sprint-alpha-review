import type {
  AuthResult,
  CatalogResponse,
  CreateOrderPayload,
  Order,
  OpsState
} from './types'
import { ApiError } from './apiError'
import * as demoApi from './demoApi'

const API_URL = import.meta.env.VITE_API_URL
// Standalone/artifact build: no backend exists at all (see demoApi.ts), so
// every function below hands off to the in-browser implementation instead
// of calling fetch. This is the one place that decision gets made, so no
// page ever needs to know or care which mode it is running in.
const STANDALONE = import.meta.env.VITE_DEMO_STANDALONE === '1'

export { ApiError }

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  })

  if (!res.ok) {
    let body: { code?: string; message?: string } = {}
    try {
      body = await res.json()
    } catch {
      // no body, that is fine
    }
    throw new ApiError(
      body.message || `Something went wrong talking to Sprint (${res.status}).`,
      res.status,
      body.code
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function login(phone: string, pin: string): Promise<AuthResult> {
  if (STANDALONE) return demoApi.login(phone, pin)
  return request<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin })
  })
}

export function getCatalog(): Promise<CatalogResponse> {
  if (STANDALONE) return demoApi.getCatalog()
  return request<CatalogResponse>('/catalog')
}

export function createOrder(
  token: string,
  idempotencyKey: string,
  payload: CreateOrderPayload
): Promise<Order> {
  if (STANDALONE) return demoApi.createOrder(token, idempotencyKey, payload)
  return request<Order>('/orders', {
    method: 'POST',
    token,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload)
  })
}

export function getOrder(token: string, orderId: string): Promise<Order> {
  if (STANDALONE) return demoApi.getOrder(token, orderId)
  return request<Order>(`/orders/${orderId}`, { token })
}

export function getOpsState(token: string): Promise<OpsState> {
  if (STANDALONE) return demoApi.getOpsState(token)
  return request<OpsState>('/ops/state', { token })
}

export function newIdempotencyKey(): string {
  if ('randomUUID' in crypto) return crypto.randomUUID()
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
