FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Unprivileged runtime user (audit T-21). Writable: static/media volumes and local backups.
RUN useradd --uid 10001 --create-home --home-dir /home/app app \
    && mkdir -p /app/staticfiles /app/media /app/backups \
    && chown app:app /app/staticfiles /app/media /app/backups

USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--config", "gunicorn.conf.py"]
