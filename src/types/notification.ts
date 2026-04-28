export const NotificationType = {
  NEW_LEAD_ASSIGNMENT: 'NEW_LEAD_ASSIGNMENT',
  FOLLOW_UP_REMINDER: 'FOLLOW_UP_REMINDER',
  OVERDUE_REMINDER: 'OVERDUE_REMINDER',
  TARGET_REMINDER: 'TARGET_REMINDER',
  STAGE_ADVANCE: 'STAGE_ADVANCE',
  SYSTEM_NOTICE: 'SYSTEM_NOTICE',
} as const
export type NotificationType = typeof NotificationType[keyof typeof NotificationType]

export const notificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.NEW_LEAD_ASSIGNMENT]: '新线索分配',
  [NotificationType.FOLLOW_UP_REMINDER]: '跟进提醒',
  [NotificationType.OVERDUE_REMINDER]: '逾期提醒',
  [NotificationType.TARGET_REMINDER]: '目标提醒',
  [NotificationType.STAGE_ADVANCE]: '阶段推进',
  [NotificationType.SYSTEM_NOTICE]: '系统公告',
}

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  content?: string
  readAt?: string
  relatedId?: number
  relatedType?: string
  createdAt: string
}

export interface NotificationListResponse {
  data: Notification[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
