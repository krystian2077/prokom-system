# PRO-KOM — Zmiana primary key StaffNotification z BigAutoField na UUIDField

import uuid
from django.db import migrations, models


def populate_uuid_ids(apps, schema_editor):
    StaffNotification = apps.get_model("accounts", "StaffNotification")
    db_alias = schema_editor.connection.alias
    for obj in StaffNotification.objects.using(db_alias).all().iterator():
        if not getattr(obj, "uuid_id", None):
            obj.uuid_id = uuid.uuid4()
            obj.save(update_fields=["uuid_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0011_password_reset_token"),
    ]

    operations = [
        migrations.AddField(
            model_name="staffnotification",
            name="uuid_id",
            field=models.UUIDField(null=True, editable=False),
        ),
        migrations.RunPython(populate_uuid_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="staffnotification",
            name="uuid_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.RemoveField(
            model_name="staffnotification",
            name="id",
        ),
        migrations.RenameField(
            model_name="staffnotification",
            old_name="uuid_id",
            new_name="id",
        ),
        migrations.AlterField(
            model_name="staffnotification",
            name="id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]

