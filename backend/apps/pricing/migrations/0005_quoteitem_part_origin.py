# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pricing", "0004_alter_quoteitem_unit_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="quoteitem",
            name="part_origin",
            field=models.CharField(
                choices=[("original", "Oryginalna (OEM)"), ("aftermarket", "Zamiennik")],
                db_index=True,
                default="aftermarket",
                max_length=20,
                verbose_name="część oryginalna / zamiennik",
            ),
        ),
    ]
