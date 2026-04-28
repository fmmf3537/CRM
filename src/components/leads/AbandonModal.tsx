import { X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface Props {
  open: boolean
  leadName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function AbandonModal({ open, leadName, onConfirm, onCancel, loading }: Props) {
  const [reason, setReason] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">放弃线索</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <p className="text-slate-600 mb-4 text-sm">
          确定要放弃线索 <span className="font-semibold text-slate-900">「{leadName}」</span> 吗？放弃后线索状态将变为"已放弃"。
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">放弃原因 <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="请输入放弃原因..."
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">取消</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? '处理中...' : '确认放弃'}
          </button>
        </div>
      </div>
    </div>
  )
}
