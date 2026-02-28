"""Serializers for the shop domain."""

from rest_framework import serializers

from shop.models import Redemption, ShopItem


class ShopItemReadSerializer(serializers.ModelSerializer):
    """Read-only serializer for shop catalogue items."""

    class Meta:
        model = ShopItem
        fields = [
            "id",
            "name",
            "description",
            "points_cost",
            "category",
            "stock",
            "is_active",
        ]


class RedemptionReadSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for a completed redemption.

    Flattens the nested ShopItem fields so the client receives a flat object
    without having to navigate item.name etc.
    """

    item_id = serializers.UUIDField(source="item.id", read_only=True)
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_category = serializers.CharField(source="item.category", read_only=True)
    points_cost = serializers.IntegerField(source="item.points_cost", read_only=True)

    class Meta:
        model = Redemption
        fields = [
            "id",
            "item_id",
            "item_name",
            "item_category",
            "points_cost",
            "code",
            "redeemed_at",
        ]
