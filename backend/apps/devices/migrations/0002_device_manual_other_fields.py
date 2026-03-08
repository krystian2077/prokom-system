# PRO-KOM — Device: pola „inne urządzenie” (manual_device_name, manual_brand, manual_model)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("devices", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="device",
            name="manual_device_name",
            field=models.CharField(
                blank=True,
                help_text="Dla kategorii „inne urządzenie”",
                max_length=200,
                verbose_name="nazwa urządzenia (inne)",
            ),
        ),
        migrations.AddField(
            model_name="device",
            name="manual_brand",
            field=models.CharField(blank=True, max_length=100, verbose_name="marka (ręcznie)"),
        ),
        migrations.AddField(
            model_name="device",
            name="manual_model",
            field=models.CharField(blank=True, max_length=150, verbose_name="model (ręcznie)"),
        ),
    ]
