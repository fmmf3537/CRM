# Dashboard 改进 Plan

## 一、当前问题诊断

### 1. `change`（环比）字段完全缺失

`Dashboard.tsx` 中 4 张核心数据卡片（总客户数、进行中商机、总签约额、本月活动）虽然 `value` 是动态获取的，但 `change` 字段始终为空字符串 `''`。卡片下方预留了「较上月」的 UI 位置（第 92–98 行），但永远渲染不出来。

### 2. 前端发起 4 次独立请求

Dashboard 通过 `Promise.all` 同时调用：
- `/customers?pageSize=1`
- `/opportunities?pageSize=1&status=IN_PROGRESS`
- `/performance/summary`
- `/activities?pageSize=5`

虽然并行，但每次只取 `pagination.total`，属于「为了拿总数而查询整表」的迂回做法，不够优雅。

### 3. 缺少关键业务指标

当前仪表盘没有展示以下高价值数据：
- 本月新增线索数及环比
- 待跟进活动数量
- 逾期跟进提醒数
- 未读通知数
- 本月回款金额

---

## 二、改进方案：后端新增聚合接口 + 前端重构

推荐 **方案 B**：后端提供一个专门的 Dashboard Summary 接口，前端一次请求拿到所有数据。

### 后端部分

**新增文件：`server/routes/dashboard.ts`**

接口设计：

```ts
GET /api/dashboard/summary
```

返回数据结构：

```json
{
  "customers": {
    "total": 120,
    "thisMonth": 12,
    "lastMonth": 8,
    "change": 50.0
  },
  "leads": {
    "total": 230,
    "thisMonth": 25,
    "lastMonth": 20,
    "change": 25.0
  },
  "opportunities": {
    "inProgress": 45,
    "thisMonth": 6,
    "lastMonth": 4,
    "change": 50.0
  },
  "activities": {
    "thisMonth": 35,
    "lastMonth": 28,
    "change": 25.0
  },
  "achievements": {
    "thisMonth": {
      "dealAmount": 580000,
      "paidAmount": 320000,
      "orderCount": 6
    },
    "lastMonth": {
      "dealAmount": 420000,
      "paidAmount": 280000,
      "orderCount": 4
    }
  },
  "targets": {
    "targetAmount": 1000000,
    "completionRate": 58.0
  },
  "pending": {
    "followUpActivities": 8,
    "overdueActivities": 2,
    "unreadNotifications": 5
  }
}
```

**后端实现要点：**
- 利用 Prisma 的 `aggregate({ _sum: ..., _count: ... })` + `count({ where: { createdAt: { gte, lte } } })` 计算本期/上期数据
- `getPeriodRange` 复用 `server/routes/performance.ts` 中已有的月份区间工具函数
- 环比计算公式：`(本期 - 上期) / 上期 * 100`，上期为零时返回 `null`
- 添加 `authMiddleware`，普通销售仅查看自己的数据，管理层可查看团队汇总
- 添加短缓存（如 60 秒），避免每次刷新都查整表

**注册路由：** 在 `server/index.ts` 中增加：
```ts
import dashboardRoutes from './routes/dashboard.js'
app.use('/api/dashboard', dashboardRoutes)
```

### 前端部分

#### 1. 改造 `Dashboard.tsx`

- 将 4 次独立 `fetch` 替换为单次 `fetch('/api/dashboard/summary')`
- stat cards 数据结构扩展为支持 `change`：
  ```ts
  { label: '总客户数', value: '120', change: '+50%', changeType: 'up', ... }
  ```
- 根据 `change` 正负值渲染绿涨红跌（或仅展示绝对值百分比）
- 恢复「较上月」UI 的显示逻辑

#### 2. 新增快捷数据卡片（可选）

在原有 4 张卡片下方或侧边，增加「待跟进活动」「逾期提醒」「未读通知」等快捷入口，点击直接跳转到对应模块。

#### 3. `PerformanceCards.tsx` 保持不变

该组件已经调用 `/api/performance/summary` 获取动态数据，功能正常。如需展示环比，可在接口中扩展 `lastMonthDealAmount` 字段，或在 Dashboard Summary 中返回 achievements 明细后复用。

#### 4. `TopRanking.tsx` 保持不变

该组件已动态获取业绩排行，无需改动。

---

## 三、改造范围

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `server/routes/dashboard.ts` | 新增 | Dashboard 聚合数据接口 |
| `server/index.ts` | 修改 | 注册 `/api/dashboard` 路由 |
| `src/pages/Dashboard.tsx` | 修改 | 接入新接口，恢复环比 UI |
| `src/api/dashboard.ts` | 新增 | 前端 API 封装（如有统一封装习惯） |

---

## 四、预期效果

- **环比数据可见**：每张核心卡片都会显示「较上月 +XX%」或「较上月 -XX%」，趋势一目了然
- **请求次数减少**：从 4 次并发请求降为 1 次
- **新增业务洞察**：待跟进、逾期、未读等关键待办前置到首页
- **后端职责清晰**：Dashboard 专属接口，避免「为了总数查整表」的 hack 做法
