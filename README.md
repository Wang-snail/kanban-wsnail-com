> **说明**：本仓库原名 `wsnail-com`，已改名为 `kanban-wsnail-com`，对应看板子站 https://kanban.wsnail.com / 看板·工具后台。主站「桌间漫游」镜像见仓库 `wsnail-com`（https://wsnail.com）。

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
