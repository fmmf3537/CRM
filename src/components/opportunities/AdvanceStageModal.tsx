import { useState } from 'react'
import { OpportunityStage, stageLabels, STAGE_ORDER, WIN_RATE_MAP } from '../../types/opportunity'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (toStage: OpportunityStage, remarks: string) => void
  currentStage: OpportunityStage
}

export default function AdvanceStageModal({ open, onClose, onSubmit, currentStage }: Props) {
  const [selected, setSelected] = useState<OpportunityStage | ''>('')
  const [remarks, setRemarks] = useState('')

  if (!open) return null

  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  const nextStage = STAGE_ORDER[currentIndex + 1]
  const canAdvance = nextStage && nextStage !== OpportunityStage.STAGE_99

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">推进阶段</h2>

        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-500">当前阶段</p>
          <div className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
            {stageLabels[currentStage]}（赢率 {WIN_RATE_MAP[currentStage]}%）
          </div>
        </div>

        {canAdvance ? (
          <div className="mb-4">
            <p className="mb-2 text-sm text-gray-500">下一阶段</p>
            <div
              className={`cursor-pointer rounded border-2 px-3 py-2 text-sm font-medium transition-colors ${
                selected === nextStage
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
              onClick={() => setSelected(nextStage)}
            >
              {stageLabels[nextStage]}（赢率 {WIN_RATE_MAP[nextStage]}%）
            </div>
          </div>
        ) : (
          <p className="mb-4 text-sm text-red-500">当前阶段无法继续推进</p>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">备注</label>
          <textarea
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="填写推进说明..."
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
              if (!selected) return
              onSubmit(selected, remarks)
              setSelected('')
              setRemarks('')
            }}
            disabled={!canAdvance || !selected}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认推进
          </button>
        </div>
      </div>
    </div>
  )
}
