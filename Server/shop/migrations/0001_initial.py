"""Initial migration — creates shop_items and shop_redemptions tables."""

import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ShopItem",
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
                ("description", models.TextField(blank=True, default="")),
                ("points_cost", models.IntegerField()),
                ("category", models.CharField(max_length=100)),
                ("stock", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "shop_items",
                "ordering": ["category", "name"],
                "indexes": [
                    models.Index(fields=["is_active"], name="shop_items_is_active_idx"),
                    models.Index(fields=["category"], name="shop_items_category_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="Redemption",
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
                ("code", models.CharField(max_length=20, unique=True)),
                ("redeemed_at", models.DateTimeField(auto_now_add=True)),
                (
                    "item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="redemptions",
                        to="shop.shopitem",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="redemptions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "shop_redemptions",
                "ordering": ["-redeemed_at"],
                "indexes": [
                    models.Index(fields=["user"], name="shop_redemptions_user_idx"),
                    models.Index(fields=["item"], name="shop_redemptions_item_idx"),
                ],
            },
        ),
    ]
