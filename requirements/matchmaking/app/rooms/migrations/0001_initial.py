# Generated by Django 5.1.1 on 2024-12-16 14:09

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Room",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("players", models.JSONField(default=list)),
                ("owner", models.UUIDField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PLAYING", "Playing"),
                            ("WAITING", "Waiting"),
                            ("FINISHED", "Finished"),
                            ("READY", "Ready"),
                        ],
                        default="WAITING",
                        max_length=8,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Tournament",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("owner", models.UUIDField()),
                ("players", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PLAYING", "Playing"),
                            ("WAITING", "Waiting"),
                            ("FINISHED", "Finished"),
                            ("READY", "Ready"),
                        ],
                        default="WAITING",
                        max_length=8,
                    ),
                ),
                (
                    "round",
                    models.CharField(
                        choices=[("FIRST", "First"), ("FINAL", "Final")],
                        default="FIRST",
                        max_length=5,
                    ),
                ),
                (
                    "max_players",
                    models.IntegerField(choices=[(2, "Two"), (4, "Four")], default=4),
                ),
            ],
        ),
    ]
