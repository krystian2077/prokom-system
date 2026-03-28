# Generated manually — numer domu/lokalu osobno od ulicy (formularz online).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0004_initial_orders_module"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientaddress",
            name="house_number",
            field=models.CharField(
                blank=True,
                default="",
                max_length=50,
                verbose_name="numer domu / lokalu",
            ),
        ),
        migrations.AlterField(
            model_name="clientaddress",
            name="street",
            field=models.CharField(max_length=200, verbose_name="ulica"),
        ),
    ]
