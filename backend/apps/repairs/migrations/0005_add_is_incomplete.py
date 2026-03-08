# Generated for PRO-KOM — szybkie przyjęcie (niekompletne zgłoszenie)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repairs', '0004_add_audit_log'),
    ]

    operations = [
        migrations.AddField(
            model_name='repairrequest',
            name='is_incomplete',
            field=models.BooleanField(
                default=False,
                help_text='Szybkie przyjęcie — do uzupełnienia później',
                verbose_name='niekompletne zgłoszenie',
            ),
        ),
    ]
