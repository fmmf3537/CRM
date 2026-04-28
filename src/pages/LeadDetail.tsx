import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, User, Phone, Mail, DollarSign, FileText, ArrowRightLeft, XCircle, Pencil, Hand } from 'lucide-react'
import { leadApi } from '../api/leads'
import { useAuth } from '../hooks/useAuth'
import type { Lead } from '../types/lead'
import { leadSourceLabels, leadStatusLabels, leadStatusColors, assignStatusLabels, priorityLabels } from '../types/lead'
import { industryLabels } from '../types/customer'
import LeadFormModal from '../components/leads/LeadFormModal'
import ConvertConfirmModal from '../components/leads/ConvertConfirmModal'
import AbandonModal from '../components/leads/AbandonModal'
import ActivityTimeline from '../components/activities/ActivityTimeline'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useAuth()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertLoading, setConvertLoading] = useState(false)
  const [abandonOpen, setAbandonOpen] = useState(false)
  const [abandonLoading, setAbandonLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  const loadLead = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leadApi.get(parseInt(id!, 10))
      setLead(data)
    } catch (err: any) {
      showMessage('error', err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id, showMessage])

  useEffect(() => {
    if (!id) return
    loadLead()
  }, [id, loadLead])

  async function handleConvert() {
    if (!lead) return
    setConvertLoading(true)
    try {
      const res = await leadApi.convert(lead.id)
      showMessage('success', `转化成功！已创建客户 #${res.customerId}`)
      setConvertOpen(false)
      loadLead()
    } catch (err: any) {
      showMessage('error', err.message || '转化失败')
    } finally {
      setConvertLoading(false)
    }
  }

  async function handleAbandon(reason: string) {
    if (!lead) return
    setAbandonLoading(true)
    try {
      await leadApi.abandon(lead.id, reason)
      showMessage('success', '线索已放弃')
      setAbandonOpen(false)
      loadLead()
    } catch (err: any) {
      showMessage('error', err.message || '放弃失败')
    } finally {
      setAbandonLoading(false)
    }
  }

  async function handleClaim() {
    if (!lead) return
    try {
      await leadApi.claim(lead.id)
      showMessage('success', '认领成功！')
      loadLead()
    } catch (err: any) {
      showMessage('error', err.message || '认领失败')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
  }

  if (!lead) {
    return <div className="text-center py-20"><p className="text-slate-500">线索不存在或已被删除</p>
      <button onClick={() => navigate('/leads')} className="mt-4 text-primary-600 hover:underline text-sm">返回线索列表</button></div>
  }

  const canAct = lead.status !== 'CONVERTED' && lead.status !== 'ABANDONED'

  return (
    <div className="space-y-5">
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/leads')} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${leadStatusColors[lead.status]}`}>{leadStatusLabels[lead.status]}</span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{lead.leadNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.assignStatus === 'UNASSIGNED' && (
            <button onClick={handleClaim} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Hand size={15} /> 认领
            </button>
          )}
          {canAct && (
            <>
              <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                <Pencil size={15} /> 编辑
              </button>
              <button onClick={() => setConvertOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">
                <ArrowRightLeft size={15} /> 转化
              </button>
              <button onClick={() => setAbandonOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">
                <XCircle size={15} /> 放弃
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Building2 size={16} className="text-primary-600" /> 基本信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">线索编号</p><p className="font-medium text-slate-900 font-mono">{lead.leadNo}</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">公司名称</p><p className="font-medium text-slate-900">{lead.name}</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">来源</p><p className="font-medium text-slate-900">{leadSourceLabels[lead.source]}</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">优先级</p><p className="font-medium text-slate-900">{priorityLabels[lead.priority]}</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">行业</p><p className="font-medium text-slate-900">{lead.industry ? industryLabels[lead.industry] : '-'}</p></div>
              <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500 mb-1">地区</p><p className="font-medium text-slate-900">{lead.region || '-'}</p></div>
            </div>
            {lead.budget && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
                <DollarSign size={14} className="text-slate-400" /> 预算：{lead.budget}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><User size={16} className="text-primary-600" /> 联系人信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><User size={18} className="text-slate-500" /></div>
                <div>
                  <p className="font-medium text-slate-900">{lead.contactName}</p>
                  {lead.contactTitle && <p className="text-sm text-slate-500">{lead.contactTitle}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 ml-13 pl-13">
                {lead.contactPhone && <span className="flex items-center gap-1"><Phone size={13} />{lead.contactPhone}</span>}
                {lead.contactEmail && <span className="flex items-center gap-1"><Mail size={13} />{lead.contactEmail}</span>}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText size={16} className="text-primary-600" /> 备注</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <ActivityTimeline leadId={lead.id} leadName={lead.name} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">分配信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">分配状态</span>
                <span className={`font-medium ${lead.assignStatus === 'UNASSIGNED' ? 'text-slate-600' : 'text-blue-700'}`}>{assignStatusLabels[lead.assignStatus]}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">负责人</span><span className="font-medium text-slate-900">{lead.assignee?.name || '-'}</span></div>
              {lead.assignedAt && (
                <div className="flex justify-between"><span className="text-slate-500">分配时间</span><span className="text-slate-700">{new Date(lead.assignedAt).toLocaleString('zh-CN')}</span></div>
              )}
              {lead.protectExpiry && (
                <div className="flex justify-between"><span className="text-slate-500">保护期截止</span>
                  <span className={`font-medium ${new Date(lead.protectExpiry) > new Date() ? 'text-amber-600' : 'text-slate-500'}`}>
                    {new Date(lead.protectExpiry).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">时间信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">创建时间</span><span className="text-slate-700">{new Date(lead.createdAt).toLocaleString('zh-CN')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">最后更新</span><span className="text-slate-700">{new Date(lead.updatedAt).toLocaleString('zh-CN')}</span></div>
            </div>
          </div>

          {lead.invalidReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-2">放弃原因</h3>
              <p className="text-sm text-red-600">{lead.invalidReason}</p>
            </div>
          )}

          {lead.convertedCustomerId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-emerald-700 mb-2">已转化</h3>
              <p className="text-sm text-emerald-600">已转化为客户 #{lead.convertedCustomerId}</p>
              <button onClick={() => navigate(`/customers/${lead.convertedCustomerId}`)}
                className="mt-2 text-sm text-emerald-700 hover:underline font-medium">查看客户</button>
            </div>
          )}
        </div>
      </div>

      <LeadFormModal open={editOpen} lead={lead} onClose={() => setEditOpen(false)}
        onSuccess={() => { showMessage('success', '线索更新成功'); loadLead(); }} />

      <ConvertConfirmModal open={convertOpen} lead={lead} onConfirm={handleConvert} onCancel={() => setConvertOpen(false)} loading={convertLoading} />

      <AbandonModal open={abandonOpen} leadName={lead.name} onConfirm={handleAbandon} onCancel={() => setAbandonOpen(false)} loading={abandonLoading} />
    </div>
  )
}
