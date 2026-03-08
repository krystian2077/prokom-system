# PRO-KOM — RepairRequest: requires_attention, last_*_at, complaint_warranty_status

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0009_hammer_glass_interest"),
    ]

    operations = [
        migrations.AddField(
            model_name="repairrequest",
            name="requires_attention",
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text="Ustawiane przez logikę: nowa wiadomość, brak odpowiedzi, SLA, reklamacja bez decyzji itd.",
                verbose_name="wymaga reakcji",
            ),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="last_client_message_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="ostatnia wiadomość od klienta"),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="last_staff_reply_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="ostatnia odpowiedź staffu do klienta"),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="last_activity_at",
            field=models.DateTimeField(
                blank=True,
                db_index=True,
                help_text="Ostatnia zmiana statusu, notatka lub wiadomość",
                null=True,
                verbose_name="ostatnia aktywność",
            ),
        ),
        migrations.AddField(
            model_name="repairrequest",
            name="complaint_warranty_status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("accepted", "Przyjęta"),
                    ("verification", "Weryfikacja"),
                    ("awaiting_decision", "Oczekuje na decyzję"),
                    ("recognized", "Uznana"),
                    ("rejected", "Odrzucona"),
                    ("in_progress", "W trakcie realizacji"),
                    ("closed", "Zakończona"),
                ],
                db_index=True,
                max_length=20,
                null=True,
                verbose_name="status reklamacji/gwarancji",
            ),
        ),
    ]
