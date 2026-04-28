import { useState, useEffect, useCallback } from 'react'
import { performanceApi } from '../api/performance'
import type { PerformanceSummary, RankingItem } from '../types/performance'
import { Trophy } from 'lucide-react'

export default function Performance() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [period, setPeriod] = useState('month')
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [sortBy, setSortBy] = useState('amount')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { period, year, sortBy }
      if (period === 'quarter') params.quarter = quarter
      if (period === 'month') params.month = month

      const [sumRes, rankRes] = await Promise.all([
        performanceApi.summary({ ...params }),
        performanceApi.ranking({ ...params }),
      ])
      setSummary(sumRes)
      setRanking(rankRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [period, year, quarter, month, sortBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const gaugePercent = summary && summary.targetAmount > 0
    ? Math.min((summary.dealAmount / summary.targetAmount) * 100, 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">业绩看板</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
        <select className="rounded border border-gray-300 px-3 py-2 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="month">按月</option>
          <option value="quarter">按季度</option>
          <option value="year">按年</option>
        </select>
        <input type="number" className="rounded border border-gray-300 px-3 py-2 text-sm w-24" value={year} onChange={(e) => setYear(parseInt(e.target.value) || now.getFullYear())} />
        {period === 'quarter' && (
          <select className="rounded border border-gray-300 px-3 py-2 text-sm" value={quarter} onChange={(e) => setQuarter(parseInt(e.target.value))}>
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </select>
        )}
        {period === 'month' && (
          <select className="rounded border border-gray-300 px-3 py-2 text-sm" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">目标金额</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">¥{summary ? summary.targetAmount.toLocaleString() : '-'}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">成交金额</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">¥{summary ? summary.dealAmount.toLocaleString() : '-'}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">回款金额</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">¥{summary ? summary.paidAmount.toLocaleString() : '-'}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">订单数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary ? summary.orderCount : '-'}</p>
        </div>
      </div>

      {/* Gauge + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge Card */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">目标完成率</h3>
          {loading ? (
            <div className="h-40 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-24 overflow-hidden">
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-gray-100" />
                <div
                  className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-blue-500"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${gaugePercent}%, 0 ${gaugePercent}%)`,
                  }}
                />
                <div className="absolute bottom-0 left-0 w-full text-center">
                  <p className="text-3xl font-bold text-gray-800">{summary ? summary.completionRate.toFixed(1) : '0.0'}%</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center w-full">
                <div>
                  <p className="text-xs text-gray-400">平均客单价</p>
                  <p className="text-sm font-medium text-gray-700">¥{summary ? Math.round(summary.avgOrderValue).toLocaleString() : '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">回款率</p>
                  <p className="text-sm font-medium text-gray-700">
                    {summary && summary.dealAmount > 0 ? ((summary.paidAmount / summary.dealAmount) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ranking Table */}
        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              业绩排行
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setSortBy('amount')} className={`text-xs px-2 py-1 rounded border ${sortBy === 'amount' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}>按金额</button>
              <button onClick={() => setSortBy('count')} className={`text-xs px-2 py-1 rounded border ${sortBy === 'count' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}>按订单</button>
              <button onClick={() => setSortBy('rate')} className={`text-xs px-2 py-1 rounded border ${sortBy === 'rate' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}>按完成率</button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-3 py-2 font-medium">排名</th>
                  <th className="px-3 py-2 font-medium">销售</th>
                  <th className="px-3 py-2 font-medium text-right">目标</th>
                  <th className="px-3 py-2 font-medium text-right">成交</th>
                  <th className="px-3 py-2 font-medium text-right">回款</th>
                  <th className="px-3 py-2 font-medium text-right">订单</th>
                  <th className="px-3 py-2 font-medium text-right">完成率</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">暂无数据</td></tr>}
                {ranking.map((item) => (
                  <tr key={item.userId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                        item.rank <= 3 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-800">{item.userName}</td>
                    <td className="px-3 py-3 text-right text-gray-600">¥{item.targetAmount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-medium text-blue-600">¥{item.dealAmount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-emerald-600">¥{item.paidAmount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{item.orderCount}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 rounded bg-gray-100 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded" style={{ width: `${Math.min(item.completionRate, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{item.completionRate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
