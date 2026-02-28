"""Admin registration for the shop app."""

from django.contrib import admin

from shop.models import Redemption, ShopItem


@admin.register(ShopItem)
class ShopItemAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "points_cost", "stock", "is_active", "created_at"]
    list_filter = ["is_active", "category"]
    search_fields = ["name", "description"]
    list_editable = ["stock", "is_active"]
    ordering = ["category", "name"]


@admin.register(Redemption)
class RedemptionAdmin(admin.ModelAdmin):
    list_display = ["user", "item", "code", "redeemed_at"]
    list_filter = ["item", "redeemed_at"]
    search_fields = ["user__roll_no", "user__email", "code", "item__name"]
    readonly_fields = ["id", "user", "item", "code", "redeemed_at"]
    ordering = ["-redeemed_at"]
