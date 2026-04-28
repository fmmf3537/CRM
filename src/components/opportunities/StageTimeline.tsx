import type { StageHistory } from '../../types/opportunity'
import { stageLabels, OpportunityStage } from '../../types/opportunity'

interface Props {
  histories: StageHistory[]
}

export default function StageTimeline({ histories }: Props) {
  if (!histories || histories.length === 0) {
    return <p className="text-sm text-gray-400">暂无阶段历史</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-4">
        {histories.map((h) => (
          <div key={h.id} className="relative pl-7">
            <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-blue-400 bg-white" />
            <div className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {stageLabels[h.fromStage as OpportunityStage]}
                  {h.fromStage !== h.toStage && (
                    <>
                      {' → '}
                      <span className="text-blue-600">
                        {stageLabels[h.toStage as OpportunityStage]}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(h.changedAt).toLocaleString('zh-CN')}
                </span>
              </div>
              {h.remarks && <p className="mt-1 text-xs text-gray-500">{h.remarks}</p>}
              {h.changedBy && (
                <p className="mt-0.5 text-xs text-gray-400">操作人：{h.changedBy.name}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
