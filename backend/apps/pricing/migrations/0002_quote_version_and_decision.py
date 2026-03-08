# PRO-KOM — QuoteVersion, QuoteDecision (historia wyceny i decyzja klienta)

from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("pricing", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="QuoteVersion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="data utworzenia")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="data aktualizacji")),
                ("version_number", models.PositiveSmallIntegerField(verbose_name="numer wersji")),
                ("total_amount", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=10, verbose_name="suma")),
                ("items_snapshot", models.JSONField(default=list, help_text="Lista dict: item_type, description, quantity, unit_price, total", verbose_name="snapshot pozycji")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_quote_versions", to=settings.AUTH_USER_MODEL, verbose_name="utworzone przez")),
                ("quote", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="versions", to="pricing.quote", verbose_name="wycena")),
            ],
            options={
                "verbose_name": "wersja wyceny",
                "verbose_name_plural": "wersje wyceny",
                "ordering": ["quote", "-version_number"],
                "unique_together": {("quote", "version_number")},
            },
        ),
        migrations.CreateModel(
            name="QuoteDecision",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("decision", models.CharField(choices=[("accepted", "Zaakceptowano"), ("rejected", "Odrzucono")], max_length=20, verbose_name="decyzja")),
                ("decided_at", models.DateTimeField(default=timezone.now, verbose_name="data decyzji")),
                ("comment", models.TextField(blank=True, verbose_name="komentarz")),
                ("decided_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="quote_decisions", to=settings.AUTH_USER_MODEL, verbose_name="zdecydował (klient)")),
                ("quote", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="decision", to="pricing.quote", verbose_name="wycena")),
            ],
            options={
                "verbose_name": "decyzja wyceny",
                "verbose_name_plural": "decyzje wycen",
            },
        ),
    ]
