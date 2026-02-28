"""
Views for the shop domain.

Endpoints
---------
GET  /shop/items/             — list all active items (public)
POST /shop/items/<item_id>/redeem/  — authenticated, deducts points and returns code
GET  /shop/redemptions/my/    — authenticated, returns the caller's redemption history
"""

from django.db import IntegrityError

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from common.responses import api_response
from shop.models import Redemption, ShopItem
from shop.serializers import RedemptionReadSerializer, ShopItemReadSerializer
from shop.services import redeem_shop_item


class ShopItemListView(APIView):
    """Return the full list of active shop items.  No authentication required."""

    permission_classes = [AllowAny]

    def get(self, request):
        items = ShopItem.objects.filter(is_active=True)
        return api_response(
            True,
            "Shop items fetched.",
            ShopItemReadSerializer(items, many=True).data,
            200,
        )


class RedeemItemView(APIView):
    """
    Redeem a single shop item.

    Delegates to shop.services.redeem_shop_item which handles all
    concurrency-safe stock and balance checks inside a transaction.
    On success, the response includes the full redemption record (including
    the unique code) plus the user's updated point balance.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        try:
            redemption = redeem_shop_item(user=request.user, item_id=str(item_id))
        except ShopItem.DoesNotExist:
            return api_response(False, "Item not found or is no longer available.", None, 404)
        except ValueError as exc:
            return api_response(False, str(exc), None, 400)
        except IntegrityError:
            # Extremely rare: UUID code collision — ask the client to retry.
            return api_response(False, "Redemption code conflict, please retry.", None, 500)

        data = RedemptionReadSerializer(redemption).data
        # Attach the updated balance so the frontend can update its counter
        # without a separate /points/my/ request.
        data["remaining_points"] = request.user.total_points
        return api_response(True, "Item redeemed successfully.", data, 201)


class MyRedemptionsView(APIView):
    """Return all redemptions made by the logged-in user, newest first."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        redemptions = (
            Redemption.objects.filter(user=request.user)
            .select_related("item")
            .order_by("-redeemed_at")
        )
        return api_response(
            True,
            "Redemptions fetched.",
            RedemptionReadSerializer(redemptions, many=True).data,
            200,
        )
