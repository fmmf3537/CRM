import type { Request, Response, NextFunction } from 'express'

interface CacheEntry {
  data: unknown
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function makeKey(req: Request): string {
  return `${req.method}:${req.originalUrl || req.url}`
}

export function cacheMiddleware(ttlMs = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      next()
      return
    }

    const key = makeKey(req)
    const hit = cache.get(key)
    if (hit && Date.now() < hit.expiresAt) {
      res.json(hit.data)
      return
    }

    const originalJson = res.json.bind(res)
    res.json = (body: unknown) => {
      cache.set(key, { data: body, expiresAt: Date.now() + ttlMs })
      return originalJson(body)
    }

    next()
  }
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key)
  }
}

export function invalidateCache(...patterns: string[]) {
  for (const key of cache.keys()) {
    for (const p of patterns) {
      if (key.includes(p)) {
        cache.delete(key)
        break
      }
    }
  }
}
