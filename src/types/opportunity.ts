export const OpportunityStage = {
  STAGE_01: 'STAGE_01',
  STAGE_02: 'STAGE_02',
  STAGE_03: 'STAGE_03',
  STAGE_04: 'STAGE_04',
  STAGE_05: 'STAGE_05',
  STAGE_99: 'STAGE_99',
} as const
export type OpportunityStage = typeof OpportunityStage[keyof typeof OpportunityStage]

export const OpportunityStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  WON: 'WON',
  LOST: 'LOST',
} as const
export type OpportunityStatus = typeof OpportunityStatus[keyof typeof OpportunityStatus]

export const stageLabels: Record<OpportunityStage, string> = {
  [OpportunityStage.STAGE_01]: '线索',
  [OpportunityStage.STAGE_02]: '需求确认',
  [OpportunityStage.STAGE_03]: '方案报价',
  [OpportunityStage.STAGE_04]: '商务谈判',
  [OpportunityStage.STAGE_05]: '签约成交',
  [OpportunityStage.STAGE_99]: '流失',
}

export const stageColors: Record<OpportunityStage, string> = {
  [OpportunityStage.STAGE_01]: 'bg-slate-100 text-slate-600 border-slate-200',
  [OpportunityStage.STAGE_02]: 'bg-blue-50 text-blue-700 border-blue-200',
  [OpportunityStage.STAGE_03]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [OpportunityStage.STAGE_04]: 'bg-amber-50 text-amber-700 border-amber-200',
  [OpportunityStage.STAGE_05]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [OpportunityStage.STAGE_99]: 'bg-red-50 text-red-700 border-red-200',
}

export const stageBarColors: Record<OpportunityStage, string> = {
  [OpportunityStage.STAGE_01]: 'bg-slate-400',
  [OpportunityStage.STAGE_02]: 'bg-blue-500',
  [OpportunityStage.STAGE_03]: 'bg-indigo-500',
  [OpportunityStage.STAGE_04]: 'bg-amber-500',
  [OpportunityStage.STAGE_05]: 'bg-emerald-500',
  [OpportunityStage.STAGE_99]: 'bg-red-500',
}

export const WIN_RATE_MAP: Record<OpportunityStage, number> = {
  [OpportunityStage.STAGE_01]: 10,
  [OpportunityStage.STAGE_02]: 25,
  [OpportunityStage.STAGE_03]: 50,
  [OpportunityStage.STAGE_04]: 75,
  [OpportunityStage.STAGE_05]: 100,
  [OpportunityStage.STAGE_99]: 0,
}

export const STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.STAGE_01,
  OpportunityStage.STAGE_02,
  OpportunityStage.STAGE_03,
  OpportunityStage.STAGE_04,
  OpportunityStage.STAGE_05,
  OpportunityStage.STAGE_99,
]

export const statusLabels: Record<OpportunityStatus, string> = {
  [OpportunityStatus.IN_PROGRESS]: '进行中',
  [OpportunityStatus.WON]: '已赢单',
  [OpportunityStatus.LOST]: '已输单',
}

export const statusColors: Record<OpportunityStatus, string> = {
  [OpportunityStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-200',
  [OpportunityStatus.WON]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [OpportunityStatus.LOST]: 'bg-red-50 text-red-700 border-red-200',
}

export interface StageHistory {
  id: number
  opportunityId: number
  fromStage: OpportunityStage
  toStage: OpportunityStage
  changedAt: string
  remarks?: string
  changedById: number
  changedBy?: { id: number; name: string }
}

export interface Opportunity {
  id: number
  name: string
  customerId: number
  customer?: { id: number; name: string }
  amount: number
  currency: string
  stage: OpportunityStage
  status: OpportunityStatus
  winRate: number
  expectedCloseDate?: string
  ownerId: number
  owner?: { id: number; name: string }
  description?: string
  source?: string
  competitor?: string
  closedAt?: string
  closeReason?: string
  createdAt: string
  updatedAt: string
  stageHistories?: StageHistory[]
}

export interface OpportunityFormData {
  name: string
  customerId: number
  amount?: number
  currency?: string
  stage?: OpportunityStage
  expectedCloseDate?: string
  description?: string
  source?: string
  competitor?: string
}

export interface OpportunityListResponse {
  data: Opportunity[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface PipelineData {
  pipeline: {
    stage: OpportunityStage
    count: number
    amount: number
    winRate: number
    conversionRate: string
  }[]
  totalAmount: number
  totalCount: number
  lostCount: number
  lostAmount: number
}
