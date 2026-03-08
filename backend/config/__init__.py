"""
PRO-KOM Serwis — Config package.
Przy starcie Django ładujemy app Celery.
"""
from .celery import app as celery_app

__all__ = ("celery_app",)
