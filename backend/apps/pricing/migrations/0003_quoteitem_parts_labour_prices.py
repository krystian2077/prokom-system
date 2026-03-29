# Generated manually — pozycja wyceny: cena części + robocizna (suma = cena jedn.)

from decimal import Decimal

from django.db import migrations, models


def forwards_split_unit_price(apps, schema_editor):
    QuoteItem = apps.get_model("pricing", "QuoteItem")
    for row in QuoteItem.objects.all().iterator():
        u = row.unit_price or Decimal("0")
        row.parts_price = Decimal("0")
        row.labour_price = u
        row.save(update_fields=["parts_price", "labour_price"])


class Migration(migrations.Migration):

    dependencies = [
        ("pricing", "0002_quote_version_and_decision"),
    ]

    operations = [
        migrations.AddField(
            model_name="quoteitem",
            name="parts_price",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                max_digits=10,
                verbose_name="cena części (jedn.)",
            ),
        ),
        migrations.AddField(
            model_name="quoteitem",
            name="labour_price",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                max_digits=10,
                verbose_name="cena robocizny (jedn.)",
            ),
        ),
        migrations.RunPython(forwards_split_unit_price, migrations.RunPython.noop),
    ]
