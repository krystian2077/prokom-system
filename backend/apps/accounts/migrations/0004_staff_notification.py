# PRO-KOM — StaffNotification (Staff Notifications Center)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_staff_profile_extension"),
        ("repairs", "0010_repair_attention_and_complaint_status"),
    ]

    operations = [
        migrations.CreateModel(
            name="StaffNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "notification_type",
                    models.CharField(
                        db_index=True,
                        help_text="np. repair_assigned, client_message, note_added, quote_accepted, part_arrived, sla_exceeded",
                        max_length=50,
                        verbose_name="typ",
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("low", "niski"),
                            ("standard", "standardowy"),
                            ("important", "ważny"),
                            ("urgent", "pilny"),
                        ],
                        db_index=True,
                        default="standard",
                        max_length=20,
                        verbose_name="priorytet",
                    ),
                ),
                ("title", models.CharField(max_length=200, verbose_name="tytuł")),
                ("description", models.TextField(blank=True, verbose_name="opis")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("unread", "nieprzeczytane"),
                            ("read", "przeczytane"),
                            ("archived", "zarchiwizowane"),
                        ],
                        db_index=True,
                        default="unread",
                        max_length=20,
                        verbose_name="status",
                    ),
                ),
                (
                    "link",
                    models.CharField(
                        blank=True,
                        help_text="Ścieżka do widoku, np. /staff/repairs/xxx",
                        max_length=500,
                        verbose_name="link",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="data utworzenia")),
                (
                    "repair",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="staff_notifications",
                        to="repairs.repairrequest",
                        verbose_name="naprawa",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="staff_notifications",
                        to="accounts.user",
                        verbose_name="pracownik",
                    ),
                ),
            ],
            options={
                "verbose_name": "powiadomienie pracownika",
                "verbose_name_plural": "powiadomienia pracowników",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="staffnotification",
            index=models.Index(
                fields=["user", "status", "-created_at"],
                name="accounts_st_user_id_8a1b2c_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="staffnotification",
            index=models.Index(
                fields=["user", "notification_type"],
                name="accounts_st_user_id_9b2c3d_idx",
            ),
        ),
    ]
