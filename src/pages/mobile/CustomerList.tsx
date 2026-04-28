import { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, MapPin, RefreshCw, Building2 } from 'lucide-react'
import { customerApi } from '../../api/customers'
import type { Customer } from '../../types/customer'
import { industryLabels, gradeLabels, statusLabels, statusColors } from '../../types/customer'

export default function MobileCustomerList() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const pullDistance = useRef(0)

  const loadingRef = useRef(false)

  const fetchCustomers = useCallback(async (p: number, append = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await customerApi.list({ page: p, pageSize: 10, keyword: debouncedKeyword })
      if (append) {
        setCustomers((prev) => [...prev, ...res.data])
      } else {
        setCustomers(res.data)
      }
      setHasMore(res.pagination.page < res.pagination.totalPages)
      setPage(p)
    } catch (err) {
      console.error(err)
    } finally {
      loadingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [debouncedKeyword])

  useEffect(() => {
    fetchCustomers(1, false)
  }, [fetchCustomers])

  function handleRefresh() {
    setRefreshing(true)
    fetchCustomers(1, false)
  }

  function handleLoadMore() {
    if (hasMore && !loading) {
      fetchCustomers(page + 1, true)
    }
  }

  // Pull to refresh
  function handleTouchStart(e: React.TouchEvent) {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      const diff = e.touches[0].clientY - touchStartY.current
      if (diff > 0) pullDistance.current = diff
    }
  }

  function handleTouchEnd() {
    if (pullDistance.current > 80) {
      handleRefresh()
    }
    pullDistance.current = 0
  }

  // Infinite scroll
  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (scrollHeight - scrollTop - clientHeight < 100) {
      handleLoadMore()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Search Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3 h-10">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="搜索客户名称..."
              className="bg-transparent flex-1 ml-2 text-sm outline-none"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCustomers(1, false)}
            />
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center min-h-[44px]"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div className="py-2 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <RefreshCw size={12} className="animate-spin" />
          刷新中...
        </div>
      )}

      {/* Customer Cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-auto px-4 py-3 space-y-3"
      >
        {customers.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/mobile/customers/${c.id}`)}
            className="bg-white rounded-xl p-4 shadow-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColors[c.status]}`}>
                      {statusLabels[c.status]}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {gradeLabels[c.grade]} · {industryLabels[c.industry]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              {c.region && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {c.region}
                </span>
              )}
              {c.owner && (
                <span className="flex items-center gap-1">
                  <Phone size={12} />
                  {c.owner.name}
                </span>
              )}
            </div>
          </div>
        ))}

        {customers.length === 0 && !loading && (
          <div className="py-12 text-center text-sm text-gray-400">暂无客户</div>
        )}

        {loading && customers.length > 0 && (
          <div className="py-3 text-center text-xs text-gray-400">加载中...</div>
        )}

        {!hasMore && customers.length > 0 && (
          <div className="py-3 text-center text-xs text-gray-400">没有更多了</div>
        )}
      </div>
    </div>
  )
}
