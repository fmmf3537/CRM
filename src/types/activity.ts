export const ActivityType = {
  PHONE: 'PHONE',
  VISIT: 'VISIT',
  DEMO: 'DEMO',
  DINNER: 'DINNER',
  EXHIBITION: 'EXHIBITION',
  MESSAGE: 'MESSAGE',
  NEGOTIATION: 'NEgotiation',
  OTHER: 'OTHER',
} as const
export type ActivityType = typeof ActivityType[keyof typeof ActivityType]

export const ActivityResult = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  PENDING: 'PENDING',
} as const
export type ActivityResult = typeof ActivityResult[keyof typeof ActivityResult]

export const activityTypeLabels: Record<ActivityType, string> = {
  [ActivityType.PHONE]: '电话沟通',
  [ActivityType.VISIT]: '上门拜访',
  [ActivityType.DEMO]: '产品演示',
  [ActivityType.DINNER]: '商务宴请',
  [ActivityType.EXHIBITION]: '展会活动',
  [ActivityType.MESSAGE]: '消息沟通',
  [ActivityType.NEGOTIATION]: '商务谈判',
  [ActivityType.OTHER]: '其他',
}

export const activityTypeColors: Record<ActivityType, string> = {
  [ActivityType.PHONE]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ActivityType.VISIT]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ActivityType.DEMO]: 'bg-purple-50 text-purple-700 border-purple-200',
  [ActivityType.DINNER]: 'bg-amber-50 text-amber-700 border-amber-200',
  [ActivityType.EXHIBITION]: 'bg-rose-50 text-rose-700 border-rose-200',
  [ActivityType.MESSAGE]: 'bg-slate-50 text-slate-600 border-slate-200',
  [ActivityType.NEGOTIATION]: 'bg-orange-50 text-orange-700 border-orange-200',
  [ActivityType.OTHER]: 'bg-gray-50 text-gray-600 border-gray-200',
}

export const activityResultLabels: Record<ActivityResult, string> = {
  [ActivityResult.VALID]: '有效',
  [ActivityResult.INVALID]: '无效',
  [ActivityResult.PENDING]: '待跟进',
}

export const activityResultColors: Record<ActivityResult, string> = {
  [ActivityResult.VALID]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ActivityResult.INVALID]: 'bg-red-50 text-red-700 border-red-200',
  [ActivityResult.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200',
}

export const SCORE_MAP: Record<ActivityType, number> = {
  [ActivityType.PHONE]: 1,
  [ActivityType.VISIT]: 3,
  [ActivityType.DEMO]: 4,
  [ActivityType.DINNER]: 2,
  [ActivityType.EXHIBITION]: 5,
  [ActivityType.MESSAGE]: 0.5,
  [ActivityType.NEGOTIATION]: 4,
  [ActivityType.OTHER]: 1,
}

export interface Activity {
  id: number
  type: ActivityType
  title: string
  content?: string
  time: string
  duration?: number
  location?: string
  result: ActivityResult
  score: number
  nextFollowUpAt?: string
  nextFollowUpNote?: string
  customerId?: number
  customer?: { id: number; name: string } | null
  leadId?: number
  lead?: { id: number; name: string; leadNo: string } | null
  createdById: number
  createdBy?: { id: number; name: string }
  createdAt: string
  updatedAt: string
}

export interface ActivityFormData {
  type: ActivityType
  title: string
  content?: string
  time: string
  duration?: number
  location?: string
  result?: ActivityResult
  customerId?: number
  leadId?: number
  nextFollowUpAt?: string
  nextFollowUpNote?: string
}

export interface ActivityListResponse {
  data: Activity[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface WorkloadStats {
  period: string
  totalActivities: number
  totalScore: number
  dailyAverage: string
  byType: { type: ActivityType; count: number; score: number }[]
  trend: { date: string; count: number; score: number }[]
}
