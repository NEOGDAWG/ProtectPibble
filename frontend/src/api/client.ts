import { camelizeKeys, decamelizeKeys } from './case'
import { getDemoIdentity } from '../auth/storage'

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (base || 'http://127.0.0.1:8000').replace(/\/+$/, '')
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
  const identity = getDemoIdentity()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  if (identity) {
    headers.set('X-Demo-Email', identity.email)
    headers.set('X-Demo-Name', identity.name)
  }

  let body: BodyInit | undefined = init?.body as BodyInit | undefined
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(decamelizeKeys(init.json))
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers, body })
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const parsed = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    const detail =
      typeof parsed === 'object' && parsed !== null && 'detail' in parsed
        ? (parsed as { detail?: unknown }).detail
        : undefined
    const msg = detail ? String(detail) : `Request failed (${res.status})`
    throw new ApiError(msg, res.status, parsed)
  }

  return camelizeKeys(parsed) as TResponse
}

export const api = {
  // Auth is handled via headers in apiFetch

  getMyGroups: () => apiFetch<import('./types').MyGroupsResponse>('/groups/my'),
  createGroup: (req: import('./types').CreateGroupRequest) =>
    apiFetch<import('./types').CreateGroupResponse>('/groups', { method: 'POST', json: req }),
  joinGroup: (req: import('./types').JoinGroupRequest) =>
    apiFetch<import('./types').JoinGroupResponse>('/groups/join', { method: 'POST', json: req }),

  getGroupState: (groupId: string) =>
    apiFetch<import('./types').GroupStateResponse>(`/groups/${groupId}/state`),

  createTask: (groupId: string, req: import('./types').CreateTaskRequest) =>
    apiFetch<import('./types').TaskState>(`/groups/${groupId}/tasks`, { method: 'POST', json: req }),
  updateTask: (taskId: string, req: import('./types').UpdateTaskRequest) =>
    apiFetch<import('./types').TaskState>(`/tasks/${taskId}`, { method: 'PATCH', json: req }),
  deleteTask: (taskId: string) => apiFetch<{ ok: boolean }>(`/tasks/${taskId}`, { method: 'DELETE' }),
  completeTask: (taskId: string, req: import('./types').CompleteTaskRequest) =>
    apiFetch<{ ok: boolean }>(`/tasks/${taskId}/complete`, { method: 'POST', json: req }),

  sendNudge: (groupId: string, req: import('./types').NudgeRequest) =>
    apiFetch<import('./types').NudgeResponse>(`/groups/${groupId}/nudges`, { method: 'POST', json: req }),
}

