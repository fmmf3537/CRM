import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, BarChart3, TrendingUp, Calendar, Award, PieChart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { activityApi } from '../api/activities'
import type { WorkloadStats } from '../types/activity'
import { activityTypeLabels } from '../types/activity'

const PERIODS = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
]

export default function Workload() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState<WorkloadStats | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await activityApi.workload(undefined, period)
      setStats(res)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading && !stats) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/activities')} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">工作量报表</h1>
            <p className="text-slate-500 text-sm mt-0.5">销售活动工作量统计与分析</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${period === p.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><BarChart3 size={18} className="text-primary-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">活动总数</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalActivities}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Award size={18} className="text-amber-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">总得分</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalScore}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">日均活动</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.dailyAverage}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Calendar size={18} className="text-purple-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">统计周期</p>
                  <p className="text-lg font-bold text-slate-900">{PERIODS.find(p => p.key === period)?.label}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2"><PieChart size={16} className="text-primary-600" /> 类型分布</h3>
              <div className="space-y-3">
                {stats.byType.map((t) => {
                  const maxCount = Math.max(...stats.byType.map(x => x.count))
                  return (
                    <div key={t.type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700">{activityTypeLabels[t.type]}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{t.count} 次</span>
                          <span className="font-semibold text-slate-900 w-10 text-right">{t.score} 分</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${maxCount > 0 ? (t.count / maxCount) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2"><TrendingUp size={16} className="text-primary-600" /> 近30天趋势</h3>
              <div className="h-48 flex items-end justify-between gap-1">
                {stats.trend.map((d, i) => {
                  const maxScore = Math.max(...stats.trend.map(x => x.score), 1)
                  const height = (d.score / maxScore) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-primary-100 rounded-t-sm relative group" style={{ height: `${Math.max(height, 4)}%` }}>
                        <div className="absolute bottom-0 left-0 right-0 bg-primary-500 rounded-t-sm transition-all" style={{ height: '100%' }}></div>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {d.date}: {d.count}次/{d.score}分
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
