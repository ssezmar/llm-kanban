```markdown
<div align="center">
  <img src="docs/logo.png" alt="LLM Kanban" height="80" />
  <br /><br />

<strong>LLM Kanban</strong>

  <p>Task management platform for teams that delegate work to LLM agents</p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind" />
    <img src="https://img.shields.io/badge/status-UI%20prototype-f59e0b?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="License" />
  </p>

  <br />

  <img src="docs/dashboard.png" alt="LLM Kanban Dashboard" width="100%" />
</div>

---

## Overview

LLM Kanban is a task management platform designed for teams that delegate development work to AI agents. Instead of assigning tasks to people, a manager describes a task in natural language as a prompt — the agent executes it autonomously.

The platform provides full visibility into agent workload, task lifecycle, execution logs, and performance analytics — all in a single interface.

---

## Features

**Board & Tasks**

- Kanban board with drag-and-drop cards across customizable columns
- WIP limits per column with configurable transition rules
- Subtasks, attachments, comments, and review scores per task
- Prompt field on every task card — structured instructions for the assigned agent

**Agents**

- Assign tasks to LLM agents: Claude Sonnet, o3-mini, Gemini 2.5 Pro, or custom models
- Per-agent dashboards: completed tasks, success rate, average execution time, model config
- Real-time status indicators: idle, busy, offline

**Project Management**

- Group tasks into Epics with custom icons, colors, and target dates
- Configurable board columns and allowed transition rules via a visual graph editor (React Flow)
- Role-based access: Admin, Manager, Developer, Viewer

**Developer Tools**

- Interactive ER diagram with draggable tables and relation highlights
- System architecture diagram built into the app
- Use-case and tech-stack reference pages

---

## Tech Stack

### Frontend

| Technology   | Version | Purpose                  |
| ------------ | ------- | ------------------------ |
| React        | 19      | UI framework             |
| TypeScript   | 5       | Type safety              |
| Vite         | 6       | Build tool               |
| Tailwind CSS | 3       | Styling                  |
| Zustand      | latest  | State management         |
| React Flow   | latest  | Transition graph editor  |
| dnd-kit      | latest  | Drag & Drop              |
| D3.js        | 7       | ER diagram visualization |
| Lucide React | latest  | Icon set                 |

### Backend _(planned)_

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| API Gateway    | Go, Chi, JWT, gRPC                     |
| Microservices  | 9x Go services (gRPC + Protobuf)       |
| Primary DB     | PostgreSQL 16                          |
| Analytics DB   | ClickHouse 24                          |
| Search         | Elasticsearch                          |
| Cache          | Redis 7 Cluster + Sentinel             |
| Event Bus      | Apache Kafka + Kafka Connect (CDC)     |
| Object Storage | MinIO (S3-compatible)                  |
| Infrastructure | Kubernetes 1.30, HashiCorp Vault, Helm |
| Observability  | Prometheus, Grafana, Jaeger, Loki      |

---

## Project Structure
```

xlurr-llm-kanban/
├── docs/
│ ├── logo.png # Project logotype
│ └── dashboard.png # Main dashboard screenshot
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ └── ui/ # Base UI primitives (Button, Card, Dialog, ...)
│ │ ├── pages/
│ │ │ ├── board.tsx # Kanban board
│ │ │ ├── dashboard.tsx # Main dashboard
│ │ │ ├── agent-profile.tsx # Agent profile & metrics
│ │ │ ├── epics.tsx # Epic management
│ │ │ ├── architecture.tsx # System architecture diagram
│ │ │ ├── board-settings.tsx
│ │ │ └── ...
│ │ ├── stores/ # Zustand stores
│ │ ├── hooks/ # Custom React hooks
│ │ └── lib/ # Utilities, mock data, types
│ ├── vite.config.ts
│ └── tailwind.config.js
└── class-diagram.html # Standalone interactive ER diagram

````

***

## Getting Started

**Requirements:** Node.js >= 20

```bash
git clone https://github.com/xlurr/llm-kanban.git
cd llm-kanban/frontend
npm install
npm run dev
````

App will be available at `http://localhost:5173`.

---

## Supported Agents

| Agent        | Model           | Avg. Execution Time | Success Rate |
| ------------ | --------------- | ------------------- | ------------ |
| Claude Code  | claude-sonnet-4 | ~12 min             | 94%          |
| Codex CLI    | o3-mini         | ~8 min              | 87%          |
| Gemini CLI   | gemini-2.5-pro  | ~15 min             | 81%          |
| Custom Agent | llama-3.1-70b   | ~25 min             | 75%          |

---

## Roadmap

- [x] Kanban UI with drag-and-drop
- [x] Agent profiles and performance metrics
- [x] Transition graph editor (React Flow)
- [x] Epic management
- [x] ER diagram and architecture diagram
- [x] Use-case and tech-stack reference pages
- [ ] Go backend (microservices)
- [ ] Real-time updates via WebSocket
- [ ] Agent task execution pipeline
- [ ] JWT authentication
- [ ] Analytics dashboard (ClickHouse)
- [ ] Kubernetes deployment manifests

---

## License

```

```
