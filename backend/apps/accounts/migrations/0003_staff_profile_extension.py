# PRO-KOM — Rozszerzenie StaffProfile (specjalizacja, kalendarz, podpisy)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_add_login_activity"),
    ]

    operations = [
        migrations.AddField(
            model_name="staffprofile",
            name="specialization",
            field=models.CharField(
                blank=True,
                choices=[
                    ("phone_tablet", "Telefony, tablety, smartwatche, odzyskiwanie danych"),
                    ("laptop_printer", "Laptopy, komputery, konsole, drukarki"),
                    ("general", "Ogólne / proste naprawy"),
                ],
                db_index=True,
                max_length=30,
                verbose_name="specjalizacja",
            ),
        ),
        migrations.AddField(
            model_name="staffprofile",
            name="calendar_color",
            field=models.CharField(
                blank=True,
                default="#3498db",
                max_length=7,
                verbose_name="kolor w kalendarzu",
            ),
        ),
        migrations.AddField(
            model_name="staffprofile",
            name="display_name",
            field=models.CharField(blank=True, max_length=100, verbose_name="nazwa do podpisu"),
        ),
        migrations.AddField(
            model_name="staffprofile",
            name="login_alias",
            field=models.CharField(blank=True, max_length=50, verbose_name="alias w logach"),
        ),
        migrations.AddField(
            model_name="staffprofile",
            name="is_visible_in_rankings",
            field=models.BooleanField(default=True, verbose_name="widoczny w rankingach"),
        ),
    ]
