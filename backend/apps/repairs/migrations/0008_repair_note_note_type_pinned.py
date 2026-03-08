# PRO-KOM — RepairNote: note_type, pinned

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0007_reminder_log"),
    ]

    operations = [
        migrations.AddField(
            model_name="repairnote",
            name="note_type",
            field=models.CharField(
                choices=[
                    ("internal", "wewnętrzna"),
                    ("system", "systemowa"),
                    ("client_contact", "kontakt z klientem"),
                ],
                db_index=True,
                default="internal",
                max_length=20,
                verbose_name="typ notatki",
            ),
        ),
        migrations.AddField(
            model_name="repairnote",
            name="pinned",
            field=models.BooleanField(
                default=False,
                help_text="Przypięte notatki wyświetlane na górze",
                verbose_name="przypięta",
            ),
        ),
        migrations.AlterModelOptions(
            name="repairnote",
            options={"ordering": ["-pinned", "-created_at"], "verbose_name": "notatka naprawy", "verbose_name_plural": "notatki napraw"},
        ),
    ]
