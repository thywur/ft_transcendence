# Generated by Django 5.1.1 on 2024-11-19 12:49

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Message",
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
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("chat.private", "Private"),
                            ("chat.public", "Public"),
                        ],
                        default="chat.public",
                        max_length=15,
                    ),
                ),
                ("content", models.TextField()),
                ("author", models.CharField(max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["created_at"],
            },
        ),
        migrations.CreateModel(
            name="Relationship",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("ACCEPTED", "Accepted"),
                            ("REJECTED", "Rejected"),
                            ("BLOCKED", "Blocked"),
                        ],
                        default="PENDING",
                        max_length=8,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="User",
            fields=[
                (
                    "id",
                    models.UUIDField(editable=False, primary_key=True, serialize=False),
                ),
                ("name", models.CharField(max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ON", "Online"),
                            ("OFF", "Offline"),
                            ("PLAYING", "Playing"),
                        ],
                        default="OFF",
                        max_length=10,
                    ),
                ),
                (
                    "friends",
                    models.ManyToManyField(
                        related_name="+", through="chat.Relationship", to="chat.user"
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="relationship",
            name="receiver",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="receiver",
                to="chat.user",
            ),
        ),
        migrations.AddField(
            model_name="relationship",
            name="sender",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sender",
                to="chat.user",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="relationship",
            unique_together={("sender", "receiver")},
        ),
    ]
