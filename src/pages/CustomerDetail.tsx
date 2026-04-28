import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, MessageCircle, MapPin, Calendar, DollarSign, Users, Briefcase, Pencil } from 'lucide-react'
import { customerApi } from '../api/customers'
import type { Customer } from '../types/customer'
import { industryLabels, scaleLabels, statusLabels, statusColors, decisionRoleLabels } from '../types/customer'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import ActivityTimeline from '../components/activities/ActivityTimeline'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'activities' | 'opportunities'>('info')
  const [editOpen, setEditOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  const loadCustomer = useCallback(async () => {
    setLoading(true)
    try {
      const data = await customerApi.get(parseInt(id!, 10))
      setCustomer(data)
    } catch (err: any) {
      showMessage('error', err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id, showMessage])

  useEffect(() => {
    if (!id) return
    loadCustomer()
  }, [id, loadCustomer])

  const tabs = [
    { key: 'info' as const, label: '基本信息' },
    { key: 'contacts' as const, label: '联系人' },
    { key: 'activities' as const, label: '活动记录' },
    { key: 'opportunities' as const, label: '商机' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">客户不存在或已被删除</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-primary-600 hover:underline text-sm"
        >
          返回客户列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right ${
          message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{customer.alias || industryLabels[customer.industry]}</p>
          </div>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Pencil size={15} />
          编辑客户
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-xl font-bold">
              {customer.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[customer.status]}`}>
                  {statusLabels[customer.status]}
                </span>
              </div>
              {customer.alias && <p className="text-sm text-slate-500">{customer.alias}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">客户等级</p>
            <p className="text-lg font-bold text-slate-900">{customer.grade}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">所属行业</p>
            <p className="font-medium text-slate-900">{industryLabels[customer.industry]}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">企业规模</p>
            <p className="font-medium text-slate-900">{scaleLabels[customer.scale]}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">地区</p>
            <p className="font-medium text-slate-900">{customer.region}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">客户来源</p>
            <p className="font-medium text-slate-900">{customer.source || '-'}</p>
          </div>
        </div>

        {customer.address && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} className="text-slate-400" />
            {customer.address}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 px-2">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {customer.businessInfo && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-primary-600" />
                    业务信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.businessInfo.interestedProducts && (
                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">感兴趣的产品</p>
                        <p className="text-sm font-medium text-slate-900">{customer.businessInfo.interestedProducts}</p>
                      </div>
                    )}
                    {customer.businessInfo.budget && (
                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">预算范围</p>
                        <p className="text-sm font-medium text-slate-900">{customer.businessInfo.budget}</p>
                      </div>
                    )}
                    {customer.businessInfo.purchaseTime && (
                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">预计采购时间</p>
                        <p className="text-sm font-medium text-slate-900">{customer.businessInfo.purchaseTime}</p>
                      </div>
                    )}
                    {customer.businessInfo.competitors && (
                      <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">竞争对手</p>
                        <p className="text-sm font-medium text-slate-900">{customer.businessInfo.competitors}</p>
                      </div>
                    )}
                  </div>
                  {customer.businessInfo.requirements && (
                    <div className="mt-4 border border-slate-200 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">需求描述</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.requirements}</p>
                    </div>
                  )}
                  {customer.businessInfo.specialRequirements && (
                    <div className="mt-4 border border-slate-200 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">特殊要求</p>
                      <p className="text-sm text-slate-900">{customer.businessInfo.specialRequirements}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-600" />
                  时间信息
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">创建时间</p>
                    <p className="text-slate-900">{new Date(customer.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">最后更新</p>
                    <p className="text-slate-900">{new Date(customer.updatedAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">最近跟进</p>
                    <p className="text-slate-900">{customer.lastFollowUpAt ? new Date(customer.lastFollowUpAt).toLocaleString('zh-CN') : '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {customer.contacts?.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  暂无联系人
                </div>
              )}
              {customer.contacts?.map((contact) => (
                <div key={contact.id} className={`border rounded-xl p-5 ${contact.isPrimary ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{contact.name}</span>
                          {contact.isPrimary && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">主要联系人</span>
                          )}
                        </div>
                        {contact.title && <p className="text-sm text-slate-500">{contact.title}</p>}
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {decisionRoleLabels[contact.decisionRole]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {contact.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={13} />
                        {contact.phone}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail size={13} />
                        {contact.email}
                      </div>
                    )}
                    {contact.wechat && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MessageCircle size={13} />
                        {contact.wechat}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activities' && customer && (
            <ActivityTimeline customerId={customer.id} customerName={customer.name} />
          )}

          {activeTab === 'opportunities' && (
            <div className="text-center py-10 text-slate-400">
              <DollarSign size={32} className="mx-auto mb-2 opacity-40" />
              <p>商机管理功能开发中...</p>
            </div>
          )}
        </div>
      </div>

      <CustomerFormModal
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          showMessage('success', '客户更新成功')
          loadCustomer()
        }}
      />
    </div>
  )
}
