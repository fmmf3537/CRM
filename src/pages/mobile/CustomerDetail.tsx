import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Building2, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { customerApi } from '../../api/customers'
import type { Customer } from '../../types/customer'
import { industryLabels, scaleLabels, gradeLabels, statusLabels, statusColors, decisionRoleLabels } from '../../types/customer'

export default function MobileCustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    basic: true,
    contacts: false,
    business: false,
    activities: false,
  })

  useEffect(() => {
    if (!id) return
    async function loadCustomer() {
      setLoading(true)
      try {
        const data = await customerApi.get(parseInt(id || '0', 10))
        setCustomer(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadCustomer()
  }, [id])

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500">客户不存在</p>
        <button onClick={() => navigate('/mobile/customers')} className="mt-2 text-blue-600 text-sm">返回</button>
      </div>
    )
  }

  const sections = [
    {
      key: 'basic',
      title: '基本信息',
      content: (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">行业</span>
            <span className="text-gray-800">{industryLabels[customer.industry]}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">规模</span>
            <span className="text-gray-800">{scaleLabels[customer.scale]}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">等级</span>
            <span className="text-gray-800">{gradeLabels[customer.grade]}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">状态</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[customer.status]}`}>
              {statusLabels[customer.status]}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">地区</span>
            <span className="text-gray-800">{customer.region}</span>
          </div>
          {customer.address && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">地址</span>
              <span className="text-gray-800 text-right max-w-[60%]">{customer.address}</span>
            </div>
          )}
          {customer.source && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">来源</span>
              <span className="text-gray-800">{customer.source}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'contacts',
      title: `联系人 (${customer.contacts?.length || 0})`,
      content: (
        <div className="space-y-3">
          {customer.contacts?.length === 0 && <p className="text-sm text-gray-400">暂无联系人</p>}
          {customer.contacts?.map((contact) => (
            <div key={contact.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{contact.name}</span>
                {contact.isPrimary && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">主联系人</span>
                )}
              </div>
              {contact.title && <p className="text-xs text-gray-500 mt-0.5">{contact.title}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-blue-600 bg-white px-2 py-1 rounded border border-gray-100 min-h-[28px]">
                    <Phone size={10} />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-blue-600 bg-white px-2 py-1 rounded border border-gray-100 min-h-[28px]">
                    <Mail size={10} />
                    {contact.email}
                  </a>
                )}
              </div>
              {contact.decisionRole && (
                <p className="text-[10px] text-gray-400 mt-1">{decisionRoleLabels[contact.decisionRole]}</p>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'business',
      title: '业务信息',
      content: customer.businessInfo ? (
        <div className="space-y-3 text-sm">
          {customer.businessInfo.requirements && (
            <div>
              <span className="text-gray-500 text-xs">需求描述</span>
              <p className="text-gray-800 mt-0.5">{customer.businessInfo.requirements}</p>
            </div>
          )}
          {customer.businessInfo.interestedProducts && (
            <div>
              <span className="text-gray-500 text-xs">感兴趣产品</span>
              <p className="text-gray-800 mt-0.5">{customer.businessInfo.interestedProducts}</p>
            </div>
          )}
          {customer.businessInfo.budget && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">预算</span>
              <span className="text-gray-800">{customer.businessInfo.budget}</span>
            </div>
          )}
          {customer.businessInfo.purchaseTime && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">预计采购时间</span>
              <span className="text-gray-800">{customer.businessInfo.purchaseTime}</span>
            </div>
          )}
          {customer.businessInfo.competitors && (
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">竞争对手</span>
              <span className="text-gray-800">{customer.businessInfo.competitors}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">暂无业务信息</p>
      ),
    },
    {
      key: 'activities',
      title: '活动记录',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">活动记录请在桌面端查看</p>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => navigate('/mobile/customers')} className="w-10 h-10 flex items-center justify-center -ml-2 min-h-[44px]">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="flex-1 text-center text-sm font-semibold text-gray-900 pr-8">客户详情</h1>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[customer.status]}`}>
                {statusLabels[customer.status]}
              </span>
              <span className="text-xs text-gray-400">{industryLabels[customer.industry]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="px-4 mt-3 space-y-3">
        {sections.map((section) => (
          <div key={section.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between px-4 py-3 min-h-[44px]"
            >
              <span className="text-sm font-semibold text-gray-800">{section.title}</span>
              {expanded[section.key] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expanded[section.key] && (
              <div className="px-4 pb-4">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Fixed Action Button */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-2 bg-white/90 backdrop-blur border-t border-gray-100">
        <button
          onClick={() => navigate('/mobile/activities')}
          className="w-full bg-blue-600 text-white rounded-lg h-11 text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Calendar size={16} />
          记录活动
        </button>
      </div>
    </div>
  )
}
