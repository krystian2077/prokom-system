# Generated manually for RepairNote.thread_origin

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("repairs", "0018_staff_planned_work_date"),
    ]

    operations = [
        migrations.AddField(
            model_name="repairnote",
            name="thread_origin",
            field=models.CharField(
                choices=[
                    ("client", "Klient (panel)"),
                    ("staff", "Pracownik (panel)"),
                    ("system", "System"),
                    ("email_inbound", "E-mail przychodzący"),
                ],
                db_index=True,
                default="staff",
                help_text="Dla widocznych dla klienta wpisów: kto/nad czym — wątek wiadomości.",
                max_length=20,
                verbose_name="pochodzenie w wątku",
            ),
        ),
        migrations.AddIndex(
            model_name="repairnote",
            index=models.Index(fields=["repair", "thread_origin"], name="repairs_rep_repair_i_6f8b2f_idx"),
        ),
    ]
