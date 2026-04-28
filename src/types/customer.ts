import type { Activity } from './activity'

export const CustomerGrade = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const
export type CustomerGrade = typeof CustomerGrade[keyof typeof CustomerGrade]

export const CustomerStatus = {
  POTENTIAL: 'POTENTIAL',
  FOLLOWING: 'FOLLOWING',
  WON: 'WON',
  LOST: 'LOST',
} as const
export type CustomerStatus = typeof CustomerStatus[keyof typeof CustomerStatus]

export const Industry = {
  AGRICULTURE: 'AGRICULTURE',
  SECURITY: 'SECURITY',
  LOGISTICS: 'LOGISTICS',
  SURVEYING: 'SURVEYING',
  ENVIRONMENT: 'ENVIRONMENT',
  FILM: 'FILM',
  CONSTRUCTION: 'CONSTRUCTION',
  ENERGY: 'ENERGY',
  TELECOM: 'TELECOM',
  FIREFIGHTING: 'FIREFIGHTING',
  MINING: 'MINING',
  FORESTRY: 'FORESTRY',
  MARITIME: 'MARITIME',
  TRANSPORTATION: 'TRANSPORTATION',
  REAL_ESTATE: 'REAL_ESTATE',
  TOURISM: 'TOURISM',
  EMERGENCY: 'EMERGENCY',
  MILITARY: 'MILITARY',
  SCIENTIFIC_RESEARCH: 'SCIENTIFIC_RESEARCH',
  EDUCATION: 'EDUCATION',
} as const
export type Industry = typeof Industry[keyof typeof Industry]

export const Scale = {
  LARGE: 'LARGE',
  MEDIUM: 'MEDIUM',
  SMALL: 'SMALL',
  MICRO: 'MICRO',
} as const
export type Scale = typeof Scale[keyof typeof Scale]

export const DecisionRole = {
  DECISION_MAKER: 'DECISION_MAKER',
  INFLUENCER: 'INFLUENCER',
  USER: 'USER',
  TECHNICAL_CONTACT: 'TECHNICAL_CONTACT',
  PURCHASER: 'PURCHASER',
} as const
export type DecisionRole = typeof DecisionRole[keyof typeof DecisionRole]

export interface Contact {
  id: number
  name: string
  title?: string
  phone?: string
  email?: string
  wechat?: string
  decisionRole: DecisionRole
  isPrimary: boolean
  customerId: number
}

export interface BusinessInfo {
  id: number
  requirements?: string
  interestedProducts?: string
  budget?: string
  purchaseTime?: string
  competitors?: string
  specialRequirements?: string
  customerId: number
}

export interface Customer {
  id: number
  name: string
  alias?: string
  industry: Industry
  scale: Scale
  region: string
  address?: string
  source?: string
  grade: CustomerGrade
  status: CustomerStatus
  createdAt: string
  updatedAt: string
  lastFollowUpAt?: string
  ownerId: number
  owner?: { id: number; name: string }
  contacts?: Contact[]
  businessInfo?: BusinessInfo | null
  activities?: Activity[]
  _count?: { contacts: number }
}

export interface CustomerListResponse {
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CustomerFormData {
  name: string
  alias?: string
  industry: Industry
  scale: Scale
  region: string
  address?: string
  source?: string
  grade: CustomerGrade
  status: CustomerStatus
  contacts?: ContactFormData[]
  businessInfo?: BusinessInfoFormData
}

export interface ContactFormData {
  name: string
  title?: string
  phone?: string
  email?: string
  wechat?: string
  decisionRole: DecisionRole
  isPrimary: boolean
}

export interface BusinessInfoFormData {
  requirements?: string
  interestedProducts?: string
  budget?: string
  purchaseTime?: string
  competitors?: string
  specialRequirements?: string
}

export const industryLabels: Record<Industry, string> = {
  [Industry.AGRICULTURE]: '农业植保',
  [Industry.SECURITY]: '城市安防',
  [Industry.LOGISTICS]: '物流配送',
  [Industry.SURVEYING]: '测绘勘探',
  [Industry.ENVIRONMENT]: '环境监测',
  [Industry.FILM]: '影视航拍',
  [Industry.CONSTRUCTION]: '建筑工程',
  [Industry.ENERGY]: '能源电力',
  [Industry.TELECOM]: '通信巡检',
  [Industry.FIREFIGHTING]: '消防救援',
  [Industry.MINING]: '矿山开采',
  [Industry.FORESTRY]: '林业巡护',
  [Industry.MARITIME]: '海事巡查',
  [Industry.TRANSPORTATION]: '交通运输',
  [Industry.REAL_ESTATE]: '房地产开发',
  [Industry.TOURISM]: '旅游观光',
  [Industry.EMERGENCY]: '应急管理',
  [Industry.MILITARY]: '国防军事',
  [Industry.SCIENTIFIC_RESEARCH]: '科学研究',
  [Industry.EDUCATION]: '教育培训',
}

export const scaleLabels: Record<Scale, string> = {
  [Scale.LARGE]: '大型企业',
  [Scale.MEDIUM]: '中型企业',
  [Scale.SMALL]: '小型企业',
  [Scale.MICRO]: '微型企业',
}

export const gradeLabels: Record<CustomerGrade, string> = {
  [CustomerGrade.A]: 'A级 - 战略客户',
  [CustomerGrade.B]: 'B级 - 重要客户',
  [CustomerGrade.C]: 'C级 - 普通客户',
  [CustomerGrade.D]: 'D级 - 潜在客户',
}

export const statusLabels: Record<CustomerStatus, string> = {
  [CustomerStatus.POTENTIAL]: '潜在客户',
  [CustomerStatus.FOLLOWING]: '跟进中',
  [CustomerStatus.WON]: '已成交',
  [CustomerStatus.LOST]: '已流失',
}

export const statusColors: Record<CustomerStatus, string> = {
  [CustomerStatus.POTENTIAL]: 'bg-slate-100 text-slate-600 border-slate-200',
  [CustomerStatus.FOLLOWING]: 'bg-blue-50 text-blue-700 border-blue-200',
  [CustomerStatus.WON]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [CustomerStatus.LOST]: 'bg-red-50 text-red-700 border-red-200',
}

export const decisionRoleLabels: Record<DecisionRole, string> = {
  [DecisionRole.DECISION_MAKER]: '决策人',
  [DecisionRole.INFLUENCER]: '影响人',
  [DecisionRole.USER]: '使用人',
  [DecisionRole.TECHNICAL_CONTACT]: '技术联系人',
  [DecisionRole.PURCHASER]: '采购人',
}
