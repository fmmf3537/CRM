import { Industry } from './customer'

export const LeadSource = {
  WEBSITE: 'WEBSITE',
  EXHIBITION: 'EXHIBITION',
  PHONE: 'PHONE',
  REFERRAL: 'REFERRAL',
  ADVERTISEMENT: 'ADVERTISEMENT',
  WALK_IN: 'WALK_IN',
  OTHER: 'OTHER',
} as const
export type LeadSource = typeof LeadSource[keyof typeof LeadSource]

export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  CONVERTED: 'CONVERTED',
  ABANDONED: 'ABANDONED',
} as const
export type LeadStatus = typeof LeadStatus[keyof typeof LeadStatus]

export const AssignStatus = {
  UNASSIGNED: 'UNASSIGNED',
  ASSIGNED: 'ASSIGNED',
} as const
export type AssignStatus = typeof AssignStatus[keyof typeof AssignStatus]

export const Priority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const
export type Priority = typeof Priority[keyof typeof Priority]

export interface Lead {
  id: number
  leadNo: string
  name: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
  contactTitle?: string
  source: LeadSource
  status: LeadStatus
  assignStatus: AssignStatus
  priority: Priority
  industry?: Industry
  region?: string
  budget?: string
  notes?: string
  assigneeId?: number
  assignee?: { id: number; name: string } | null
  assignedAt?: string
  protectExpiry?: string
  invalidReason?: string
  convertedCustomerId?: number
  createdAt: string
  updatedAt: string
}

export interface LeadListResponse {
  data: Lead[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface LeadFormData {
  name: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
  contactTitle?: string
  source: LeadSource
  priority: Priority
  industry?: Industry
  region?: string
  budget?: string
  notes?: string
}

export interface LeadStats {
  total: number
  converted: number
  conversionRate: string
  bySource: { source: LeadSource; count: number }[]
  byStatus: { status: LeadStatus; count: number }[]
}

export const leadSourceLabels: Record<LeadSource, string> = {
  [LeadSource.WEBSITE]: '官网',
  [LeadSource.EXHIBITION]: '展会',
  [LeadSource.PHONE]: '电话咨询',
  [LeadSource.REFERRAL]: '客户推荐',
  [LeadSource.ADVERTISEMENT]: '广告投放',
  [LeadSource.WALK_IN]: '上门拜访',
  [LeadSource.OTHER]: '其他',
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: '新建',
  [LeadStatus.CONTACTED]: '已联系',
  [LeadStatus.QUALIFIED]: '已确认意向',
  [LeadStatus.CONVERTED]: '已转化',
  [LeadStatus.ABANDONED]: '已放弃',
}

export const leadStatusColors: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'bg-slate-100 text-slate-600 border-slate-200',
  [LeadStatus.CONTACTED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [LeadStatus.QUALIFIED]: 'bg-amber-50 text-amber-700 border-amber-200',
  [LeadStatus.CONVERTED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [LeadStatus.ABANDONED]: 'bg-red-50 text-red-700 border-red-200',
}

export const assignStatusLabels: Record<AssignStatus, string> = {
  [AssignStatus.UNASSIGNED]: '未分配',
  [AssignStatus.ASSIGNED]: '已分配',
}

export const priorityLabels: Record<Priority, string> = {
  [Priority.HIGH]: '高',
  [Priority.MEDIUM]: '中',
  [Priority.LOW]: '低',
}

export const priorityColors: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-100 text-red-700',
  [Priority.MEDIUM]: 'bg-amber-100 text-amber-700',
  [Priority.LOW]: 'bg-slate-100 text-slate-600',
}
