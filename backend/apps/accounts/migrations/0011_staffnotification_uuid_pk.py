# PRO-KOM — Zmiana primary key StaffNotification z BigAutoField na UUIDField

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_verification_attempt_and_block"),
    ]

    operations = [
        # Dodaj nowe pole UUID
        migrations.AddField(
            model_name='staffnotification',
            name='uuid_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        # Operacja surowego SQL: poprawnie skopiuj dane
        migrations.RunSQL(
            sql="UPDATE accounts_staffnotification SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;",
            reverse_sql="",
            state_operations=[],
        ),
        # Usuń stare id
        migrations.RemoveField(
            model_name='staffnotification',
            name='id',
        ),
        # Rename uuid_id na id
        migrations.RenameField(
            model_name='staffnotification',
            old_name='uuid_id',
            new_name='id',
        ),
        # Ustaw id jako primary key
        migrations.AlterField(
            model_name='staffnotification',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]

