"""
Service functions for all point-awarding workflows.

Every public function in this module:
  - accepts ORM objects (not raw IDs) to keep call sites explicit.
  - is decorated with @transaction.atomic so partial writes cannot occur.
  - never mutates existing ledger rows; it only inserts new ones.
  - calls update_user_total_points() as its final step.
"""

from django.db import transaction
from django.db.models import Sum

from accounts.models import User
from events.models import Event
from points.models import LedgerEntryType, LedgerSource, Participation, ParticipationSource, PointLedger


@transaction.atomic
def update_user_total_points(user: User) -> None:
    """
    Recompute and persist total_points as the authoritative sum of all ledger
    entries for the given user.

    Using a direct SUM query rather than incremental counters avoids drift over
    time and makes the total auditable against the ledger at any moment.
    """
    aggregate = PointLedger.objects.filter(user=user).aggregate(total=Sum("points"))
    total = aggregate["total"] or 0
    User.objects.filter(pk=user.pk).update(total_points=total)
    # Refresh the in-memory instance so callers see the updated value.
    user.total_points = total


@transaction.atomic
def award_participation_points(user: User, event: Event, source: str) -> None:
    """
    Create a participation record and a corresponding ledger entry, then refresh
    total points.

    Args:
        user:   The student receiving points.
        event:  The event that triggered the award.
        source: One of ParticipationSource choices ('attendance' or 'submission').
    """
    # Map submission-style sources to the ledger source vocabulary.
    ledger_source_map: dict[str, str] = {
        "attendance": LedgerSource.ATTENDANCE,
        "submission": LedgerSource.ATTENDANCE,  # generic fallback; callers may override
        "certificate": LedgerSource.CERTIFICATE,
        "cgpa": LedgerSource.CGPA,
        "paper": LedgerSource.PAPER,
    }

    participation_source = (
        ParticipationSource.ATTENDANCE
        if source == ParticipationSource.ATTENDANCE
        else ParticipationSource.SUBMISSION
    )

    ledger_source = ledger_source_map.get(source, LedgerSource.ATTENDANCE)

    # get_or_create prevents double awarding when called idempotently.
    Participation.objects.get_or_create(
        user=user,
        event=event,
        source=participation_source,
        defaults={"verified": True},
    )

    # Prevent creating a duplicate ledger entry for the same (user, event, source).
    already_awarded = PointLedger.objects.filter(
        user=user, event=event, source=ledger_source
    ).exists()
    if already_awarded:
        return

    PointLedger.objects.create(
        user=user,
        event=event,
        entry_type=LedgerEntryType.CREDIT,
        points=event.points_per_participant,
        reason=f"Participation in {event.title} via {source}",
        source=ledger_source,
    )

    update_user_total_points(user)


@transaction.atomic
def award_winner_points(event: Event) -> None:
    """
    Award winner-tier points to every user listed in event.winners_roll_nos.

    Idempotency: if a winner ledger entry already exists for a (user, event)
    pair with source='winner', it is skipped to prevent double-awarding.
    """
    from accounts.models import User as UserModel  # local import avoids circular

    winner_rolls: list[str] = event.winners_roll_nos or []
    if not winner_rolls:
        return

    winners = UserModel.objects.filter(roll_no__in=winner_rolls)

    for winner in winners:
        already_awarded = PointLedger.objects.filter(
            user=winner, event=event, source=LedgerSource.WINNER
        ).exists()
        if already_awarded:
            continue

        PointLedger.objects.create(
            user=winner,
            event=event,
            entry_type=LedgerEntryType.CREDIT,
            points=event.winner_points,
            reason=f"Winner of {event.title}",
            source=LedgerSource.WINNER,
        )
        update_user_total_points(winner)


@transaction.atomic
def approve_submission(submission, admin_user: User) -> None:
    """
    Process an admin-approved submission: create review record, award points,
    and refresh totals.

    Args:
        submission: The Submission ORM instance being approved.
        admin_user: The admin User performing the approval.
    """
    from reviews.models import AdminReview
    from submissions.models import SubmissionStatus

    # Update submission status.
    submission.status = SubmissionStatus.APPROVED
    submission.save(update_fields=["status"])

    # Record the admin review decision.
    AdminReview.objects.create(
        submission=submission,
        reviewer=admin_user,
        decision="approved",
        remarks="Approved by admin",
    )

    # Award points based on submission type.
    source = submission.submission_type  # 'certificate', 'cgpa', or 'paper'
    award_participation_points(user=submission.user, event=submission.event, source=source)


@transaction.atomic
def reject_submission(submission, admin_user: User, remarks: str = "") -> None:
    """
    Record an admin rejection without awarding any points.

    Args:
        submission: The Submission ORM instance being rejected.
        admin_user: The admin User performing the rejection.
        remarks:    Optional reason for rejection.
    """
    from reviews.models import AdminReview
    from submissions.models import SubmissionStatus

    submission.status = SubmissionStatus.REJECTED
    submission.save(update_fields=["status"])

    AdminReview.objects.create(
        submission=submission,
        reviewer=admin_user,
        decision="rejected",
        remarks=remarks,
    )
