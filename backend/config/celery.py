"""
PRO-KOM Serwis — Konfiguracja Celery
====================================
Aplikacja Celery z autodiscover tasks z apps.
"""
from celery import Celery
from django.conf import settings

app = Celery("prokom")
app.config_from_object(settings, namespace="CELERY")
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Task testowy (np. z beat)."""
    print(f"Request: {self.request!r}")
