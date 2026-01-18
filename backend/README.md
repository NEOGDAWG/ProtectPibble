## Backend (FastAPI)

### Setup

From repo root:

```bash
./scripts/bootstrap
```

### Run

```bash
./scripts/dev
```

### Notes

- API health check: `GET /health`
- Demo auth (MVP): send headers `X-Demo-Email` and optionally `X-Demo-Name`
- Migrations use Alembic. Once models exist:
  - `cd backend && . .venv/bin/activate && alembic revision --autogenerate -m "..." && alembic upgrade head`

### Run migrations (first time)

With a Postgres `DATABASE_URL` set (see repo root `.env`):

```bash
cd backend
. .venv/bin/activate
alembic upgrade head
```

### Worker (deadline penalties)

This runs the “pet takes damage after deadlines” loop:

```bash
cd backend
. .venv/bin/activate
python -m workers.apply_deadline_penalties
```

Run once (useful for demo):

```bash
WORKER_ONCE=1 python -m workers.apply_deadline_penalties
```

