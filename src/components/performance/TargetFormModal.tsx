import { useState, useEffect } from 'react'
import type { Target, TargetFormData } from '../../types/performance'
import { TargetType, targetTypeLabels } from '../../types/performance'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: TargetFormData) => void
  initialData?: Target | null
  users: { id: number; name: string; role: string }[]
}

export default function TargetFormModal({ open, onClose, onSubmit, initialData, users }: Props) {
  const [form, setForm] = useState<TargetFormData>({
    type: TargetType.MONTHLY,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 0,
    currency: 'CNY',
    ownerId: 0,
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type,
        year: initialData.year,
        quarter: initialData.quarter ?? undefined,
        month: initialData.month ?? undefined,
        amount: initialData.amount,
        currency: initialData.currency,
        ownerId: initialData.ownerId,
      })
    } else {
      setForm({
        type: TargetType.MONTHLY,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        amount: 0,
        currency: 'CNY',
        ownerId: 0,
      })
    }
  }, [initialData, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ownerId || !form.year || !form.amount) return
    onSubmit(form)
  }

  const showQuarter = form.type === TargetType.QUARTERLY || form.type === TargetType.ANNUAL
  const showMonth = form.type === TargetType.MONTHLY

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{initialData ? '编辑目标' : '设置目标'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">目标类型 *</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TargetType, quarter: undefined, month: undefined })}
            >
              {Object.entries(targetTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">年份 *</label>
              <input
                type="number"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                required
              />
            </div>
            {showQuarter && (
              <div>
                <label className="mb-1 block text-sm font-medium">季度</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.quarter || ''}
                  onChange={(e) => setForm({ ...form, quarter: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">全年</option>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </div>
            )}
            {showMonth && (
              <div>
                <label className="mb-1 block text-sm font-medium">月份</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.month || ''}
                  onChange={(e) => setForm({ ...form, month: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">目标金额 *</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">币种</label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">负责人 *</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.ownerId || ''}
              onChange={(e) => setForm({ ...form, ownerId: parseInt(e.target.value) })}
              required
            >
              <option value="">请选择</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">保存</button>
          </div>
        </form>
      </div>
    </div>
  )
}
