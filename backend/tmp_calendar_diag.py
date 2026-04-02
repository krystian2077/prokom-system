from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
admin, _ = User.objects.get_or_create(email='diag-admin@example.com', defaults={'role': 'admin', 'is_active': True})
if not admin.is_active or admin.role != 'admin':
    admin.is_active = True
    admin.role = 'admin'
    admin.save(update_fields=['is_active', 'role'])

client = APIClient()
client.force_authenticate(user=admin)
resp = client.get('/api/v1/calendar/month/?from=2026-04-01&to=2026-04-30&scope=team')
print('STATUS', resp.status_code)
print(resp.content.decode('utf-8')[:2000])

