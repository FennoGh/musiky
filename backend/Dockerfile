FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        build-essential libpq5 curl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
 && apt-get purge -y --auto-remove build-essential

COPY . /app

RUN mkdir -p /app/uploads/covers /app/uploads/audio /app/staticfiles

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn musiky.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 90"]
