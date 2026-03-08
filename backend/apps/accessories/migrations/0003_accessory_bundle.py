# PRO-KOM — AccessoryBundle, AccessoryBundleItem

import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accessories", "0002_add_repair_accessory_interest"),
    ]

    operations = [
        migrations.CreateModel(
            name="AccessoryBundle",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="data utworzenia")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="data aktualizacji")),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(db_index=True, max_length=200, verbose_name="nazwa")),
                ("slug", models.SlugField(blank=True, max_length=120, unique=True, verbose_name="slug")),
                ("description", models.TextField(blank=True, verbose_name="opis")),
                ("is_active", models.BooleanField(default=True, verbose_name="aktywny")),
                ("sort_order", models.PositiveSmallIntegerField(default=0, verbose_name="kolejność")),
            ],
            options={
                "verbose_name": "pakiet akcesoriów",
                "verbose_name_plural": "pakiety akcesoriów",
                "ordering": ["sort_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="AccessoryBundleItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveSmallIntegerField(default=1, verbose_name="ilość")),
                (
                    "fixed_price",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Opcjonalnie: cena w pakiecie (bez nadpisywania = cena produktu).",
                        max_digits=10,
                        null=True,
                        verbose_name="cena nadpisana",
                    ),
                ),
                (
                    "bundle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="accessories.accessorybundle",
                        verbose_name="pakiet",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="bundle_items",
                        to="accessories.accessoryproduct",
                        verbose_name="produkt",
                    ),
                ),
            ],
            options={
                "verbose_name": "pozycja pakietu",
                "verbose_name_plural": "pozycje pakietu",
                "ordering": ["bundle", "id"],
                "unique_together": {("bundle", "product")},
            },
        ),
    ]
