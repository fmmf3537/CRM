import { useState, useEffect } from 'react'
import { X, MapPin, Clock, Calendar, FileText, Bell, Building2, Target } from 'lucide-react'
import type { Activity, ActivityFormData } from '../../types/activity'
import { ActivityType, ActivityResult, activityTypeLabels, activityResultLabels } from '../../types/activity'
import { activityApi } from '../../api/activities'

interface Props {
  open: boolean
  activity?: Activity | null
  defaultCustomerId?: number
  defaultCustomerName?: string
  defaultLeadId?: number
  defaultLeadName?: string
  onClose: () => void
  onSuccess: () => void
}

export default function ActivityFormModal({ open, activity, defaultCustomerId, defaultCustomerName, defaultLeadId, defaultLeadName, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<ActivityFormData>({
    type: ActivityType.PHONE,
    title: '',
    content: '',
    time: new Date().toISOString().slice(0, 16),
    duration: undefined,
    location: '',
    result: ActivityResult.PENDING,
    customerId: defaultCustomerId,
    leadId: defaultLeadId,
    nextFollowUpAt: '',
    nextFollowUpNote: '',
  })

  useEffect(() => {
    if (open && activity) {
      setForm({
        type: activity.type,
        title: activity.title,
        content: activity.content || '',
        time: activity.time ? activity.time.slice(0, 16) : '',
        duration: activity.duration,
        location: activity.location || '',
        result: activity.result,
        customerId: activity.customerId,
        leadId: activity.leadId,
        nextFollowUpAt: activity.nextFollowUpAt ? activity.nextFollowUpAt.slice(0, 16) : '',
        nextFollowUpNote: activity.nextFollowUpNote || '',
      })
    } else if (open) {
      setForm({
        type: ActivityType.PHONE,
        title: '',
        content: '',
        time: new Date().toISOString().slice(0, 16),
        duration: undefined,
        location: '',
        result: ActivityResult.PENDING,
        customerId: defaultCustomerId,
        leadId: defaultLeadId,
        nextFollowUpAt: '',
        nextFollowUpNote: '',
      })
    }
    setErrors({})
  }, [open, activity, defaultCustomerId, defaultLeadId])

  if (!open) return null

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = '活动主题为必填项'
    if (!form.time) e.time = '活动时间为必填项'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      if (activity) {
        await activityApi.update(activity.id, form)
      } else {
        await activityApi.create(form)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrors({ submit: err.message || '操作失败' })
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof ActivityFormData>(field: K, value: ActivityFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{activity ? '编辑活动' : '记录活动'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {errors.submit && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{errors.submit}</div>}

          {(defaultCustomerName || defaultLeadName) && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
              {defaultCustomerName && <><Building2 size={14} className="text-primary-600" /> 关联客户：{defaultCustomerName}</>}
              {defaultLeadName && <><Target size={14} className="text-primary-600" /> 关联线索：{defaultLeadName}</>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">活动类型</label>
              <select value={form.type} onChange={(e) => updateField('type', e.target.value as ActivityType)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {Object.entries(activityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">活动结果</label>
              <select value={form.result} onChange={(e) => updateField('result', e.target.value as ActivityResult)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {Object.entries(activityResultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">活动主题 <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.title ? 'border-red-300' : 'border-slate-200'}`}
              placeholder="如：首次电话沟通" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">活动时间 <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="datetime-local" value={form.time} onChange={(e) => updateField('time', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.time ? 'border-red-300' : 'border-slate-200'}`} />
              </div>
              {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">时长（分钟）</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={form.duration || ''} onChange={(e) => updateField('duration', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="30" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">地点</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={form.location || ''} onChange={(e) => updateField('location', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="会议地点或地址" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">活动内容</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea value={form.content || ''} onChange={(e) => updateField('content', e.target.value)} rows={3}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="记录沟通内容..." />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Bell size={14} /> 下次跟进</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">跟进时间</label>
                <input type="datetime-local" value={form.nextFollowUpAt || ''} onChange={(e) => updateField('nextFollowUpAt', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">跟进备注</label>
                <input type="text" value={form.nextFollowUpNote || ''} onChange={(e) => updateField('nextFollowUpNote', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="待办事项..." />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">取消</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-300 text-white text-sm font-medium rounded-lg transition-colors">
            {loading ? '保存中...' : (activity ? '保存修改' : '记录活动')}
          </button>
        </div>
      </div>
    </div>
  )
}
