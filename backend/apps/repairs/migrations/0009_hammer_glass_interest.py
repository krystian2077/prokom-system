# PRO-KOM — RepairRequest.hammer_glass_interest (z formularza publicznego)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0008_repair_note_note_type_pinned"),
    ]

    operations = [
        migrations.AddField(
            model_name="repairrequest",
            name="hammer_glass_interest",
            field=models.CharField(
                blank=True,
                choices=[
                    ("yes", "Tak, proszę o ofertę"),
                    ("no", "Nie"),
                    ("ask_later", "Zapytam później"),
                    ("free_with_quote", "Gratis przy wycenie"),
                ],
                db_index=True,
                max_length=20,
                null=True,
                verbose_name="zainteresowanie Hammer Glass",
            ),
        ),
    ]
