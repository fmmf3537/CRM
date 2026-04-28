import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { Link, useSearchParams } from 'react-router-dom'
import { opportunityApi } from '../api/opportunities'
import { customerApi } from '../api/customers'
import type { Opportunity } from '../types/opportunity'
import { OpportunityStatus, stageLabels, statusLabels, statusColors } from '../types/opportunity'
import OpportunityFormModal from '../components/opportunities/OpportunityFormModal'
import StageBar from '../components/opportunities/StageBar'

export default function Opportunities() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)

  const page = parseInt(searchParams.get('page') || '1', 10)
  const stageFilter = searchParams.get('stage') || ''
  const statusFilter = searchParams.get('status') || ''

  const fetchOpportunities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await opportunityApi.list({
        page,
        pageSize: 10,
        stage: stageFilter,
        status: statusFilter,
        keyword: debouncedKeyword || undefined,
      })
      setOpportunities(res.data)
      setPagination(res.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, stageFilter, statusFilter, debouncedKeyword])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  useEffect(() => {
    customerApi.list({ pageSize: 999 }).then((res) => setCustomers(res.data)).catch(() => {})
  }, [])

  async function handleCreate(data: Parameters<typeof opportunityApi.create>[0]) {
    try {
      await opportunityApi.create(data)
      setModalOpen(false)
      fetchOpportunities()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleUpdate(data: Parameters<typeof opportunityApi.update>[1]) {
    if (!editing) return
    try {
      await opportunityApi.update(editing.id, data)
      setModalOpen(false)
      setEditing(null)
      fetchOpportunities()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除此商机？')) return
    try {
      await opportunityApi.delete(id)
      fetchOpportunities()
    } catch (err: any) {
      alert(err.message)
    }
  }

  function updateFilter(key: string, value: string) {
    const sp = new URLSearchParams(searchParams)
    if (value) sp.set(key, value)
    else sp.delete(key)
    sp.set('page', '1')
    setSearchParams(sp)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">商机管理</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新建商机
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="搜索商机名称..."
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchOpportunities()}
        />
        <select
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={stageFilter}
          onChange={(e) => updateFilter('stage', e.target.value)}
        >
          <option value="">全部阶段</option>
          {Object.entries(stageLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={statusFilter}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">商机名称</th>
              <th className="px-4 py-3 font-medium">客户</th>
              <th className="px-4 py-3 font-medium">金额</th>
              <th className="px-4 py-3 font-medium">阶段</th>
              <th className="px-4 py-3 font-medium">赢率</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">负责人</th>
              <th className="px-4 py-3 font-medium">预计成交</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
            )}
            {!loading && opportunities.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">暂无商机</td></tr>
            )}
            {opportunities.map((opp) => (
              <tr key={opp.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/opportunities/${opp.id}`} className="font-medium text-blue-600 hover:underline">
                    {opp.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{opp.customer?.name || '-'}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {opp.currency || 'CNY'} {opp.amount?.toLocaleString() || '0'}
                </td>
                <td className="px-4 py-3">
                  <div className="w-40">
                    <StageBar currentStage={opp.stage} />
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{opp.winRate}%</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded border px-2 py-0.5 text-xs ${statusColors[opp.status as OpportunityStatus] || ''}`}>
                    {statusLabels[opp.status as OpportunityStatus] || opp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{opp.owner?.name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {opp.expectedCloseDate ? opp.expectedCloseDate.slice(0, 10) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(opp); setModalOpen(true) }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(opp.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => updateFilter('page', String(page - 1))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => updateFilter('page', String(page + 1))}
            className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}

      <OpportunityFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={editing ? handleUpdate : handleCreate}
        initialData={editing}
        customers={customers}
      />
    </div>
  )
}
