"""
Shop domain models.

ShopItem  — catalogue entry with a points cost and stock counter.
Redemption — immutable record created each time a user redeems an item.
             Stores the unique one-time code the user presents to collect
             their reward.
"""

import uuid

from django.conf import settings
from django.db import models


class ShopItem(models.Model):
    """
    A redeemable reward available in the shop.

    stock is decremented atomically inside shop.services.redeem_shop_item.
    is_active lets admins delist items without deleting historical data.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    points_cost = models.IntegerField()
    category = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "shop_items"
        ordering = ["category", "name"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.points_cost} pts)"


class Redemption(models.Model):
    """
    Immutable record of a successful redemption.

    code is the unique alphanumeric identifier the student presents when
    collecting the physical or digital reward.  It is generated once on
    creation and never changes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="redemptions",
    )
    item = models.ForeignKey(
        ShopItem,
        on_delete=models.PROTECT,  # prevents deleting an item that has been redeemed
        related_name="redemptions",
    )
    # Unique short code, e.g. "SHOP-A1B2C3D4".
    code = models.CharField(max_length=20, unique=True)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "shop_redemptions"
        ordering = ["-redeemed_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["item"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.roll_no} - {self.item.name} [{self.code}]"
