"""URL patterns for the shop app."""

from django.urls import path

from shop.views import MyRedemptionsView, RedeemItemView, ShopItemListView


urlpatterns = [
    # Catalogue — public
    path("items/", ShopItemListView.as_view(), name="shop-items-list"),
    # Redemption — authenticated
    # Note: redemptions/my/ must be defined before items/<uuid:item_id>/redeem/
    # to avoid the router treating "redemptions" as a UUID segment.
    path("redemptions/my/", MyRedemptionsView.as_view(), name="shop-redemptions-my"),
    path("items/<uuid:item_id>/redeem/", RedeemItemView.as_view(), name="shop-item-redeem"),
]
