import { useState, useEffect } from 'react'
import { adminApi } from '../../api/admin'
import type { ConfigItem, ConfigKey } from '../../types/admin'
import { configKeyLabels } from '../../types/admin'
import { Settings, Plus, Trash2, Save } from 'lucide-react'

const CONFIG_KEYS: ConfigKey[] = [
  'customerGrades',
  'industries',
  'productCategories',
  'regions',
  'leadSources',
  'activityTypes',
  'stages',
]

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState<ConfigKey>('customerGrades')
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await adminApi.config.get(activeTab)
        setItems(res.value || [])
      } catch (err: any) {
        alert(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeTab])

  async function handleSave() {
    setSaving(true)
    try {
      await adminApi.config.update(activeTab, items)
      alert('保存成功')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  function addItem() {
    const newItem: ConfigItem = { value: '', label: '' }
    if (activeTab === 'activityTypes') newItem.score = 1
    if (activeTab === 'stages') newItem.winRate = 0
    setItems([...items, newItem])
  }

  function updateItem(index: number, field: keyof ConfigItem, value: any) {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  function removeItem(index: number) {
    const next = [...items]
    next.splice(index, 1)
    setItems(next)
  }

  const showScore = activeTab === 'activityTypes'
  const showWinRate = activeTab === 'stages'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings size={20} className="text-blue-600" />
          基础配置
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONFIG_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {configKeyLabels[key]}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white shadow-sm p-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">值（value）</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    value={item.value}
                    onChange={(e) => updateItem(i, 'value', e.target.value)}
                    placeholder="如：A"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs text-gray-500">显示名称（label）</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    value={item.label}
                    onChange={(e) => updateItem(i, 'label', e.target.value)}
                    placeholder="如：A级客户"
                  />
                </div>
                {showScore && (
                  <div className="w-24">
                    <label className="text-xs text-gray-500">分值</label>
                    <input
                      type="number"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={item.score ?? 0}
                      onChange={(e) => updateItem(i, 'score', parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
                {showWinRate && (
                  <div className="w-24">
                    <label className="text-xs text-gray-500">赢率(%)</label>
                    <input
                      type="number"
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={item.winRate ?? 0}
                      onChange={(e) => updateItem(i, 'winRate', parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
                <button
                  onClick={() => removeItem(i)}
                  className="mt-5 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus size={16} />
              添加配置项
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
