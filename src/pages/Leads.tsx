import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Eye, Pencil, ArrowRightLeft, XCircle, Hand, ChevronLeft, ChevronRight, Building2, User, Phone } from 'lucide-react'
import { leadApi } from '../api/leads'
import { useAuth } from '../hooks/useAuth'
import type { Lead } from '../types/lead'
import { leadSourceLabels, leadStatusLabels, leadStatusColors, assignStatusLabels, priorityLabels, priorityColors } from '../types/lead'
import LeadFormModal from '../components/leads/LeadFormModal'
import ConvertConfirmModal from '../components/leads/ConvertConfirmModal'
import AbandonModal from '../components/leads/AbandonModal'
import DeleteConfirmModal from '../components/customers/DeleteConfirmModal'

export default function Leads() {
  const navigate = useNavigate()
  useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned'>('all')

  const [data, setData] = useState<Lead[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)
  const [convertLoading, setConvertLoading] = useState(false)
  const [abandonOpen, setAbandonOpen] = useState(false)
  const [abandonLead, setAbandonLead] = useState<Lead | null>(null)
  const [abandonLoading, setAbandonLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLead, _setDeleteLead] = useState<Lead | null>(null)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: pagination.pageSize, keyword: debouncedKeyword, source, status, region }
      if (activeTab === 'unassigned') {
        params.assignStatus = 'UNASSIGNED'
      }
      const res = await leadApi.list(params)
      setData(res.data)
      setPagination(res.pagination)
    } catch (err: any) {
      showMessage('error', err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, source, status, region, activeTab, pagination.pageSize])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  function handleSearch() { fetchData(1) }
  function handleReset() {
    setKeyword(''); setSource(''); setStatus(''); setRegion('')
    fetchData(1)
  }
  function handlePageChange(page: number) {
    if (page >= 1 && page <= pagination.totalPages) fetchData(page)
  }

  async function handleConvert() {
    if (!convertLead) return
    setConvertLoading(true)
    try {
      const res = await leadApi.convert(convertLead.id)
      showMessage('success', `转化成功！已创建客户 #${res.customerId}`)
      setConvertOpen(false)
      fetchData(pagination.page)
    } catch (err: any) {
      showMessage('error', err.message || '转化失败')
    } finally {
      setConvertLoading(false)
    }
  }

  async function handleAbandon(reason: string) {
    if (!abandonLead) return
    setAbandonLoading(true)
    try {
      await leadApi.abandon(abandonLead.id, reason)
      showMessage('success', '线索已放弃')
      setAbandonOpen(false)
      fetchData(pagination.page)
    } catch (err: any) {
      showMessage('error', err.message || '放弃失败')
    } finally {
      setAbandonLoading(false)
    }
  }

  async function handleClaim(lead: Lead) {
    try {
      await leadApi.claim(lead.id)
      showMessage('success', '认领成功！')
      fetchData(pagination.page)
    } catch (err: any) {
      showMessage('error', err.message || '认领失败')
    }
  }

  async function handleDelete() {
    // Leads don't have delete API yet, so we abandon instead
    if (!deleteLead) return
    setAbandonLoading(true)
    try {
      await leadApi.abandon(deleteLead.id, '手动删除')
      showMessage('success', '线索已删除')
      setDeleteOpen(false)
      fetchData(pagination.page)
    } catch (err: any) {
      showMessage('error', err.message || '删除失败')
    } finally {
      setAbandonLoading(false)
    }
  }

  function openEdit(lead: Lead) { setEditingLead(lead); setFormOpen(true) }
  function openCreate() { setEditingLead(null); setFormOpen(true) }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">线索管理</h1>
          <p className="text-slate-500 mt-1">潜在客户线索跟进与转化 · 共 {pagination.total} 条线索</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} /> 新增线索
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          全部线索
        </button>
        <button onClick={() => setActiveTab('unassigned')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'unassigned' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          公海池
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="搜索线索编号、公司、联系人..." value={keyword}
              onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter size={16} /> 筛选
          </button>
          <button onClick={handleSearch} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">搜索</button>
          {(keyword || source || status || region) && (
            <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 underline">重置</button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">来源</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">全部来源</option>
                {Object.entries(leadSourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">状态</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">全部状态</option>
                {Object.entries(leadStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">地区</label>
              <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="输入地区"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3.5">线索编号</th>
                <th className="px-5 py-3.5">公司/联系人</th>
                <th className="px-5 py-3.5">来源</th>
                <th className="px-5 py-3.5">优先级</th>
                <th className="px-5 py-3.5">状态</th>
                <th className="px-5 py-3.5">分配</th>
                <th className="px-5 py-3.5">负责人</th>
                <th className="px-5 py-3.5">获取时间</th>
                <th className="px-5 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && data.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>加载中...
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 opacity-40" />暂无线索数据
                </td></tr>
              ) : (
                data.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-slate-500">{lead.leadNo}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <User size={11} />{lead.contactName}
                          {lead.contactPhone && <><Phone size={11} />{lead.contactPhone}</>}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{leadSourceLabels[lead.source]}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${priorityColors[lead.priority]}`}>
                        {priorityLabels[lead.priority]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${leadStatusColors[lead.status]}`}>
                        {leadStatusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${lead.assignStatus === 'UNASSIGNED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>
                        {assignStatusLabels[lead.assignStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{lead.assignee?.name || '-'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{new Date(lead.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="查看">
                          <Eye size={15} />
                        </button>
                        {lead.assignStatus === 'UNASSIGNED' && (
                          <button onClick={() => handleClaim(lead)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="认领">
                            <Hand size={15} />
                          </button>
                        )}
                        {lead.status !== 'CONVERTED' && lead.status !== 'ABANDONED' && (
                          <>
                            <button onClick={() => openEdit(lead)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="编辑">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => { setConvertLead(lead); setConvertOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="转化">
                              <ArrowRightLeft size={15} />
                            </button>
                            <button onClick={() => { setAbandonLead(lead); setAbandonOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="放弃">
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              显示 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === pagination.page ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
              ))}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <LeadFormModal open={formOpen} lead={editingLead} onClose={() => setFormOpen(false)}
        onSuccess={() => { showMessage('success', editingLead ? '线索更新成功' : '线索创建成功'); fetchData(pagination.page); }} />

      <ConvertConfirmModal open={convertOpen} lead={convertLead} onConfirm={handleConvert} onCancel={() => setConvertOpen(false)} loading={convertLoading} />

      <AbandonModal open={abandonOpen} leadName={abandonLead?.name || ''} onConfirm={handleAbandon} onCancel={() => setAbandonOpen(false)} loading={abandonLoading} />

      <DeleteConfirmModal open={deleteOpen} customerName={deleteLead?.name || ''} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={abandonLoading} />
    </div>
  )
}
