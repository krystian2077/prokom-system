# PRO-KOM — ReminderLog (log wysłanych przypomnień, anti-spam)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0006_reklamacja_i_odbior_paczki"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReminderLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "event_name",
                    models.CharField(
                        db_index=True,
                        help_text="np. reminder_no_quote, reminder_unclaimed, reminder_scheduled_visit, reminder_quick_accept_incomplete",
                        max_length=50,
                        verbose_name="zdarzenie",
                    ),
                ),
                ("sent_at", models.DateTimeField(auto_now_add=True, verbose_name="wysłano")),
                (
                    "repair",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reminder_logs",
                        to="repairs.repairrequest",
                        verbose_name="naprawa",
                    ),
                ),
            ],
            options={
                "verbose_name": "log przypomnienia",
                "verbose_name_plural": "logi przypomnień",
                "ordering": ["-sent_at"],
            },
        ),
        migrations.AddIndex(
            model_name="reminderlog",
            index=models.Index(
                fields=["repair", "event_name", "-sent_at"],
                name="repairs_rem_repair__a0e1c4_idx",
            ),
        ),
    ]
