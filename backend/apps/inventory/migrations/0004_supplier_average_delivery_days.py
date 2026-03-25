# Generated manually for PRO-KOM — średni czas dostawy hurtowni

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0003_parts_catalog_and_usage_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="supplier",
            name="average_delivery_days",
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text="Orientacyjnie: ile dni od zamówienia do dostawy.",
                null=True,
                verbose_name="średni czas dostawy (dni)",
            ),
        ),
    ]
