from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0002_event_banner_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="time",
            field=models.TimeField(null=True, blank=True),
        ),
    ]
