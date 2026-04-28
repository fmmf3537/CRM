import { useState, useEffect } from 'react'
import { achievementApi } from '../api/performance'
import { customerApi } from '../api/customers'
import { opportunityApi } from '../api/opportunities'
import type { Achievement, AchievementFormData, PaymentFormData } from '../types/performance'
import { PaymentStatus } from '../types/performance'

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [opportunities, setOpportunities] = useState<{ id: number; name: string }[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)

  const [form, setForm] = useState<AchievementFormData>({
    name: '',
    customerId: 0,
    amount: 0,
    currency: 'CNY',
    contractDate: new Date().toISOString().slice(0, 10),
    payments: [],
  })

  useEffect(() => {
    fetchAchievements()
    customerApi.list({ pageSize: 999 }).then((res) => setCustomers(res.data)).catch(() => {})
    opportunityApi.list({ pageSize: 999, status: 'WON' }).then((res) => setOpportunities(res.data)).catch(() => {})
  }, [])

  async function fetchAchievements(page = 1) {
    setLoading(true)
    try {
      const res = await achievementApi.list({ page, pageSize: 10 })
      setAchievements(res.data)
      setPagination(res.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({
      name: '',
      customerId: 0,
      amount: 0,
      currency: 'CNY',
      contractDate: new Date().toISOString().slice(0, 10),
      payments: [],
    })
  }

  function openEdit(a: Achievement) {
    setEditing(a)
    setForm({
      name: a.name,
      customerId: a.customerId,
      opportunityId: a.opportunityId || undefined,
      amount: a.amount,
      currency: a.currency,
      contractDate: a.contractDate.slice(0, 10),
      payments: a.payments.map((p) => ({
        amount: p.amount,
        paymentDate: p.paymentDate ? p.paymentDate.slice(0, 10) : undefined,
        status: p.status,
      })),
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.customerId || !form.contractDate) return
    try {
      if (editing) {
        await achievementApi.update(editing.id, form)
      } else {
        await achievementApi.create(form)
      }
      setModalOpen(false)
      setEditing(null)
      resetForm()
      fetchAchievements(pagination.page)
    } catch (err: any) {
      alert(err.message)
    }
  }

  function addPayment() {
    setForm({
      ...form,
      payments: [...(form.payments || []), { amount: 0, paymentDate: '', status: PaymentStatus.PENDING }],
    })
  }

  function updatePayment(index: number, field: keyof PaymentFormData, value: any) {
    const payments = [...(form.payments || [])]
    payments[index] = { ...payments[index], [field]: value }
    setForm({ ...form, payments })
  }

  function removePayment(index: number) {
    const payments = [...(form.payments || [])]
    payments.splice(index, 1)
    setForm({ ...form, payments })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">业绩录入</h1>
        <button
          onClick={() => { setEditing(null); resetForm(); setModalOpen(true) }}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 录入业绩
        </button>
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">业绩名称</th>
              <th className="px-4 py-3 font-medium">客户</th>
              <th className="px-4 py-3 font-medium">成交金额</th>
              <th className="px-4 py-3 font-medium">签约日期</th>
              <th className="px-4 py-3 font-medium">回款状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>}
            {!loading && achievements.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无业绩记录</td></tr>}
            {achievements.map((a) => {
              const totalPaid = a.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
              const totalPlanned = a.payments.reduce((s, p) => s + p.amount, 0)
              return (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.customer?.name || '-'}</td>
                  <td className="px-4 py-3 font-medium">{a.currency} {a.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{a.contractDate.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="text-emerald-600">已回 ¥{totalPaid.toLocaleString()}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-500">计划 ¥{totalPlanned.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(a)} className="text-xs text-blue-600 hover:underline">编辑</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={pagination.page <= 1} onClick={() => fetchAchievements(pagination.page - 1)} className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40">上一页</button>
          <span className="px-3 py-1 text-sm text-gray-600">{pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchAchievements(pagination.page + 1)} className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40">下一页</button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">{editing ? '编辑业绩' : '录入业绩'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">业绩名称 *</label>
                <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">客户 *</label>
                <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.customerId || ''} onChange={(e) => setForm({ ...form, customerId: parseInt(e.target.value) })} required>
                  <option value="">请选择</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">关联商机</label>
                <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.opportunityId || ''} onChange={(e) => setForm({ ...form, opportunityId: e.target.value ? parseInt(e.target.value) : undefined })}>
                  <option value="">不关联</option>
                  {opportunities.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">成交金额 *</label>
                  <input type="number" step="0.01" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">币种</label>
                  <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">签约日期 *</label>
                <input type="date" className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={form.contractDate} onChange={(e) => setForm({ ...form, contractDate: e.target.value })} required />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">回款计划</label>
                  <button type="button" onClick={addPayment} className="text-xs text-blue-600 hover:underline">+ 添加回款</button>
                </div>
                <div className="space-y-2">
                  {(form.payments || []).map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="number" step="0.01" placeholder="金额" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" value={p.amount} onChange={(e) => updatePayment(i, 'amount', parseFloat(e.target.value) || 0)} />
                      <input type="date" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" value={p.paymentDate || ''} onChange={(e) => updatePayment(i, 'paymentDate', e.target.value)} />
                      <select className="rounded border border-gray-300 px-2 py-1.5 text-sm" value={p.status} onChange={(e) => updatePayment(i, 'status', e.target.value)}>
                        <option value="PENDING">待回款</option>
                        <option value="PAID">已回款</option>
                      </select>
                      <button type="button" onClick={() => removePayment(i)} className="text-xs text-red-600 hover:underline px-1">删除</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); setEditing(null); resetForm(); }} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
