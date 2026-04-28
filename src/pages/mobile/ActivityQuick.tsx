import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Mic, Send, Check } from 'lucide-react'
import { activityApi } from '../../api/activities'
import { customerApi } from '../../api/customers'
import { ActivityType, activityTypeLabels } from '../../types/activity'

export default function MobileActivityQuick() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState<ActivityType>(ActivityType.PHONE)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    customerApi.list({ pageSize: 100 }).then((res) => {
      setCustomers(res.data)
      if (res.data.length > 0) setCustomerId(String(res.data[0].id))
    }).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!customerId || !title) return
    setSubmitting(true)
    try {
      await activityApi.create({
        type,
        title,
        content,
        time: new Date().toISOString(),
        customerId: parseInt(customerId, 10),
      })
      setSuccess(true)
      setTitle('')
      setContent('')
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const types = Object.entries(activityTypeLabels) as [ActivityType, string][]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => navigate('/mobile')} className="w-10 h-10 flex items-center justify-center -ml-2 min-h-[44px]">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="flex-1 text-center text-sm font-semibold text-gray-900 pr-8">快速记录活动</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Success toast */}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
            <Check size={16} />
            记录成功
          </div>
        )}

        {/* Customer Select */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">选择客户</label>
          <select
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm h-11 min-h-[44px]"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Activity Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">活动类型</label>
          <div className="flex flex-wrap gap-2">
            {types.map(([t, label]) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium min-h-[36px] transition-colors ${
                  type === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">活动标题</label>
          <input
            type="text"
            placeholder="如：电话沟通需求"
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm h-11 min-h-[44px]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">内容记录</label>
          <textarea
            placeholder="记录沟通内容..."
            rows={5}
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => alert('相机功能预留')}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3 text-sm text-gray-600 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Camera size={16} />
            拍照
          </button>
          <button
            type="button"
            onClick={() => alert('语音输入预留')}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3 text-sm text-gray-600 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Mic size={16} />
            语音
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !title || !customerId}
          className="w-full bg-blue-600 text-white rounded-xl h-12 text-sm font-medium flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? '提交中...' : '提交记录'}
        </button>
      </div>
    </div>
  )
}
