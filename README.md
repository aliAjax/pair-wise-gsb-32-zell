# TripWeaver 旅游行程规划助手

## 快速启动

```bash
pnpm install
pnpm dev
```

访问地址：http://localhost:18417

TripWeaver 是一款纯前端旅行规划应用，支持创建旅行、探索景点、编排每日行程、预算统计、**结伴账本结算**和分享预览。

## 主要功能

- 我的旅行：创建、筛选、删除旅行计划。
- 行程详情：查看每日行程、预算图表和共享时间线。
- 景点探索：按 SpotCategory 搜索和筛选，收藏并加入行程。
- 行程编排：SortableJS 拖拽排序，实时影响预算计算。
- 旅行账本：同伴垫付记账（付款人、参与人、类别、金额），按人头均摊，计算每人应收应付并给出最少转账建议。
  - 只允许旅行成员担任付款人/参与人；金额必须为正且最多两位小数，不合规条目不入账，进入「待核对区」并说明原因，可修正后重新提交。
  - 入账即扣减行程总预算与当天可用预算。
  - 已确认的转账可一键登记，结欠随之结平；刷新/重开浏览器后账目、待核对项与结算结果均从 localStorage 恢复。
- 分享预览：生成可复制的行程文本，并以只读方式展示同一套余额与个人结欠。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript |
| 构建 | Vite |
| UI | Element Plus + ECharts |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| 持久化 | localStorage + Dexie.js |
| 交互 | sortablejs |

## 目录结构

```
src/
├── api/
├── stores/
├── models/
├── types/
├── components/common/
├── hooks/
├── pages/
├── router/
├── utils/
├── config/
└── constants/
```

## 数据持久化

本地数据通过 `utils/storage.ts` 统一写入 localStorage，并保留 Dexie 数据库对象用于后续 IndexedDB 扩展。版本键来自 `constants/storageVersion.ts`。

账本三类数据分别独立持久化，关闭浏览器再打开仍在：

- `tripweaver-v1:expenses`：已入账花销（Expense[]）
- `tripweaver-v1:pendingExpenses`：待核对条目（PendingExpense[]，含不合规原因）
- `tripweaver-v1:settlementPayments`：已确认转账（SettlementPayment[]，结算结果）

## 旅行账本的分层设计

账目模型、分摊规则、持久化与页面相互独立，改动一层不影响其余层：

| 关注点 | 位置 |
| --- | --- |
| 账目模型 | `src/models/ledger.ts`（Expense / PendingExpense / MemberBalance / SettlementTransfer / SettlementPayment） |
| 类别枚举 | `src/constants/ledger.ts`（ExpenseCategory） |
| 校验规则 | `src/utils/validators.ts` 的 `validateExpenseDraft` / `parseAmount` |
| 均摊与结算 | `src/utils/ledgerSettlement.ts`（按人头均摊、净额计算、贪心最少转账） |
| 预算扣减 | `src/utils/budgetCalculator.ts`（入账即扣行程与当天预算） |
| 持久化 API | `src/api/ledgerApi.ts` + `constants/storageVersion.ts` + `utils/storage.ts`（Dexie v2） |
| 状态管理 | `src/stores/ledgerStore.ts`（Pinia） |
| 统一数据视图 | `src/hooks/useLedger.ts`（详情页与分享页共用同一套余额/结欠） |
| 页面与组件 | `src/pages/TripLedger.vue`、`src/components/ledger/*` |

分摊规则：一笔花销按参与人头数均摊到分，无法整除时余下的每 1 分按参与人顺序补给前若干人，保证每人分摊之和精确等于原金额。每人净结欠 = 垫付合计 − 应摊合计：正数应收、负数应付；最少转账建议用「最大债权人 × 最大债务人」贪心匹配生成。

## 环境变量

`VITE_AMAP_KEY`：高德地图 key。未配置时使用 demo-key，地图主题配置同时出现在 `config/map.ts`、`SpotCard`、`DayTimeline`、`Planner` 相关逻辑中。

## 枚举出现位置清单

SpotCategory：
- `src/constants/spot.ts`
- `src/models/spot.ts`
- `src/stores/spotStore.ts`
- `src/components/common/CategoryFilter.vue`
- `src/components/common/SpotCard.vue`
- `src/pages/Spots.vue`
- `src/pages/TripDetail.vue`
- `src/utils/formatters.ts`
- `src/router/guards.ts`

TripStatus：
- `src/constants/trip.ts`
- `src/models/trip.ts`
- `src/stores/tripStore.ts`
- `src/components/common/TripCard.vue`
- `src/pages/Trips.vue`
- `src/utils/formatters.ts`
- `src/router/guards.ts`

ExpenseCategory：
- `src/constants/ledger.ts`
- `src/models/ledger.ts`
- `src/utils/validators.ts`
- `src/utils/formatters.ts`
- `src/components/ledger/ExpenseForm.vue`
- `src/components/ledger/ExpenseList.vue`
- `src/components/ledger/PendingReview.vue`

## License

MIT

