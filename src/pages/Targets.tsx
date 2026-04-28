import { useState, useEffect, useCallback } from 'react'
import { targetApi } from '../api/performance'
import { userApi } from '../api/users'
import type { Target } from '../types/performance'
import { targetTypeLabels } from '../types/performance'
import TargetFormModal from '../components/performance/TargetFormModal'
import { useAuth } from '../hooks/useAuth'

export default function Targets() {
  const { user } = useAuth()
  const [targets, setTargets] = useState<Target[]>([])
  const [users, setUsers] = useState<{ id: number; name: string; role: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Target | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())

  const canManage = user && ['MANAGER', 'EXECUTIVE', 'ADMIN'].includes(user.role)

  const fetchTargets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await targetApi.list({ year, pageSize: 100 })
      setTargets(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchTargets()
    userApi.list().then((res) => setUsers(res.data)).catch(() => {})
  }, [fetchTargets])

  async function handleCreate(data: Parameters<typeof targetApi.create>[0]) {
    try {
      await targetApi.create(data)
      setModalOpen(false)
      fetchTargets()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleUpdate(data: Parameters<typeof targetApi.update>[1]) {
    if (!editing) return
    try {
      await targetApi.update(editing.id, data)
      setModalOpen(false)
      setEditing(null)
      fetchTargets()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (!canManage) {
    return (
      <div className="py-8 text-center text-gray-400">
        <p>您没有权限查看此页面</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">目标设置</h1>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 设置目标
        </button>
      </div>

      <div className="flex gap-3 rounded-lg bg-white p-4 shadow-sm">
        <label className="text-sm text-gray-500 py-2">年份：</label>
        <input
          type="number"
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
        />
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">负责人</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">年份</th>
              <th className="px-4 py-3 font-medium">季度</th>
              <th className="px-4 py-3 font-medium">月份</th>
              <th className="px-4 py-3 font-medium">目标金额</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>}
            {!loading && targets.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无目标</td></tr>}
            {targets.map((t) => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">{t.owner?.name || '-'}</td>
                <td className="px-4 py-3">{targetTypeLabels[t.type]}</td>
                <td className="px-4 py-3">{t.year}</td>
                <td className="px-4 py-3">{t.quarter ? `Q${t.quarter}` : '-'}</td>
                <td className="px-4 py-3">{t.month ? `${t.month}月` : '-'}</td>
                <td className="px-4 py-3 font-medium">{t.currency} {t.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setEditing(t); setModalOpen(true) }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TargetFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={editing ? handleUpdate : handleCreate}
        initialData={editing}
        users={users}
      />
    </div>
  )
}
