export type GroupMode = 'FRIEND' | 'INSTRUCTOR'
export type GroupRole = 'student' | 'instructor'

export type TaskType = 'ASSIGNMENT' | 'QUIZ' | 'LECTURE' | 'EXAM' | 'OTHER'
export type TaskStatusValue = 'NOT_DONE' | 'DONE' | 'EXCUSED'

export type EventType =
  | 'GROUP_CREATED'
  | 'MEMBER_JOINED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_MISSED'
  | 'PET_DAMAGED'
  | 'NUDGE_SENT'

export type ClassRef = { code: string; term: string; school?: string | null }

export type GroupSummary = {
  id: string
  name: string
  mode: GroupMode
  inviteCode: string
  role: GroupRole
  class: ClassRef
}

export type MyGroupsResponse = { groups: GroupSummary[] }
export type CreateGroupRequest = {
  classCode: string
  term: string
  school?: string | null
  mode: GroupMode
  groupName: string
}
export type CreateGroupResponse = { group: GroupSummary }
export type JoinGroupRequest = { inviteCode: string }
export type JoinGroupResponse = { group: GroupSummary }

export type UserRef = { id: string; displayName: string }

export type TaskState = {
  id: string
  title: string
  type: TaskType
  dueAt: string
  penalty: number
  myStatus: TaskStatusValue
  stats: { doneCount: number; totalCount: number }
}

export type PetState = {
  name: string
  health: number
  maxHealth: number
  avatarUrl?: string | null
}

export type EventOut = {
  type: EventType
  taskId?: string | null
  delta?: number | null
  message?: string | null
  createdAt: string
  actor?: UserRef | null
  target?: UserRef | null
}

export type LeaderboardEntry = {
  user: UserRef
  doneCount: number
  missedCount: number
}

export type GroupStateResponse = {
  group: { id: string; name: string; mode: GroupMode; class: ClassRef }
  pet: PetState
  tasks: TaskState[]
  leaderboard?: LeaderboardEntry[] | null
  recentEvents: EventOut[]
  viewer?: { role: GroupRole } // optional until backend adds it
}

export type CreateTaskRequest = {
  title: string
  type: TaskType
  dueAt: string
  penalty: number
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>

export type CompleteTaskRequest = { status: TaskStatusValue }

export type NudgeRequest = { toUserId: string; taskId?: string; message?: string }
export type NudgeResponse = { ok: boolean }

