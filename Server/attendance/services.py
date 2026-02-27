"""Service functions for attendance marking workflows."""

from django.db import transaction

from accounts.models import User
from attendance.models import Attendance
from events.models import Event
from points.services import award_participation_points


@transaction.atomic
def mark_attendance(event: Event, roll_number_list: list[str]) -> dict:
    """
    Mark attendance for each roll number and award participation points.

    This service keeps all related writes atomic for each invocation:
    attendance row creation, participation creation, ledger insertion, and
    total points refresh.
    """
    users = User.objects.filter(roll_no__in=roll_number_list)
    users_by_roll = {user.roll_no: user for user in users}

    created_count = 0
    skipped_rolls: list[str] = []

    for roll_no in roll_number_list:
        user = users_by_roll.get(roll_no)
        if user is None:
            skipped_rolls.append(roll_no)
            continue

        attendance, created = Attendance.objects.get_or_create(
            user=user,
            event=event,
            defaults={"confidence": None},
        )
        if not created:
            skipped_rolls.append(roll_no)
            continue

        created_count += 1
        award_participation_points(user=user, event=event, source="attendance")

    return {
        "marked_count": created_count,
        "skipped_roll_numbers": skipped_rolls,
    }
