import { X, User, Phone, Mail, MessageCircle, MapPin, Building2, Calendar, DollarSign, FileText, Users, Briefcase } from 'lucide-react'
import type { Customer } from '../../types/customer'
import { industryLabels, scaleLabels, statusLabels, statusColors, decisionRoleLabels } from '../../types/customer'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
  onEdit: (customer: Customer) => void
}

export default function CustomerDetailDrawer({ open, customer, onClose, onEdit }: Props) {
  if (!open || !customer) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-auto shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">客户详情</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              编辑
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-slate-50 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-lg font-bold">
                  {customer.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{customer.name}</h3>
                  {customer.alias && <p className="text-sm text-slate-500">{customer.alias}</p>}
                </div>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[customer.status]}`}>
                {statusLabels[customer.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 size={14} className="text-slate-400" />
                {industryLabels[customer.industry]}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={14} className="text-slate-400" />
                {scaleLabels[customer.scale]}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                {customer.region}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                {new Date(customer.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>

            {customer.address && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600 flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                {customer.address}
              </div>
            )}
          </div>

          {/* Business Info */}
          {customer.businessInfo && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-primary-600" />
                业务信息
              </h4>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {customer.businessInfo.interestedProducts && (
                  <div className="px-4 py-3 flex items-start gap-3">
                    <DollarSign size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">感兴趣的产品</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.interestedProducts}</p>
                    </div>
                  </div>
                )}
                {customer.businessInfo.budget && (
                  <div className="px-4 py-3 flex items-start gap-3">
                    <DollarSign size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">预算范围</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.budget}</p>
                    </div>
                  </div>
                )}
                {customer.businessInfo.purchaseTime && (
                  <div className="px-4 py-3 flex items-start gap-3">
                    <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">预计采购时间</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.purchaseTime}</p>
                    </div>
                  </div>
                )}
                {customer.businessInfo.requirements && (
                  <div className="px-4 py-3 flex items-start gap-3">
                    <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">需求描述</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.requirements}</p>
                    </div>
                  </div>
                )}
                {customer.businessInfo.competitors && (
                  <div className="px-4 py-3 flex items-start gap-3">
                    <Users size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">竞争对手</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.competitors}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary-600" />
              联系人 ({customer.contacts?.length || 0})
            </h4>
            <div className="space-y-2">
              {customer.contacts?.map((contact) => (
                <div key={contact.id} className={`border rounded-xl p-4 ${contact.isPrimary ? 'border-primary-200 bg-primary-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                        <User size={14} />
                      </div>
                      <div>
                        <span className="font-medium text-slate-900">{contact.name}</span>
                        {contact.title && <span className="text-sm text-slate-500 ml-2">{contact.title}</span>}
                      </div>
                    </div>
                    {contact.isPrimary && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">主要联系人</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 ml-10">
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {contact.phone}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {contact.email}
                      </span>
                    )}
                    {contact.wechat && (
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} />
                        {contact.wechat}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {decisionRoleLabels[contact.decisionRole]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <p>创建时间：{new Date(customer.createdAt).toLocaleString('zh-CN')}</p>
            <p>最后更新：{new Date(customer.updatedAt).toLocaleString('zh-CN')}</p>
            <p>负责人：{customer.owner?.name || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
