import { useState, useEffect } from 'react'
import { X, Building2, User, Phone, Mail, Briefcase, MapPin, DollarSign, FileText } from 'lucide-react'
import type { Lead, LeadFormData } from '../../types/lead'
import { LeadSource, Priority, leadSourceLabels, priorityLabels } from '../../types/lead'
import { Industry, industryLabels } from '../../types/customer'
import { leadApi } from '../../api/leads'

interface Props {
  open: boolean
  lead?: Lead | null
  onClose: () => void
  onSuccess: () => void
}

export default function LeadFormModal({ open, lead, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<LeadFormData>({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactTitle: '',
    source: LeadSource.OTHER,
    priority: Priority.MEDIUM,
    industry: undefined,
    region: '',
    budget: '',
    notes: '',
  })

  useEffect(() => {
    if (open && lead) {
      setForm({
        name: lead.name,
        contactName: lead.contactName,
        contactPhone: lead.contactPhone || '',
        contactEmail: lead.contactEmail || '',
        contactTitle: lead.contactTitle || '',
        source: lead.source,
        priority: lead.priority,
        industry: lead.industry,
        region: lead.region || '',
        budget: lead.budget || '',
        notes: lead.notes || '',
      })
    } else if (open) {
      setForm({
        name: '', contactName: '', contactPhone: '', contactEmail: '', contactTitle: '',
        source: LeadSource.OTHER, priority: Priority.MEDIUM, industry: undefined,
        region: '', budget: '', notes: '',
      })
    }
    setErrors({})
  }, [open, lead])

  if (!open) return null

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '公司名称必填'
    if (!form.contactName.trim()) e.contactName = '联系人姓名必填'
    if (form.contactPhone && !/^1[3-9]\d{9}$/.test(form.contactPhone)) {
      e.contactPhone = '手机号格式错误'
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      e.contactEmail = '邮箱格式错误'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      if (lead) {
        await leadApi.update(lead.id, form)
      } else {
        await leadApi.create(form)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrors({ submit: err.message || '操作失败' })
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{lead ? '编辑线索' : '新增线索'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{errors.submit}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">公司名称 <span className="text-red-500">*</span></label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
                placeholder="请输入公司名称" />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">联系人 <span className="text-red-500">*</span></label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contactName ? 'border-red-300' : 'border-slate-200'}`} />
              </div>
              {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">职位</label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.contactTitle} onChange={(e) => updateField('contactTitle', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contactPhone ? 'border-red-300' : 'border-slate-200'}`}
                  placeholder="11位手机号" />
              </div>
              {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.contactEmail ? 'border-red-300' : 'border-slate-200'}`} />
              </div>
              {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">来源</label>
              <select value={form.source} onChange={(e) => updateField('source', e.target.value as LeadSource)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {Object.entries(leadSourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
              <select value={form.priority} onChange={(e) => updateField('priority', e.target.value as Priority)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">行业</label>
              <select value={form.industry || ''} onChange={(e) => updateField('industry', e.target.value ? (e.target.value as Industry) : undefined)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="">请选择</option>
                {Object.entries(industryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">地区</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.region} onChange={(e) => updateField('region', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">预算</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={form.budget} onChange={(e) => updateField('budget', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="如：50-100万" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">备注</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="补充信息..." />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">取消</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-300 text-white text-sm font-medium rounded-lg transition-colors">
            {loading ? '保存中...' : (lead ? '保存修改' : '创建线索')}
          </button>
        </div>
      </div>
    </div>
  )
}
