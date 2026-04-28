import { useState, useEffect } from 'react'
import { Target, DollarSign, TrendingUp, Zap } from 'lucide-react'
import { performanceApi } from '../../api/performance'
import type { PerformanceSummary } from '../../types/performance'

export default function PerformanceCards() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    performanceApi.summary({ period: 'month', year: now.getFullYear(), month: now.getMonth() + 1 })
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    {
      label: '本月成交金额',
      value: summary ? `¥${summary.dealAmount.toLocaleString()}` : '-',
      sub: summary ? `${summary.orderCount} 笔订单` : '',
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      label: '目标完成率',
      value: summary ? `${summary.completionRate.toFixed(1)}%` : '-',
      sub: summary ? `目标 ¥${summary.targetAmount.toLocaleString()}` : '',
      icon: Target,
      color: 'bg-blue-500',
    },
    {
      label: '平均客单价',
      value: summary ? `¥${Math.round(summary.avgOrderValue).toLocaleString()}` : '-',
      sub: '',
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      label: '已回款金额',
      value: summary ? `¥${summary.paidAmount.toLocaleString()}` : '-',
      sub: summary && summary.dealAmount > 0
        ? `回款率 ${((summary.paidAmount / summary.dealAmount) * 100).toFixed(1)}%`
        : '',
      icon: Zap,
      color: 'bg-purple-500',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
            <div className="h-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                {card.sub && <p className="text-xs text-slate-400 mt-1">{card.sub}</p>}
              </div>
              <div className={`${card.color} text-white p-2.5 rounded-lg`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
