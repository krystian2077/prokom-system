# PRO-KOM — NotificationRule (reguły powiadomień)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("communications", "0001_initial_communications"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_name", models.CharField(db_index=True, help_text="np. quote_sent, status_ready_for_pickup, reminder_unclaimed", max_length=50, verbose_name="zdarzenie")),
                ("send_panel", models.BooleanField(default=True, verbose_name="wyślij do panelu klienta")),
                ("send_email", models.BooleanField(default=False, verbose_name="wyślij e-mail")),
                ("send_sms", models.BooleanField(default=False, verbose_name="wyślij SMS")),
                ("is_active", models.BooleanField(default=True, verbose_name="aktywna")),
                ("template", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="notification_rules", to="communications.messagetemplate", verbose_name="szablon")),
            ],
            options={
                "verbose_name": "reguła powiadomień",
                "verbose_name_plural": "reguły powiadomień",
                "ordering": ["event_name"],
            },
        ),
    ]
