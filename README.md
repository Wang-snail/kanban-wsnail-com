> **说明**：本仓库原名 `wsnail-com`，已改名为 `kanban-wsnail-com`，对应看板子站 https://kanban.wsnail.com / 看板·工具后台。主站「桌间漫游」镜像见仓库 `wsnail-com`（https://wsnail.com）。

## 为何暂时不能自动部署（2026-10-22）

线上看板跑在 Cloudflare Pages 项目 `wz-main`（自定义域 `kanban.wsnail.com`），Functions 里有：

- 管理接口 `X-Admin-Token` 鉴权（env `NODES_ADMIN_TOKEN`）
- `/api/analytics/track` + D1 `ANALYTICS_DB`
- 增强版 `/api/health`（nodes 统计 / 可选 autorestore）

而本仓原先还是 AI Studio 模板前端 + 无鉴权的旧 Functions。若把 GitHub `main` 直接接到 Pages 生产，会把线上鉴权和统计冲掉，节点 KV 也可能被旧 Seed（`N-001…`）污染（线上实际是 `F02/Q06/A08…` 约 26 个）。

因此：**本 PR 只把代码对齐到可验收状态，禁止 merge 后自动打 production，也禁止加 push→Pages 的 GitHub Actions。**

`dist/` 目录提交的是从线上拉取的静态构建产物（标题「WSNAIL Amazon｜亚马逊电商全业务节点平台」），assets 路径为 `/assets/...`。本地 `npm run build` 仍会从 AI Studio 源码打出另一套产物——在源码未从备份恢复前，**不要用 vite 构建覆盖 `dist/`**。

### Preview 验收清单（只在 preview / 分支部署上做）

1. 打开 preview URL，首页标题与线上一致，静态资源 200。
2. `GET /api/nodes`（无头）→ **401** `{"success":false,"error":"Unauthorized"}`。
3. `GET /api/nodes` 带正确 `X-Admin-Token` → 200（preview KV 可能是空/Seed，属正常）。
4. CORS 预检 `Access-Control-Allow-Headers` 含 `X-Admin-Token`。
5. `GET /api/nodes/published` → 200（无需 token）。
6. `GET /api/health` → 200，且 `data.nodes` 含 `total` / `published` / `minPublished` / `restored`。
7. `POST /api/analytics/track` + JSON body → 200 `{"success":true}`；`GET` 同路径 → **405**。
8. 响应头可见 CSP / `X-Frame-Options: DENY`（`dist/_headers` / `public/_headers`）。

### 禁止事项

- **禁止** `wrangler pages deploy` 打到 production / 自定义域。
- **禁止** 合并后开启 GitHub → Pages 生产自动部署。
- **禁止** 把真实 `NODES_ADMIN_TOKEN` 或其他密钥写进仓库、Issue、PR 正文。
- **禁止** 对生产 KV 调用 `/api/nodes/reset`（会写入旧 Seed）。

生产 secrets（`NODES_ADMIN_TOKEN`、`NODES_HEALTH_AUTORESTORE`、`NODES_MIN_PUBLISHED`）只在 Cloudflare 控制台配置；本仓 `.env.example` 仅作占位说明。

---

# wsnail.com

A Vite 6 + React 19 web application with admin dashboard and node calculator features.

## Project Structure

- **Main App**: Vite-based React SPA with dashboard, flow editor, template center, and reporting
- **Admin Panel**: Separate admin interface for managing nodes and users (run with `VITE_APP_MODE=admin`)
- **wsnail-optimize/**: Nested Next.js 16 project for optimization tools

## Tech Stack

- **Frontend**: React 19, Vite 6, TailwindCSS 4, Motion 12
- **AI**: Google Generative AI (@google/genai)
- **API**: Express + Hono with Node adapter
- **Deployment**: 
  - Cloudflare Workers/EdgeOne Functions (wz-main project)
  - Vercel redirects (www → https://wsnail.com)

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Servers

```bash
# Frontend (port 3001)
npm run dev

# Admin panel (port 3000)
npm run dev:admin

# API server
npm run api

# All together
npm run dev:all
```

### Build

```bash
# Production build
npm run build

# Admin build
npm run build:admin

# Type check
npm run lint
```

## Configuration

Set `GEMINI_API_KEY` in `.env.local` for AI features.

## wsnail-optimize/ Subproject

A separate Next.js 16 application with:
- Prisma ORM + PostgreSQL
- Tools and scenes management
- FBA fee calculator
- Testing with Jest

See `wsnail-optimize/README.md` for details (if available).

## Note

The repository homepage field points to https://wz-main.vercel.app which currently returns DEPLOYMENT_NOT_FOUND.
