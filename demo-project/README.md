# demo-project

A minimal Go + React application designed to showcase the LLM Kanban GitHub integration.

This project demonstrates:
- Multi-job CI/CD pipeline with DAG dependencies
- PR workflow with checks and reviews
- GitHub Issues for task tracking

## Structure

```
demo-project/
  backend/        Go HTTP API (health, CRUD)
  frontend/       React app (Vite + TypeScript)
  .github/
    workflows/
      ci.yml      Main CI pipeline (lint → test → build → deploy)
      release.yml Release workflow (build → publish → deploy-prod)
```

## Getting Started

```bash
# Backend
cd backend && go run main.go

# Frontend
cd frontend && npm install && npm run dev
```

## CI Pipeline (DAG)

```
      ┌─────┐
      │ lint │
      └──┬──┘
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│test-be│ │test-fe│
└───┬───┘ └───┬───┘
    ▼         ▼
┌────────┐ ┌────────┐
│build-be│ │build-fe│
└────┬───┘ └───┬────┘
     └────┬────┘
          ▼
    ┌──────────┐
    │  deploy   │
    │ staging   │
    └─────┬────┘
          ▼
    ┌──────────┐
    │  deploy   │
    │   prod    │
    └──────────┘
```
