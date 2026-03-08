# PRO-KOM — EmployeeStatsSnapshot (dzienne statystyki pracowników)

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="EmployeeStatsSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(db_index=True, verbose_name="data")),
                ("repairs_count", models.PositiveIntegerField(default=0, verbose_name="liczba napraw (przypisanych/zakończonych)")),
                ("delayed_repairs_count", models.PositiveIntegerField(default=0, verbose_name="zaległe naprawy")),
                ("quotes_sent_count", models.PositiveIntegerField(default=0, verbose_name="wysłane wyceny")),
                ("ready_for_pickup_count", models.PositiveIntegerField(default=0, verbose_name="gotowe do odbioru")),
                ("upsell_total", models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name="suma upsell (akcesoria/HG)")),
                ("profit_total", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name="zysk (opcjonalnie)")),
                (
                    "employee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="stats_snapshots",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="pracownik",
                    ),
                ),
            ],
            options={
                "verbose_name": "snapshot statystyk pracownika",
                "verbose_name_plural": "snapshoty statystyk pracowników",
                "ordering": ["-date", "employee"],
                "unique_together": {("employee", "date")},
            },
        ),
        migrations.AddIndex(
            model_name="employeestatssnapshot",
            index=models.Index(fields=["employee", "date"], name="analytics_e_employe_8a1b2c_idx"),
        ),
    ]
