import { useState, useEffect } from 'react'
import type { Opportunity, OpportunityFormData } from '../../types/opportunity'
import { OpportunityStage, stageLabels } from '../../types/opportunity'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: OpportunityFormData) => void
  initialData?: Opportunity | null
  customers: { id: number; name: string }[]
}

export default function OpportunityFormModal({ open, onClose, onSubmit, initialData, customers }: Props) {
  const [form, setForm] = useState<OpportunityFormData>({
    name: '',
    customerId: 0,
    amount: 0,
    currency: 'CNY',
    stage: OpportunityStage.STAGE_01,
    expectedCloseDate: '',
    description: '',
    source: '',
    competitor: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        customerId: initialData.customerId,
        amount: initialData.amount,
        currency: initialData.currency,
        stage: initialData.stage,
        expectedCloseDate: initialData.expectedCloseDate ? initialData.expectedCloseDate.slice(0, 10) : '',
        description: initialData.description || '',
        source: initialData.source || '',
        competitor: initialData.competitor || '',
      })
    } else {
      setForm({
        name: '',
        customerId: 0,
        amount: 0,
        currency: 'CNY',
        stage: OpportunityStage.STAGE_01,
        expectedCloseDate: '',
        description: '',
        source: '',
        competitor: '',
      })
    }
  }, [initialData, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.customerId) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{initialData ? '编辑商机' : '新建商机'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">商机名称 *</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">客户 *</label>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.customerId || ''}
              onChange={(e) => setForm({ ...form, customerId: parseInt(e.target.value) })}
              required
            >
              <option value="">请选择客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">金额</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.amount ?? ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">币种</label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="CNY"
              />
            </div>
          </div>
          {!initialData && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">当前阶段</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value as OpportunityStage })}
                >
                  {Object.entries(stageLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">预计成交日</label>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.expectedCloseDate}
                  onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                />
              </div>
            </div>
          )}
          {initialData && (
            <div>
              <label className="mb-1 block text-sm font-medium">预计成交日</label>
              <input
                type="date"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">商机来源</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="如：官网、展会、推荐"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">竞争对手</label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.competitor}
              onChange={(e) => setForm({ ...form, competitor: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">描述</label>
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
