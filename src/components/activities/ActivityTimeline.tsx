import { useState, useEffect, useCallback } from 'react'
import { Plus, Phone, MapPin, Calendar, FileText, MessageSquare, Users, Briefcase, Star, Clock, Pencil, Trash2 } from 'lucide-react'
import { activityApi } from '../../api/activities'
import type { Activity } from '../../types/activity'
import { activityTypeLabels, activityTypeColors, activityResultLabels, activityResultColors } from '../../types/activity'
import ActivityFormModal from './ActivityFormModal'
import DeleteConfirmModal from '../customers/DeleteConfirmModal'

interface Props {
  customerId?: number
  customerName?: string
  leadId?: number
  leadName?: string
}

const typeIcons: Record<string, React.ReactNode> = {
  PHONE: <Phone size={14} />,
  VISIT: <MapPin size={14} />,
  DEMO: <Star size={14} />,
  DINNER: <Users size={14} />,
  EXHIBITION: <Calendar size={14} />,
  MESSAGE: <MessageSquare size={14} />,
  NEGOTIATION: <Briefcase size={14} />,
  OTHER: <FileText size={14} />,
}

export default function ActivityTimeline({ customerId, customerName, leadId, leadName }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadActivities = useCallback(async () => {
    setLoading(true)
    try {
      let data: Activity[]
      if (customerId) data = await activityApi.byCustomer(customerId)
      else if (leadId) data = await activityApi.byLead(leadId)
      else data = []
      setActivities(data)
    } catch (err: any) {
      showMessage('error', err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [customerId, leadId])

  useEffect(() => {
    loadActivities()
  }, [customerId, leadId, loadActivities])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleDelete() {
    if (!deleteActivity) return
    try {
      await activityApi.delete(deleteActivity.id)
      showMessage('success', '活动已删除')
      setDeleteOpen(false)
      loadActivities()
    } catch (err: any) {
      showMessage('error', err.message || '删除失败')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">活动记录 ({activities.length})</h3>
        <button onClick={() => { setEditingActivity(null); setFormOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-medium transition-colors">
          <Plus size={13} /> 记录活动
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Calendar size={32} className="mx-auto mb-2 opacity-40" />
          <p>暂无活动记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activityTypeColors[act.type].replace('text-', 'text-opacity-80 ').split(' ')[0]}`}>
                    {typeIcons[act.type] || <FileText size={14} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{act.title}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${activityTypeColors[act.type]}`}>
                        {activityTypeLabels[act.type]}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${activityResultColors[act.result]}`}>
                        {activityResultLabels[act.result]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(act.time).toLocaleString('zh-CN')}</span>
                      {act.duration && <span>{act.duration} 分钟</span>}
                      {act.location && <span className="flex items-center gap-1"><MapPin size={11} />{act.location}</span>}
                      <span className="font-semibold text-primary-600">+{act.score} 分</span>
                    </div>
                    {act.content && <p className="text-sm text-slate-600 mt-2">{act.content}</p>}
                    {act.nextFollowUpAt && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                        <Calendar size={11} /> 下次跟进：{new Date(act.nextFollowUpAt).toLocaleString('zh-CN')}
                        {act.nextFollowUpNote && <span className="text-slate-500">- {act.nextFollowUpNote}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingActivity(act); setFormOpen(true); }}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => { setDeleteActivity(act); setDeleteOpen(true); }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ActivityFormModal
        open={formOpen}
        activity={editingActivity}
        defaultCustomerId={customerId}
        defaultCustomerName={customerName}
        defaultLeadId={leadId}
        defaultLeadName={leadName}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { showMessage('success', editingActivity ? '活动更新成功' : '活动记录成功'); loadActivities(); }}
      />

      <DeleteConfirmModal open={deleteOpen} customerName={deleteActivity?.title || ''} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </div>
  )
}
