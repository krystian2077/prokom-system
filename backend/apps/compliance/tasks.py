"""
PRO-KOM Serwis — Compliance tasks (Celery).
============================================
Backup bazy i/lub plików media.
"""
import os
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from django.conf import settings
from django.utils import timezone

from celery import shared_task
from apps.compliance.models import BackupLog


@shared_task(bind=True, name="compliance.run_backup")
def run_backup(self, backup_type="database", triggered_by_id=None):
    """
    Wykonuje backup: database | media | full.
    Tworzy wpis BackupLog (started → success/failed).
    """
    log_entry = BackupLog.objects.create(
        triggered_by_id=triggered_by_id,
        backup_type=backup_type,
        status="started",
    )
    backup_root = Path(getattr(settings, "BACKUP_ROOT", settings.BASE_DIR / "backups"))
    backup_root.mkdir(parents=True, exist_ok=True)
    date_str = timezone.now().strftime("%Y%m%d_%H%M%S")
    storage_path = ""
    error_message = ""

    try:
        if backup_type in ("database", "full"):
            db_settings = settings.DATABASES["default"]
            engine = db_settings.get("ENGINE", "")
            if "postgresql" in engine:
                name = db_settings.get("NAME")
                user = db_settings.get("USER", "")
                host = db_settings.get("HOST", "localhost")
                port = db_settings.get("PORT", "5432")
                out_file = backup_root / f"db_{date_str}.sql"
                cmd = [
                    "pg_dump",
                    "-h", host,
                    "-p", str(port),
                    "-U", user,
                    "-f", str(out_file),
                    name,
                ]
                env = os.environ.copy()
                if db_settings.get("PASSWORD"):
                    env["PGPASSWORD"] = db_settings["PASSWORD"]
                subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)
                storage_path = str(out_file)
            else:
                # SQLite
                db_path = Path(db_settings.get("NAME", ""))
                if db_path.is_file():
                    out_file = backup_root / f"db_{date_str}.sqlite3"
                    shutil.copy2(db_path, out_file)
                    storage_path = str(out_file)

        if backup_type in ("media", "full"):
            media_root = Path(settings.MEDIA_ROOT)
            if media_root.exists():
                out_dir = backup_root / f"media_{date_str}"
                shutil.copytree(media_root, out_dir, dirs_exist_ok=True)
                storage_path = storage_path + (" | " if storage_path else "") + str(out_dir)

        log_entry.status = "success"
        log_entry.storage_path = storage_path
    except Exception as e:
        log_entry.status = "failed"
        log_entry.error_message = str(e)[:2000]
    finally:
        log_entry.finished_at = timezone.now()
        log_entry.save(update_fields=["status", "storage_path", "error_message", "finished_at"])

    return {"log_id": log_entry.id, "status": log_entry.status}
