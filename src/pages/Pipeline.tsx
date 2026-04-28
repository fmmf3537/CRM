import { useState, useEffect, useCallback, useRef } from 'react'
import { opportunityApi } from '../api/opportunities'
import type { PipelineData } from '../types/opportunity'
import { stageLabels, stageBarColors, OpportunityStage } from '../types/opportunity'

export default function Pipeline() {
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const startDateRef = useRef(startDate)
  const endDateRef = useRef(endDate)

  useEffect(() => {
    startDateRef.current = startDate
  }, [startDate])

  useEffect(() => {
    endDateRef.current = endDate
  }, [endDate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await opportunityApi.pipeline({
        startDate: startDateRef.current || undefined,
        endDate: endDateRef.current || undefined,
      })
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const maxCount = data ? Math.max(...data.pipeline.map((d) => d.count), 1) : 1
  const maxAmount = data ? Math.max(...data.pipeline.map((d) => d.amount), 1) : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">销售漏斗</h1>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <label className="text-sm text-gray-500">创建时间：</label>
        <input
          type="date"
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span className="text-gray-400">~</span>
        <input
          type="date"
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button
          onClick={fetchData}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          查询
        </button>
      </div>

      {/* Stats cards */}
      {data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">总商机数</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{data.totalCount}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">总金额</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">¥{data.totalAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">赢单数</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {data.pipeline.find((d) => d.stage === OpportunityStage.STAGE_05)?.count || 0}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">流失数</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{data.lostCount}</p>
          </div>
        </div>
      )}

      {/* Pipeline Chart */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">各阶段分布</h2>
        {loading && <p className="py-8 text-center text-gray-400">加载中...</p>}
        {!loading && data && (
          <div className="space-y-5">
            {data.pipeline.map((item) => {
              const countWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
              const amountWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
              return (
                <div key={item.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{stageLabels[item.stage]}</span>
                    <span className="text-gray-500">赢率 {item.winRate}% · 转化率 {item.conversionRate}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>数量</span>
                        <span>{item.count} 个</span>
                      </div>
                      <div className="h-5 w-full rounded bg-gray-100">
                        <div
                          className={`h-5 rounded ${stageBarColors[item.stage]} transition-all`}
                          style={{ width: `${Math.max(countWidth, 1)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>金额</span>
                        <span>¥{item.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-5 w-full rounded bg-gray-100">
                        <div
                          className={`h-5 rounded ${stageBarColors[item.stage]} transition-all`}
                          style={{ width: `${Math.max(amountWidth, 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Conversion Funnel */}
      {data && data.pipeline.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">转化率分析</h2>
          <div className="space-y-3">
            {data.pipeline.slice(0, -1).map((item, idx) => {
              const next = data.pipeline[idx + 1]
              const conversion = item.count > 0 && next ? ((next.count / item.count) * 100).toFixed(1) : '0.0'
              return (
                <div key={item.stage} className="flex items-center gap-3 text-sm">
                  <div className="w-24 text-right text-gray-600">{stageLabels[item.stage]}</div>
                  <div className="flex-1">
                    <div className="h-6 w-full rounded bg-gray-100">
                      <div
                        className="flex h-6 items-center justify-end rounded bg-blue-500 pr-2 text-xs font-medium text-white"
                        style={{ width: `${Math.max(parseFloat(conversion), 1)}%` }}
                      >
                        {conversion}%
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-gray-600">{next ? stageLabels[next.stage] : '-'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
