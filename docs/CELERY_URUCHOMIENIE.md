# Celery — uruchomienie workera i beat (PRO-KOM backend)

## Wymagania

- Redis działa (np. `redis-server`), domyślnie `localhost:6379`.
- Zmienne opcjonalne: `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` (domyślnie `redis://localhost:6379/0`).

## Uruchomienie

**Terminal 1 — worker (wykonywanie zadań):**
```bash
cd backend
celery -A config worker -l info
```

**Terminal 2 — beat (harmonogram zadań):**
```bash
cd backend
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Harmonogram ustawiasz w **Django Admin** → **Periodic Tasks** (django-celery-beat), np.:
- **Backup:** task `compliance.run_backup`, argumenty `["database"]`, crontab `0 2 * * *` (codziennie 2:00).
- **Smart reminders:** task `repairs.send_smart_reminders`, crontab `0 8 * * *` (codziennie 8:00).
- **Snapshoty pracowników:** task `analytics.build_employee_stats_snapshots`, crontab `0 1 * * *` (codziennie 1:00).

## Ręczny backup (bez workera)

```bash
python manage.py run_backup database --sync
python manage.py run_backup full --sync
```

Zadanie w kolejce (wymaga działającego workera):
```bash
python manage.py run_backup database
```
