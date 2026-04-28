import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (result: 'WON' | 'LOST', remarks: string) => void
}

export default function CloseOpportunityModal({ open, onClose, onSubmit }: Props) {
  const [result, setResult] = useState<'WON' | 'LOST' | ''>('')
  const [remarks, setRemarks] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">关闭商机</h2>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setResult('WON')}
            className={`rounded border-2 py-3 text-sm font-medium transition-colors ${
              result === 'WON'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}
          >
            赢单
          </button>
          <button
            type="button"
            onClick={() => setResult('LOST')}
            className={`rounded border-2 py-3 text-sm font-medium transition-colors ${
              result === 'LOST'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-600 hover:border-red-300'
            }`}
          >
            输单
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">关闭原因 / 备注</label>
          <textarea
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="填写关闭说明..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (!result) return
              onSubmit(result, remarks)
              setResult('')
              setRemarks('')
            }}
            disabled={!result}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认关闭
          </button>
        </div>
      </div>
    </div>
  )
}
