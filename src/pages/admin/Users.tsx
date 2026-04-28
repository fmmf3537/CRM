import { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import type { AdminUser } from '../../types/admin'
import { useAuth } from '../../hooks/useAuth'
import { Shield, UserPlus, Trash2, KeyRound, Pencil } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'SALES', label: '销售' },
  { value: 'MANAGER', label: '主管' },
  { value: 'EXECUTIVE', label: '高管' },
  { value: 'ADMIN', label: '管理员' },
]

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState('')

  const [form, setForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'SALES',
  })

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const res = await adminApi.users.list()
        setUsers(res.data)
      } catch (err: any) {
        alert(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ username: '', name: '', password: '', role: 'SALES' })
    setModalOpen(true)
  }

  function openEdit(u: AdminUser) {
    setEditing(u)
    setForm({ username: u.username, name: u.name, password: '', role: u.role })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await adminApi.users.update(editing.id, { name: form.name, role: form.role })
      } else {
        if (!form.password) { alert('密码为必填项'); return }
        await adminApi.users.create({
          username: form.username,
          name: form.name,
          password: form.password,
          role: form.role,
        })
      }
      setModalOpen(false)
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除此用户？')) return
    try {
      await adminApi.users.delete(id)
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleResetPassword() {
    if (!resetUserId || !resetPassword) return
    try {
      await adminApi.users.resetPassword(resetUserId, resetPassword)
      setResetModalOpen(false)
      setResetUserId(null)
      setResetPassword('')
      alert('密码已重置')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const roleLabel = (role: string) => ROLE_OPTIONS.find((r) => r.value === role)?.label || role

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          用户管理
        </h1>
        <button
          onClick={openCreate}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus size={16} />
          新增用户
        </button>
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">用户名</th>
              <th className="px-4 py-3 font-medium">姓名</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无用户</td></tr>}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{u.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded border px-2 py-0.5 text-xs ${
                    u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    u.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-700" title="编辑">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { setResetUserId(u.id); setResetModalOpen(true) }}
                      className="text-amber-600 hover:text-amber-700"
                      title="重置密码"
                    >
                      <KeyRound size={14} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-700" title="删除">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">{editing ? '编辑用户' : '新增用户'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">用户名 *</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editing}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">姓名 *</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              {!editing && (
                <div>
                  <label className="mb-1 block text-sm font-medium">密码 *</label>
                  <input
                    type="password"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">角色</label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">重置密码</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">新密码</label>
                <input
                  type="password"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="至少4位"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setResetModalOpen(false)} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
                <button onClick={handleResetPassword} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">确认重置</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
