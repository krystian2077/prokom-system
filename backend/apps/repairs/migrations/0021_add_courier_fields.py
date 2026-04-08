"""
PRO-KOM Serwis — Migrations: Add courier tracking fields for outbound delivery
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repairs', '0020_partusage_custom_part_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='repairrequest',
            name='client_courier',
            field=models.CharField(
                blank=True,
                choices=[
                    ('inpost', 'InPost'),
                    ('dpd', 'DPD'),
                    ('dhl', 'DHL'),
                    ('gls', 'GLS'),
                    ('fedex', 'FedEx'),
                    ('ups', 'UPS'),
                ],
                default='',
                help_text='Przewoźnik, którym klient wysyła urządzenie do serwisu.',
                max_length=20,
                verbose_name='przewoźnik wysyłki od klienta'
            ),
        ),
        migrations.AddField(
            model_name='repairrequest',
            name='service_tracking_number',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Numer przesyłki - gdy serwis wysyła urządzenie do klienta kurierem.',
                max_length=100,
                verbose_name='numer listu przewozowego do klienta'
            ),
        ),
        migrations.AddField(
            model_name='repairrequest',
            name='service_courier',
            field=models.CharField(
                blank=True,
                choices=[
                    ('inpost', 'InPost'),
                    ('dpd', 'DPD'),
                    ('dhl', 'DHL'),
                    ('gls', 'GLS'),
                    ('fedex', 'FedEx'),
                    ('ups', 'UPS'),
                ],
                default='',
                help_text='Przewoźnik, którym serwis wysyła urządzenie do klienta.',
                max_length=20,
                verbose_name='przewoźnik wysyłki do klienta'
            ),
        ),
    ]

