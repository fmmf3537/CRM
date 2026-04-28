// Role type available from './notification' if needed

export interface AdminUser {
  id: number
  username: string
  name: string
  role: string
  createdAt: string
}

export interface AdminUserFormData {
  username: string
  name: string
  password: string
  role: string
}

export interface ConfigItem {
  value: string
  label: string
  score?: number
  winRate?: number
}

export type ConfigKey =
  | 'customerGrades'
  | 'industries'
  | 'productCategories'
  | 'regions'
  | 'leadSources'
  | 'activityTypes'
  | 'stages'

export const configKeyLabels: Record<ConfigKey, string> = {
  customerGrades: '客户等级',
  industries: '行业',
  productCategories: '产品分类',
  regions: '地区',
  leadSources: '线索来源',
  activityTypes: '活动类型',
  stages: '销售阶段',
}
