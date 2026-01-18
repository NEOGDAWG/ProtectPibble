import { camelizeKeys, decamelizeKeys } from './case'
import { clearAuthToken, getAuthToken } from '../auth/storage'

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  const url = (base || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  
  // Log in development to help debug
  if (import.meta.env.DEV) {
    console.log('[API] Using backend URL:', url)
    if (!base) {
      console.warn('[API] VITE_API_BASE_URL not set! Using default:', url)
      console.warn('[API] Set VITE_API_BASE_URL in Vercel environment variables')
    }
  }
  
  return url
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function apiFetch<TResponse>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<TResponse> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  // Auth endpoints don't require a token
  const isAuthEndpoint = path === '/auth/login' || path === '/auth/register'
  
  // Require JWT token for all endpoints except auth
  if (!isAuthEndpoint) {
    const token = getAuthToken()
    if (!token) {
      throw new ApiError(
        "Authentication required. Please login or register.",
        401,
        { detail: "Authentication required" }
      )
    }
    headers.set('Authorization', `Bearer ${token.accessToken}`)
  }

  let body: BodyInit | undefined = init?.body as BodyInit | undefined
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    const converted = decamelizeKeys(init.json)
    body = JSON.stringify(converted)
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[API] Request body (original):', init.json)
      console.log('[API] Request body (converted):', converted)
    }
  }

  const apiUrl = `${getApiBaseUrl()}${path}`
  
  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[API] Making request to:', apiUrl)
    console.log('[API] Method:', init?.method || 'GET')
  }
  
  try {
    const res = await fetch(apiUrl, { ...init, headers, body })
    const contentType = res.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const parsed = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

    if (!res.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (res.status === 401 && !isAuthEndpoint) {
        // Clear invalid token (but not for login/register endpoints)
        clearAuthToken()
        // Redirect to login will be handled by the component
      }

      const detail =
        typeof parsed === 'object' && parsed !== null && 'detail' in parsed
          ? (parsed as { detail?: unknown }).detail
          : undefined
      const msg = detail ? String(detail) : `Request failed (${res.status})`
      throw new ApiError(msg, res.status, parsed)
    }

    return camelizeKeys(parsed) as TResponse
  } catch (error) {
    // Handle network errors, CORS errors, etc.
    if (error instanceof ApiError) {
      throw error
    }
    
    // Check if it's a CORS error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
      throw new ApiError(
        `Network error: Unable to connect to backend. Please check that ${apiUrl} is accessible and CORS is configured correctly.`,
        0,
        { detail: errorMessage }
      )
    }
    
    throw new ApiError(
      `Network error: ${errorMessage}`,
      0,
      { detail: errorMessage }
    )
  }
}

export const api = {
  // Auth endpoints
  register: (req: import('./types').RegisterRequest) =>
    apiFetch<import('./types').AuthResponse>('/auth/register', { method: 'POST', json: req }),
  login: (req: import('./types').LoginRequest) =>
    apiFetch<import('./types').AuthResponse>('/auth/login', { method: 'POST', json: req }),

  // Groups
  getMyGroups: () => apiFetch<import('./types').MyGroupsResponse>('/groups/my'),
  createGroup: (req: import('./types').CreateGroupRequest) =>
    apiFetch<import('./types').CreateGroupResponse>('/groups', { method: 'POST', json: req }),
  joinGroup: (req: import('./types').JoinGroupRequest) =>
    apiFetch<import('./types').JoinGroupResponse>('/groups/join', { method: 'POST', json: req }),

  getGroupState: (groupId: string) =>
    apiFetch<import('./types').GroupStateResponse>(`/groups/${groupId}/state`),

  // Tasks
  createTask: (groupId: string, req: import('./types').CreateTaskRequest) =>
    apiFetch<import('./types').TaskState>(`/groups/${groupId}/tasks`, { method: 'POST', json: req }),
  updateTask: (taskId: string, req: import('./types').UpdateTaskRequest) =>
    apiFetch<import('./types').TaskState>(`/tasks/${taskId}`, { method: 'PATCH', json: req }),
  deleteTask: (taskId: string) => apiFetch<{ ok: boolean }>(`/tasks/${taskId}`, { method: 'DELETE' }),
  completeTask: (taskId: string, req: import('./types').CompleteTaskRequest) =>
    apiFetch<{ ok: boolean }>(`/tasks/${taskId}/complete`, { method: 'POST', json: req }),

  // Nudges
  sendNudge: (groupId: string, req: import('./types').NudgeRequest) =>
    apiFetch<import('./types').NudgeResponse>(`/groups/${groupId}/nudges`, { method: 'POST', json: req }),
}

