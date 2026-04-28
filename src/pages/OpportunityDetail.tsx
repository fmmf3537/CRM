import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { opportunityApi } from '../api/opportunities'
import type { Opportunity } from '../types/opportunity'
import { stageLabels, statusLabels, statusColors, OpportunityStatus } from '../types/opportunity'
import StageBar from '../components/opportunities/StageBar'
import StageTimeline from '../components/opportunities/StageTimeline'
import AdvanceStageModal from '../components/opportunities/AdvanceStageModal'
import CloseOpportunityModal from '../components/opportunities/CloseOpportunityModal'
import OpportunityFormModal from '../components/opportunities/OpportunityFormModal'
import { customerApi } from '../api/customers'

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [opp, setOpp] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([])
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const fetchOpportunity = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await opportunityApi.get(parseInt(id, 10))
      setOpp(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchOpportunity()
  }, [id, fetchOpportunity])

  useEffect(() => {
    customerApi.list({ pageSize: 999 }).then((res) => setCustomers(res.data)).catch(() => {})
  }, [])

  async function handleAdvance(toStage: string, remarks: string) {
    if (!opp) return
    try {
      await opportunityApi.advance(opp.id, toStage, remarks)
      fetchOpportunity()
      setAdvanceOpen(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleClose(result: 'WON' | 'LOST', remarks: string) {
    if (!opp) return
    try {
      await opportunityApi.close(opp.id, result, remarks)
      fetchOpportunity()
      setCloseOpen(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleUpdate(data: Parameters<typeof opportunityApi.update>[1]) {
    if (!opp) return
    try {
      await opportunityApi.update(opp.id, data)
      fetchOpportunity()
      setEditOpen(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="py-8 text-center text-gray-400">加载中...</div>
  if (!opp) return <div className="py-8 text-center text-gray-400">商机不存在</div>

  const isClosed = opp.status !== 'IN_PROGRESS'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/opportunities')}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回商机列表
          </button>
          <h1 className="text-xl font-bold text-gray-800">{opp.name}</h1>
        </div>
        <div className="flex gap-2">
          {!isClosed && (
            <>
              <button
                onClick={() => setAdvanceOpen(true)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                推进阶段
              </button>
              <button
                onClick={() => setCloseOpen(true)}
                className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                关闭商机
              </button>
            </>
          )}
          {!isClosed && (
            <button
              onClick={() => setEditOpen(true)}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              编辑
            </button>
          )}
        </div>
      </div>

      {/* Overview Card */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4">
          <StageBar currentStage={opp.stage} />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">状态</p>
            <span className={`mt-1 inline-block rounded border px-2 py-0.5 text-sm ${statusColors[opp.status as OpportunityStatus] || ''}`}>
              {statusLabels[opp.status as OpportunityStatus] || opp.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">当前阶段</p>
            <p className="mt-1 text-sm font-medium">{stageLabels[opp.stage]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">赢率</p>
            <p className="mt-1 text-sm font-medium">{opp.winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">金额</p>
            <p className="mt-1 text-sm font-medium">{opp.currency || 'CNY'} {opp.amount?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">客户</p>
            <p className="mt-1 text-sm font-medium">{opp.customer?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">负责人</p>
            <p className="mt-1 text-sm font-medium">{opp.owner?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">预计成交日</p>
            <p className="mt-1 text-sm font-medium">{opp.expectedCloseDate ? opp.expectedCloseDate.slice(0, 10) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">商机来源</p>
            <p className="mt-1 text-sm font-medium">{opp.source || '-'}</p>
          </div>
        </div>
        {opp.description && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">描述</p>
            <p className="mt-1 text-sm text-gray-700">{opp.description}</p>
          </div>
        )}
        {opp.competitor && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">竞争对手</p>
            <p className="mt-1 text-sm text-gray-700">{opp.competitor}</p>
          </div>
        )}
      </div>

      {/* Stage History */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">阶段推进历史</h2>
        <StageTimeline histories={opp.stageHistories || []} />
      </div>

      <AdvanceStageModal
        open={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        onSubmit={handleAdvance}
        currentStage={opp.stage}
      />
      <CloseOpportunityModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onSubmit={handleClose}
      />
      <OpportunityFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={opp}
        customers={customers}
      />
    </div>
  )
}
