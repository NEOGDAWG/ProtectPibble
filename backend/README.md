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
- Migrations use Alembic. Once models exist:
  - `cd backend && . .venv/bin/activate && alembic revision --autogenerate -m "..." && alembic upgrade head`

