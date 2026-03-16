# PRO-KOM — Licznik numerów napraw (format PROKOM/RMA/N/rok)

from django.db import migrations, models


def init_sequence(apps, schema_editor):
    RepairNumberSequence = apps.get_model("repairs", "RepairNumberSequence")
    RepairRequest = apps.get_model("repairs", "RepairRequest")
    RepairNumberSequence.objects.get_or_create(
        pk=1,
        defaults={"last_value": RepairRequest.objects.count()},
    )


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0012_repair_image_type_choices"),
    ]

    operations = [
        migrations.CreateModel(
            name="RepairNumberSequence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("last_value", models.PositiveIntegerField(default=0, verbose_name="ostatni numer")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="aktualizacja")),
            ],
            options={
                "verbose_name": "licznik numerów napraw",
                "verbose_name_plural": "liczniki numerów napraw",
            },
        ),
        migrations.RunPython(init_sequence, migrations.RunPython.noop),
    ]
