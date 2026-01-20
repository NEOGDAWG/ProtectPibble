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
- **Backend docs**: `http://127.0.0.1:8000/docs`
- **Frontend**: `http://127.0.0.1:5173`

## Deployment

To deploy online so multiple people can access it:

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide**

Quick summary:
- **Frontend**: Deploy to [Vercel](https://vercel.com) (free tier available)
- **Backend + Database**: Deploy to [Render](https://render.com/) - it provides both! (free tier available)

The app supports multiple users joining the same class project via invite codes. Each group has shared tasks that everyone needs to complete to keep the pet healthy.

## Notes

- This setup matches the architecture in `HACKATHON.docx` / `HACKATHON.pdf` (React + FastAPI + Postgres + worker).
- Auth is intended to use **Clerk** (see `env.example` placeholders).
- For production deployment, see `DEPLOYMENT.md`.

## MVP API (backend)

Demo auth for now: include headers on requests:

- `X-Demo-Email: you@example.com`
- `X-Demo-Name: Your Name` (optional)

Key endpoints:

- `POST /groups`
- `POST /groups/join`
- `GET /groups/my`
- `GET /groups/{group_id}/state`
- `POST /groups/{group_id}/tasks`
- `PATCH /tasks/{task_id}`
- `DELETE /tasks/{task_id}`
- `POST /tasks/{task_id}/complete`
- `POST /groups/{group_id}/nudges` (disabled in INSTRUCTOR mode MVP)
