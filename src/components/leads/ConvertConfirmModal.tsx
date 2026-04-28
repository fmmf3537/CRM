import { X, ArrowRightLeft, Building2, User, Phone } from 'lucide-react'
import type { Lead } from '../../types/lead'

interface Props {
  open: boolean
  lead: Lead | null
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConvertConfirmModal({ open, lead, onConfirm, onCancel, loading }: Props) {
  if (!open || !lead) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <ArrowRightLeft size={20} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">转化线索为客户</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={14} className="text-slate-400" />
            <span className="text-slate-500">公司：</span>
            <span className="font-medium text-slate-900">{lead.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-slate-400" />
            <span className="text-slate-500">联系人：</span>
            <span className="font-medium text-slate-900">{lead.contactName}</span>
          </div>
          {lead.contactPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-slate-400" />
              <span className="text-slate-500">电话：</span>
              <span className="font-medium text-slate-900">{lead.contactPhone}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 mb-6">
          转化后将自动创建客户档案，并将联系人信息关联到新客户。此操作不可逆。
        </p>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">取消</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <ArrowRightLeft size={16} />
            {loading ? '转化中...' : '确认转化'}
          </button>
        </div>
      </div>
    </div>
  )
}
