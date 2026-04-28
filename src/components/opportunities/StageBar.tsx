import { OpportunityStage, stageLabels, stageColors, STAGE_ORDER } from '../../types/opportunity'

interface Props {
  currentStage: OpportunityStage
}

export default function StageBar({ currentStage }: Props) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)

  return (
    <div className="flex w-full items-center gap-1">
      {STAGE_ORDER.map((stage, idx) => {
        const isPast = idx < currentIndex
        const isCurrent = idx === currentIndex

        if (stage === OpportunityStage.STAGE_99) {
          return (
            <div
              key={stage}
              className={`flex-1 rounded border px-1 py-1.5 text-center text-xs font-medium ${
                isCurrent ? stageColors[stage] : 'bg-gray-50 text-gray-400 border-gray-100'
              }`}
            >
              {stageLabels[stage]}
            </div>
          )
        }

        return (
          <div key={stage} className="relative flex flex-1 items-center">
            <div
              className={`flex-1 rounded border px-1 py-1.5 text-center text-xs font-medium transition-colors ${
                isCurrent
                  ? stageColors[stage]
                  : isPast
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-400 border-gray-100'
              }`}
            >
              {stageLabels[stage]}
            </div>
            {idx < STAGE_ORDER.length - 2 && (
              <div
                className={`mx-0.5 h-px w-2 ${isPast ? 'bg-blue-300' : 'bg-gray-200'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
