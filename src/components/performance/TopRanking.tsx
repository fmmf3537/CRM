import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { performanceApi } from '../../api/performance'
import type { RankingItem } from '../../types/performance'

export default function TopRanking({ limit = 5 }: { limit?: number }) {
  const [data, setData] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    performanceApi.ranking({ period: 'month', year: now.getFullYear(), month: now.getMonth() + 1, sortBy: 'amount' })
      .then((res) => setData(res.data.slice(0, limit)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [limit])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">业绩排行 TOP{limit}</h3>
        </div>
        <div className="p-4 space-y-2 animate-pulse">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="font-semibold text-slate-900">业绩排行 TOP{limit}</h3>
      </div>
      <div className="p-4 space-y-1">
        {data.length === 0 && <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>}
        {data.map((item, i) => (
          <div key={item.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i < 3 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {item.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.userName}</p>
              <p className="text-xs text-slate-400">
                {item.orderCount} 笔 · 完成率 {item.completionRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">¥{item.dealAmount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
