export const TargetType = {
  ANNUAL: 'ANNUAL',
  QUARTERLY: 'QUARTERLY',
  MONTHLY: 'MONTHLY',
} as const
export type TargetType = typeof TargetType[keyof typeof TargetType]

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
} as const
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

export const targetTypeLabels: Record<TargetType, string> = {
  [TargetType.ANNUAL]: '年度',
  [TargetType.QUARTERLY]: '季度',
  [TargetType.MONTHLY]: '月度',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: '待回款',
  [PaymentStatus.PAID]: '已回款',
}

export const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200',
  [PaymentStatus.PAID]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export interface Target {
  id: number
  type: TargetType
  year: number
  quarter: number | null
  month: number | null
  amount: number
  currency: string
  ownerId: number
  owner?: { id: number; name: string; role: string }
  createdById: number
  createdBy?: { id: number; name: string }
  createdAt: string
  updatedAt: string
}

export interface TargetFormData {
  type: TargetType
  year: number
  quarter?: number
  month?: number
  amount: number
  currency?: string
  ownerId: number
}

export interface Payment {
  id: number
  achievementId: number
  amount: number
  paymentDate?: string
  status: PaymentStatus
  createdAt: string
}

export interface Achievement {
  id: number
  name: string
  customerId: number
  customer?: { id: number; name: string }
  opportunityId: number | null
  opportunity?: { id: number; name: string }
  amount: number
  currency: string
  contractDate: string
  createdById: number
  createdBy?: { id: number; name: string }
  createdAt: string
  updatedAt: string
  payments: Payment[]
}

export interface AchievementFormData {
  name: string
  customerId: number
  opportunityId?: number
  amount: number
  currency?: string
  contractDate: string
  payments?: PaymentFormData[]
}

export interface PaymentFormData {
  amount: number
  paymentDate?: string
  status?: PaymentStatus
}

export interface PerformanceSummary {
  period: string
  year: number
  quarter?: number
  month?: number
  targetAmount: number
  dealAmount: number
  paidAmount: number
  orderCount: number
  avgOrderValue: number
  completionRate: number
}

export interface RankingItem {
  userId: number
  userName: string
  userRole: string
  rank: number
  targetAmount: number
  dealAmount: number
  paidAmount: number
  orderCount: number
  avgOrderValue: number
  completionRate: number
}

export interface RankingResponse {
  period: string
  year: number
  quarter?: number
  month?: number
  data: RankingItem[]
}
