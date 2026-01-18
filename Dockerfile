FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/

# Expose port (Railway will set PORT env var)
EXPOSE 8000

# Run the app
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
