# ProtectPibble (Class Companion)

Collaborative “class pet” accountability app.

This repo is a **monorepo** with:

- `frontend/`: React + TypeScript + TanStack Query + Tailwind (Vite)
- `backend/`: FastAPI + Postgres + Alembic (migrations) + optional Celery/Redis worker

## Quickstart (local dev)

1) Copy env file:

```bash
cp env.example .env
```

2) Install deps (frontend + backend) and (optionally) start local services:

```bash
chmod +x ./scripts/bootstrap ./scripts/dev
./scripts/bootstrap
```

3) Run dev servers:

```bash
./scripts/dev
```

## Local services (optional)

If you have Docker installed:

```bash
docker compose up -d
```

## Endpoints

- **Backend health**: `GET http://127.0.0.1:8000/health`
- **Frontend**: `http://127.0.0.1:5173`

## Notes

- This setup matches the architecture in `HACKATHON.docx` / `HACKATHON.pdf` (React + FastAPI + Postgres + worker).
- Auth is intended to use **Clerk** (see `env.example` placeholders).
