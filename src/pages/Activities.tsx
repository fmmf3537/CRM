import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { Search, Plus, Filter, Pencil, Trash2, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import { activityApi } from '../api/activities'
import type { Activity } from '../types/activity'
import { activityTypeLabels, activityTypeColors, activityResultLabels, activityResultColors } from '../types/activity'
import ActivityFormModal from '../components/activities/ActivityFormModal'
import DeleteConfirmModal from '../components/customers/DeleteConfirmModal'

export default function Activities() {
  const [data, setData] = useState<Activity[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [type, setType] = useState('')
  const [result, setResult] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await activityApi.list({ page, pageSize: pagination.pageSize, keyword: debouncedKeyword, type, startDate, endDate, result })
      setData(res.data)
      setPagination(res.pagination)
    } catch (err: any) {
      showMessage('error', err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, type, result, startDate, endDate, pagination.pageSize])

  useEffect(() => { fetchData(1) }, [fetchData])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  function handleSearch() { fetchData(1) }
  function handleReset() {
    setKeyword(''); setType(''); setResult(''); setStartDate(''); setEndDate('')
    fetchData(1)
  }
  function handlePageChange(page: number) {
    if (page >= 1 && page <= pagination.totalPages) fetchData(page)
  }

  async function handleDelete() {
    if (!deleteActivity) return
    setDeleteLoading(true)
    try {
      await activityApi.delete(deleteActivity.id)
      showMessage('success', '活动已删除')
      setDeleteOpen(false)
      fetchData(pagination.page)
    } catch (err: any) {
      showMessage('error', err.message || '删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right ${message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">活动管理</h1>
          <p className="text-slate-500 mt-1">记录销售活动与跟进情况 · 共 {pagination.total} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.href = '/workload'}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white">
            <BarChart3 size={16} /> 工作量
          </button>
          <button onClick={() => { setEditingActivity(null); setFormOpen(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} /> 记录活动
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="搜索活动主题、内容..." value={keyword}
              onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter size={16} /> 筛选
          </button>
          <button onClick={handleSearch} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">搜索</button>
          {(keyword || type || result || startDate || endDate) && (
            <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 underline">重置</button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">活动类型</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">全部类型</option>
                {Object.entries(activityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">活动结果</label>
              <select value={result} onChange={(e) => setResult(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">全部结果</option>
                {Object.entries(activityResultLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">开始日期</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">结束日期</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3.5">客户/线索</th>
                <th className="px-5 py-3.5">类型</th>
                <th className="px-5 py-3.5">主题</th>
                <th className="px-5 py-3.5">时间</th>
                <th className="px-5 py-3.5">结果</th>
                <th className="px-5 py-3.5">分值</th>
                <th className="px-5 py-3.5">创建人</th>
                <th className="px-5 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && data.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>加载中...
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">暂无任何活动记录</td></tr>
              ) : (
                data.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      {act.customer ? (
                        <div>
                          <p className="font-medium text-slate-900">{act.customer.name}</p>
                          <p className="text-xs text-slate-500">客户</p>
                        </div>
                      ) : act.lead ? (
                        <div>
                          <p className="font-medium text-slate-900">{act.lead.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{act.lead.leadNo}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${activityTypeColors[act.type]}`}>
                        {activityTypeLabels[act.type]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{act.title}</p>
                      {act.duration && <p className="text-xs text-slate-500">{act.duration} 分钟</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(act.time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${activityResultColors[act.result]}`}>
                        {activityResultLabels[act.result]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">{act.score}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{act.createdBy?.name || '-'}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingActivity(act); setFormOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="编辑"><Pencil size={15} /></button>
                        <button onClick={() => { setDeleteActivity(act); setDeleteOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 size={15} /></button>
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

      <ActivityFormModal open={formOpen} activity={editingActivity} onClose={() => setFormOpen(false)}
        onSuccess={() => { showMessage('success', editingActivity ? '活动更新成功' : '活动记录成功'); fetchData(pagination.page); }} />

      <DeleteConfirmModal open={deleteOpen} customerName={deleteActivity?.title || ''} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleteLoading} />
    </div>
  )
}
