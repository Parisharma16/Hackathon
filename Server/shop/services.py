"""
Service layer for shop redemption.

redeem_shop_item is the single entry point for all redemption logic:
  1. Locks item and user rows to prevent race conditions under concurrent requests.
  2. Validates stock and points balance inside the transaction.
  3. Decrements stock, creates the Redemption record with a unique code, writes a
     DEBIT entry to the point ledger, and recomputes the user's total points.

All steps run inside one @transaction.atomic block so a partial failure
leaves no traces in the database.
"""

import uuid

from django.db import transaction

from points.models import LedgerEntryType, LedgerSource, PointLedger
from points.services import update_user_total_points
from shop.models import Redemption, ShopItem


@transaction.atomic
def redeem_shop_item(user, item_id: str) -> Redemption:
    """
    Atomically redeem a shop item on behalf of a user.

    Args:
        user:    The authenticated User ORM instance performing the redemption.
        item_id: Primary key (UUID) of the ShopItem to redeem.

    Returns:
        The newly created Redemption instance.

    Raises:
        ShopItem.DoesNotExist: If the item does not exist or is inactive.
        ValueError:            If the item is out of stock or the user has
                               insufficient points.
    """
    # select_for_update acquires row-level locks so concurrent requests cannot
    # double-spend points or over-redeem a low-stock item.
    item: ShopItem = ShopItem.objects.select_for_update().get(pk=item_id, is_active=True)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    locked_user = User.objects.select_for_update().get(pk=user.pk)

    if item.stock <= 0:
        raise ValueError("This item is out of stock.")

    if locked_user.total_points < item.points_cost:
        raise ValueError(
            f"Insufficient points. You have {locked_user.total_points} pts "
            f"but this item costs {item.points_cost} pts."
        )

    # Generate a unique redemption code.  uuid4 hex is 32 chars; 8 chars gives
    # 4 billion combinations which is more than enough for a campus platform.
    code = f"SHOP-{uuid.uuid4().hex[:8].upper()}"

    # Decrement stock.
    item.stock -= 1
    item.save(update_fields=["stock"])

    # Create the permanent redemption record.
    redemption = Redemption.objects.create(user=locked_user, item=item, code=code)

    # Write a DEBIT ledger entry with a negative points value so the sum in
    # update_user_total_points() decreases the user's total correctly.
    PointLedger.objects.create(
        user=locked_user,
        event=None,
        entry_type=LedgerEntryType.DEBIT,
        points=-item.points_cost,
        reason=f"Redeemed shop item: {item.name} (code={code})",
        source=LedgerSource.REDEMPTION,
    )

    # Recompute and persist the authoritative total.
    update_user_total_points(locked_user)

    # Propagate the updated total back to the caller's in-memory object so the
    # view can return remaining_points without an extra query.
    user.total_points = locked_user.total_points

    return redemption
