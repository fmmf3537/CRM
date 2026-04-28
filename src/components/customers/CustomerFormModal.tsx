import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Plus, Trash2, User, Phone, Mail, MessageCircle, Building2, MapPin, DollarSign, Clock, Users, Briefcase } from 'lucide-react'
import type { Customer, CustomerFormData, ContactFormData, BusinessInfoFormData } from '../../types/customer'
import { Industry, Scale, CustomerGrade, CustomerStatus, DecisionRole, industryLabels, scaleLabels, gradeLabels, statusLabels, decisionRoleLabels } from '../../types/customer'
import { customerApi } from '../../api/customers'

interface Props {
  open: boolean
  customer?: Customer | null
  onClose: () => void
  onSuccess: () => void
}

const steps = ['基本信息', '联系人', '业务信息']

const emptyContact: ContactFormData = {
  name: '',
  title: '',
  phone: '',
  email: '',
  wechat: '',
  decisionRole: DecisionRole.TECHNICAL_CONTACT,
  isPrimary: false,
}

const emptyBusinessInfo: BusinessInfoFormData = {
  requirements: '',
  interestedProducts: '',
  budget: '',
  purchaseTime: '',
  competitors: '',
  specialRequirements: '',
}

export default function CustomerFormModal({ open, customer, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<CustomerFormData>({
    name: '',
    alias: '',
    industry: Industry.AGRICULTURE,
    scale: Scale.MEDIUM,
    region: '',
    address: '',
    source: '',
    grade: CustomerGrade.C,
    status: CustomerStatus.POTENTIAL,
    contacts: [{ ...emptyContact }],
    businessInfo: { ...emptyBusinessInfo },
  })

  useEffect(() => {
    if (open && customer) {
      setForm({
        name: customer.name,
        alias: customer.alias || '',
        industry: customer.industry,
        scale: customer.scale,
        region: customer.region,
        address: customer.address || '',
        source: customer.source || '',
        grade: customer.grade,
        status: customer.status,
        contacts: customer.contacts?.length
          ? customer.contacts.map((c) => ({
              name: c.name,
              title: c.title || '',
              phone: c.phone || '',
              email: c.email || '',
              wechat: c.wechat || '',
              decisionRole: c.decisionRole,
              isPrimary: c.isPrimary,
            }))
          : [{ ...emptyContact }],
        businessInfo: customer.businessInfo
          ? {
              requirements: customer.businessInfo.requirements || '',
              interestedProducts: customer.businessInfo.interestedProducts || '',
              budget: customer.businessInfo.budget || '',
              purchaseTime: customer.businessInfo.purchaseTime || '',
              competitors: customer.businessInfo.competitors || '',
              specialRequirements: customer.businessInfo.specialRequirements || '',
            }
          : { ...emptyBusinessInfo },
      })
    } else if (open) {
      setForm({
        name: '',
        alias: '',
        industry: Industry.AGRICULTURE,
        scale: Scale.MEDIUM,
        region: '',
        address: '',
        source: '',
        grade: CustomerGrade.C,
        status: CustomerStatus.POTENTIAL,
        contacts: [{ ...emptyContact }],
        businessInfo: { ...emptyBusinessInfo },
      })
    }
    setStep(0)
    setErrors({})
  }, [open, customer])

  if (!open) return null

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.name.trim()) e.name = '客户名称必填'
      if (!form.region.trim()) e.region = '地区必填'
      // phone/email validation can be added here
    }
    if (s === 1) {
      form.contacts?.forEach((c, i) => {
        if (!c.name.trim()) e[`contact_${i}_name`] = '联系人姓名必填'
        if (c.phone && !/^1[3-9]\d{9}$/.test(c.phone)) e[`contact_${i}_phone`] = '手机号格式错误'
        if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e[`contact_${i}_email`] = '邮箱格式错误'
      })
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validateStep(step)) return
    if (step < 2) {
      setStep(step + 1)
      return
    }
    setLoading(true)
    try {
      if (customer) {
        await customerApi.update(customer.id, form)
      } else {
        await customerApi.create(form)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrors({ submit: err.message || '操作失败' })
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateContact(index: number, field: keyof ContactFormData, value: any) {
    setForm((f) => {
      const contacts = [...(f.contacts || [])]
      contacts[index] = { ...contacts[index], [field]: value }
      return { ...f, contacts }
    })
  }

  function addContact() {
    setForm((f) => ({
      ...f,
      contacts: [...(f.contacts || []), { ...emptyContact }],
    }))
  }

  function removeContact(index: number) {
    setForm((f) => ({
      ...f,
      contacts: (f.contacts || []).filter((_, i) => i !== index),
    }))
  }

  function updateBusinessField(field: keyof BusinessInfoFormData, value: string) {
    setForm((f) => ({
      ...f,
      businessInfo: { ...(f.businessInfo || {}), [field]: value },
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {customer ? '编辑客户' : '新增客户'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    i === step ? 'bg-white text-primary-600' : i < step ? 'bg-primary-200 text-primary-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  {s}
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight size={16} className="text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {errors.submit && (
            <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {errors.submit}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    客户名称 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="请输入客户公司全称"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">客户简称</label>
                  <input
                    type="text"
                    value={form.alias}
                    onChange={(e) => updateField('alias', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="简称或别名"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    所属行业 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => updateField('industry', e.target.value as Industry)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {Object.entries(industryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">企业规模</label>
                  <select
                    value={form.scale}
                    onChange={(e) => updateField('scale', e.target.value as Scale)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {Object.entries(scaleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    地区 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => updateField('region', e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.region ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="如：北京市"
                    />
                  </div>
                  {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">客户来源</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => updateField('source', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如：展会、推荐、官网"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">详细地址</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入详细地址"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">客户等级</label>
                  <select
                    value={form.grade}
                    onChange={(e) => updateField('grade', e.target.value as CustomerGrade)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {Object.entries(gradeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">客户状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value as CustomerStatus)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users size={16} />
                  联系人信息
                </h3>
                <button
                  onClick={addContact}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Plus size={14} />
                  添加联系人
                </button>
              </div>

              {form.contacts?.map((contact, index) => (
                <div key={index} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">联系人 {index + 1}</span>
                    {form.contacts!.length > 1 && (
                      <button
                        onClick={() => removeContact(index)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">姓名 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(index, 'name', e.target.value)}
                          className={`w-full pl-8 pr-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[`contact_${index}_name`] ? 'border-red-300' : 'border-slate-200'}`}
                        />
                      </div>
                      {errors[`contact_${index}_name`] && <p className="text-xs text-red-500 mt-0.5">{errors[`contact_${index}_name`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">职位</label>
                      <input
                        type="text"
                        value={contact.title}
                        onChange={(e) => updateContact(index, 'title', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">手机号</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) => updateContact(index, 'phone', e.target.value)}
                          className={`w-full pl-8 pr-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[`contact_${index}_phone`] ? 'border-red-300' : 'border-slate-200'}`}
                          placeholder="11位手机号"
                        />
                      </div>
                      {errors[`contact_${index}_phone`] && <p className="text-xs text-red-500 mt-0.5">{errors[`contact_${index}_phone`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">邮箱</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          className={`w-full pl-8 pr-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[`contact_${index}_email`] ? 'border-red-300' : 'border-slate-200'}`}
                        />
                      </div>
                      {errors[`contact_${index}_email`] && <p className="text-xs text-red-500 mt-0.5">{errors[`contact_${index}_email`]}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">微信号</label>
                      <div className="relative">
                        <MessageCircle size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={contact.wechat}
                          onChange={(e) => updateContact(index, 'wechat', e.target.value)}
                          className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">决策角色</label>
                      <select
                        value={contact.decisionRole}
                        onChange={(e) => updateContact(index, 'decisionRole', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        {Object.entries(decisionRoleLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={(e) => updateContact(index, 'isPrimary', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600">设为主要联系人</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Briefcase size={16} />
                业务信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">感兴趣的产品</label>
                  <input
                    type="text"
                    value={form.businessInfo?.interestedProducts}
                    onChange={(e) => updateBusinessField('interestedProducts', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如：ZT-800巡检无人机"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">预算范围</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.businessInfo?.budget}
                      onChange={(e) => updateBusinessField('budget', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="如：50-100万"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">预计采购时间</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.businessInfo?.purchaseTime}
                    onChange={(e) => updateBusinessField('purchaseTime', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如：2026年Q3"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">需求描述</label>
                <textarea
                  value={form.businessInfo?.requirements}
                  onChange={(e) => updateBusinessField('requirements', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="描述客户的具体需求..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">竞争对手</label>
                <input
                  type="text"
                  value={form.businessInfo?.competitors}
                  onChange={(e) => updateBusinessField('competitors', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="客户正在对比的竞争对手"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">特殊要求</label>
                <textarea
                  value={form.businessInfo?.specialRequirements}
                  onChange={(e) => updateBusinessField('specialRequirements', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="客户的特殊技术要求或服务要求"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            上一步
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? '保存中...' : step === 2 ? (customer ? '保存修改' : '创建客户') : '下一步'}
              {step < 2 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
