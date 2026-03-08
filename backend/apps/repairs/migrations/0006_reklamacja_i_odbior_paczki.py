# PRO-KOM — Reklamacja (parent_repair, repair_type) + odbiór paczki

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0005_add_is_incomplete"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="repairrequest",
            name="parent_repair",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="complaint_repairs",
                to="repairs.repairrequest",
                verbose_name="naprawa nadrzędna (reklamacja)",
            ),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="repair_type",
            field=models.CharField(
                choices=[
                    ("standard", "Standardowa"),
                    ("warranty", "Gwarancyjna"),
                    ("complaint", "Reklamacja"),
                    ("scheduled", "Z umówionym terminem"),
                ],
                db_index=True,
                default="standard",
                max_length=20,
                verbose_name="typ sprawy",
            ),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="package_received_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="odebrano paczkę"),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="package_received_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="package_received_repairs",
                to=settings.AUTH_USER_MODEL,
                verbose_name="paczkę odebrał",
            ),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="package_ok",
            field=models.BooleanField(blank=True, null=True, verbose_name="paczka bez zastrzeżeń"),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="request_number_attached",
            field=models.BooleanField(
                blank=True,
                null=True,
                verbose_name="numer zgłoszenia dołączony do przesyłki",
            ),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="package_notes",
            field=models.TextField(blank=True, verbose_name="notatki do odbioru paczki"),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="package_photo",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="repairs/package_photos/%Y/%m/",
                verbose_name="zdjęcie paczki/urządzenia",
            ),
        ),
    ]
