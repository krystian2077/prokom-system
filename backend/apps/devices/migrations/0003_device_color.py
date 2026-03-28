from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("devices", "0002_device_manual_other_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="device",
            name="color",
            field=models.CharField(blank=True, default="", max_length=64, verbose_name="kolor"),
        ),
    ]
