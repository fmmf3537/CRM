import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'

import { Search, Plus, Filter, FileUp, FileDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Building2, Phone, MapPin } from 'lucide-react'
import { customerApi } from '../api/customers'
import { useAuth } from '../hooks/useAuth'
import type { Customer, CustomerListResponse } from '../types/customer'
import { industryLabels, gradeLabels, statusLabels, statusColors } from '../types/customer'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import CustomerDetailDrawer from '../components/customers/CustomerDetailDrawer'
import DeleteConfirmModal from '../components/customers/DeleteConfirmModal'

export default function Customers() {
  const { user } = useAuth()

  const [data, setData] = useState<CustomerListResponse['data']>([])
  const [pagination, setPagination] = useState<CustomerListResponse['pagination']>({
    page: 1, pageSize: 10, total: 0, totalPages: 0,
  })
  const [loading, setLoading] = useState(false)

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [industry, setIndustry] = useState('')
  const [region, setRegion] = useState('')
  const [grade, setGrade] = useState('')
  const [status, setStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const canModifyAll = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EXECUTIVE'

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await customerApi.list({
        page,
        pageSize: pagination.pageSize,
        keyword: debouncedKeyword,
        industry,
        region,
        grade,
        status,
      })
      setData(res.data)
      setPagination(res.pagination)
    } catch (err: any) {
      showMessage('error', err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, industry, region, grade, status, pagination.pageSize])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  function handleSearch() {
    fetchData(1)
  }

  function handleReset() {
    setKeyword('')
    setIndustry('')
    setRegion('')
    setGrade('')
    setStatus('')
    fetchData(1)
  }

  function handlePageChange(page: number) {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchData(page)
    }
  }

  async function handleDelete() {
    if (!deleteCustomer) return
    setDeleteLoading(true)
    try {
      await customerApi.delete(deleteCustomer.id)
      showMessage('success', '客户已删除')
      setDeleteOpen(false)
      fetchData(pagination.page)
    } catch (err: any) {
      showMessage('error', err.message || '删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleExport() {
    try {
      const blob = await customerApi.exportExcel({ keyword, industry, region, grade, status })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `客户导出_${new Date().toLocaleDateString('zh-CN')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      showMessage('success', '导出成功')
    } catch (err: any) {
      showMessage('error', err.message || '导出失败')
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const res = await customerApi.importExcel(buffer)
      showMessage('success', `成功导入 ${res.count} 个客户`)
      fetchData(1)
    } catch (err: any) {
      showMessage('error', err.message || '导入失败')
    }
    e.target.value = ''
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  function openCreate() {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  function openDetail(customer: Customer) {
    setDetailCustomer(customer)
    setDetailOpen(true)
  }

  function openDelete(customer: Customer) {
    setDeleteCustomer(customer)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right ${
          message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">客户管理</h1>
          <p className="text-slate-500 mt-1">管理企业客户信息与合作关系 · 共 {pagination.total} 个客户</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <span className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white">
              <FileUp size={16} />
              导入
            </span>
          </label>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white"
          >
            <FileDown size={16} />
            导出
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            新增客户
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索客户名称、简称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            高级筛选
          </button>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            搜索
          </button>
          {(keyword || industry || region || grade || status) && (
            <button
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              重置
            </button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">行业</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">全部行业</option>
                {Object.entries(industryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">地区</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="输入地区"
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">等级</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">全部等级</option>
                {Object.entries(gradeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">全部状态</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
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
                <th className="px-5 py-3.5">客户信息</th>
                <th className="px-5 py-3.5">行业/规模</th>
                <th className="px-5 py-3.5">主要联系人</th>
                <th className="px-5 py-3.5">地区</th>
                <th className="px-5 py-3.5">等级</th>
                <th className="px-5 py-3.5">状态</th>
                <th className="px-5 py-3.5">负责人</th>
                <th className="px-5 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
                    加载中...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                    暂无客户数据
                  </td>
                </tr>
              ) : (
                data.map((c) => {
                  const primary = c.contacts?.[0]
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{c.name}</p>
                            {c.alias && <p className="text-slate-500 text-xs">{c.alias}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-700">{industryLabels[c.industry]}</p>
                          <p className="text-xs text-slate-400">{c._count?.contacts || 0} 个联系人</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {primary ? (
                          <div className="space-y-1">
                            <p className="text-slate-700 font-medium">{primary.name}</p>
                            {primary.phone && (
                              <p className="text-slate-500 text-xs flex items-center gap-1">
                                <Phone size={11} />{primary.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin size={13} />
                          {c.region}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {c.grade}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[c.status]}`}>
                          {statusLabels[c.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{c.owner?.name || '-'}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDetail(c)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="查看"
                          >
                            <Eye size={15} />
                          </button>
                          {(canModifyAll || c.ownerId === user?.id) && (
                            <>
                              <button
                                onClick={() => openEdit(c)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => openDelete(c)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              显示 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerFormModal
        open={formOpen}
        customer={editingCustomer}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          showMessage('success', editingCustomer ? '客户更新成功' : '客户创建成功')
          fetchData(pagination.page)
        }}
      />

      <CustomerDetailDrawer
        open={detailOpen}
        customer={detailCustomer}
        onClose={() => setDetailOpen(false)}
        onEdit={(c) => {
          setDetailOpen(false)
          openEdit(c)
        }}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        customerName={deleteCustomer?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading}
      />
    </div>
  )
}
