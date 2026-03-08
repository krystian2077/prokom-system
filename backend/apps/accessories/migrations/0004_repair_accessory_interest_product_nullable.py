# PRO-KOM — RepairAccessoryInterest.product nullable (dla "wybierz za mnie" z formularza)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accessories", "0003_accessory_bundle"),
    ]

    operations = [
        migrations.AlterField(
            model_name="repairaccessoryinterest",
            name="product",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="repair_interests",
                to="accessories.accessoryproduct",
                verbose_name="produkt",
            ),
        ),
    ]
