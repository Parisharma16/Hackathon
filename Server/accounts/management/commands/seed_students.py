"""
Management command: seed_students

Creates a realistic set of Year 1 through Year 4 student accounts for testing
and assigns randomised point ledger entries to each student so the leaderboard
renders with meaningful, varied data.

Point generation is year-weighted so older-year students tend to accumulate
more points — reflecting longer campus engagement:
  Year 1 :  2–4 attendance events,  rarely a winner or certificate
  Year 2 :  3–6 attendance events,  occasional winner / certificate
  Year 3 :  4–8 attendance events,  likely certificate, possible winner
  Year 4 :  5–10 attendance events, common winner / certificate / paper

Safe to run multiple times — existing accounts are updated in place.
Point ledger entries for seed accounts are wiped and regenerated on every run
so scores stay fresh.  Use --skip-points to preserve existing points.

Usage
-----
  python manage.py seed_students                     # create/update + randomise points
  python manage.py seed_students --skip-points       # create/update only, keep existing points
  python manage.py seed_students --clear             # delete seeded accounts then re-seed
  python manage.py seed_students --password X        # custom password (default: Test@1234)
"""

import random

from django.db import transaction

from django.core.management.base import BaseCommand

from accounts.models import User, UserRole
from points.models import LedgerEntryType, LedgerSource, PointLedger

# ── Default password ───────────────────────────────────────────────────────────
DEFAULT_PASSWORD = "Test@1234"

# ── Seed data ─────────────────────────────────────────────────────────────────
# Format: (roll_no, name, email, year, branch)

YEAR_1_STUDENTS = [
    ("CS25B001", "Ananya Singh",     "ananya.singh@campus.edu",     1, "CSE"),
    ("CS25B002", "Dev Patel",        "dev.patel@campus.edu",        1, "CSE"),
    ("CS25B003", "Riya Kapoor",      "riya.kapoor@campus.edu",      1, "CSE"),
    ("EC25B001", "Akash Verma",      "akash.verma@campus.edu",      1, "ECE"),
    ("EC25B002", "Simran Kaur",      "simran.kaur@campus.edu",      1, "ECE"),
    ("ME25B001", "Harshit Jain",     "harshit.jain@campus.edu",     1, "ME"),
    ("ME25B002", "Kritika Roy",      "kritika.roy@campus.edu",      1, "ME"),
    ("CE25B001", "Manav Shah",       "manav.shah@campus.edu",       1, "CE"),
    ("CE25B002", "Nisha Tiwari",     "nisha.tiwari@campus.edu",     1, "CE"),
    ("CS25B004", "Omkar Bhosale",    "omkar.bhosale@campus.edu",    1, "CSE"),
]

YEAR_2_STUDENTS = [
    ("CS24B001", "Aarav Sharma",     "aarav.sharma@campus.edu",     2, "CSE"),
    ("CS24B002", "Priya Nair",       "priya.nair@campus.edu",       2, "CSE"),
    ("CS24B003", "Rohan Mehta",      "rohan.mehta@campus.edu",      2, "CSE"),
    ("EC24B001", "Sneha Pillai",     "sneha.pillai@campus.edu",     2, "ECE"),
    ("EC24B002", "Vikram Reddy",     "vikram.reddy@campus.edu",     2, "ECE"),
    ("ME24B001", "Anjali Verma",     "anjali.verma@campus.edu",     2, "ME"),
    ("ME24B002", "Karan Gupta",      "karan.gupta@campus.edu",      2, "ME"),
    ("CE24B001", "Divya Iyer",       "divya.iyer@campus.edu",       2, "CE"),
    ("CE24B002", "Arjun Bose",       "arjun.bose@campus.edu",       2, "CE"),
    ("CS24B004", "Meera Krishnan",   "meera.krishnan@campus.edu",   2, "CSE"),
]

YEAR_3_STUDENTS = [
    ("CS23B001", "Ravi Shankar",     "ravi.shankar@campus.edu",     3, "CSE"),
    ("CS23B002", "Tanvi Joshi",      "tanvi.joshi@campus.edu",      3, "CSE"),
    ("CS23B003", "Nikhil Patel",     "nikhil.patel@campus.edu",     3, "CSE"),
    ("EC23B001", "Kavya Menon",      "kavya.menon@campus.edu",      3, "ECE"),
    ("EC23B002", "Siddharth Das",    "siddharth.das@campus.edu",    3, "ECE"),
    ("ME23B001", "Pooja Rao",        "pooja.rao@campus.edu",        3, "ME"),
    ("ME23B002", "Aditya Kumar",     "aditya.kumar@campus.edu",     3, "ME"),
    ("CE23B001", "Ishaan Chandra",   "ishaan.chandra@campus.edu",   3, "CE"),
    ("CE23B002", "Nandini Agarwal",  "nandini.agarwal@campus.edu",  3, "CE"),
    ("CS23B004", "Rahul Desai",      "rahul.desai@campus.edu",      3, "CSE"),
]

YEAR_4_STUDENTS = [
    ("CS22B001", "Raghav Kapoor",    "raghav.kapoor@campus.edu",    4, "CSE"),
    ("CS22B002", "Nisha Bose",       "nisha.bose@campus.edu",       4, "CSE"),
    ("CS22B003", "Arjun Menon",      "arjun.menon@campus.edu",      4, "CSE"),
    ("EC22B001", "Lakshmi Rao",      "lakshmi.rao@campus.edu",      4, "ECE"),
    ("EC22B002", "Vivek Tiwari",     "vivek.tiwari@campus.edu",     4, "ECE"),
    ("ME22B001", "Shreya Saxena",    "shreya.saxena@campus.edu",    4, "ME"),
    ("ME22B002", "Varun Malhotra",   "varun.malhotra@campus.edu",   4, "ME"),
    ("CE22B001", "Preeti Das",       "preeti.das@campus.edu",       4, "CE"),
    ("CE22B002", "Saurabh Joshi",    "saurabh.joshi@campus.edu",    4, "CE"),
    ("CS22B004", "Deepika Nair",     "deepika.nair@campus.edu",     4, "CSE"),
]

ORGANIZERS = [
    ("ORG001", "Event Organizer",   "organizer@campus.edu",        None, ""),
]

ALL_SEED_ROLL_NOS = (
    [r for r, *_ in YEAR_1_STUDENTS]
    + [r for r, *_ in YEAR_2_STUDENTS]
    + [r for r, *_ in YEAR_3_STUDENTS]
    + [r for r, *_ in YEAR_4_STUDENTS]
    + [r for r, *_ in ORGANIZERS]
)

# ── Point generation config per year ──────────────────────────────────────────
# Each tuple describes the range of events and probability thresholds for
# bonus credits.  Higher year = more activity = more possible points.

YEAR_CONFIG = {
    1: {
        "attendance_range": (2, 4),    # min/max attendance events
        "attendance_pts":   (25, 50),  # pts per attendance event
        "winner_chance":    0.10,      # probability of a winner credit
        "winner_pts":       (100, 150),
        "cert_chance":      0.15,      # probability of a certificate credit
        "cert_pts":         (30, 60),
        "paper_chance":     0.05,
        "paper_pts":        (50, 80),
    },
    2: {
        "attendance_range": (3, 6),
        "attendance_pts":   (25, 75),
        "winner_chance":    0.20,
        "winner_pts":       (100, 200),
        "cert_chance":      0.25,
        "cert_pts":         (40, 80),
        "paper_chance":     0.10,
        "paper_pts":        (60, 100),
    },
    3: {
        "attendance_range": (4, 8),
        "attendance_pts":   (50, 100),
        "winner_chance":    0.35,
        "winner_pts":       (150, 250),
        "cert_chance":      0.40,
        "cert_pts":         (50, 100),
        "paper_chance":     0.20,
        "paper_pts":        (80, 150),
    },
    4: {
        "attendance_range": (5, 10),
        "attendance_pts":   (50, 100),
        "winner_chance":    0.50,
        "winner_pts":       (150, 300),
        "cert_chance":      0.55,
        "cert_pts":         (60, 120),
        "paper_chance":     0.35,
        "paper_pts":        (100, 200),
    },
}


class Command(BaseCommand):
    help = "Seed Year 1-4 student accounts with randomised point ledger entries."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded accounts (and their points) then re-seed.",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Password for all seed accounts (default: {DEFAULT_PASSWORD}).",
        )
        parser.add_argument(
            "--skip-points",
            action="store_true",
            help="Create / update accounts only; do not touch the point ledger.",
        )

    def handle(self, *args, **options):
        password: str   = options["password"]
        skip_points: bool = options["skip_points"]

        if options["clear"]:
            deleted, _ = User.objects.filter(roll_no__in=ALL_SEED_ROLL_NOS).delete()
            # Cascade deletion removes associated PointLedger rows automatically.
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing seed account(s)."))

        created_total = 0
        updated_total = 0

        all_student_groups = [
            ("Year 1 students", YEAR_1_STUDENTS),
            ("Year 2 students", YEAR_2_STUDENTS),
            ("Year 3 students", YEAR_3_STUDENTS),
            ("Year 4 students", YEAR_4_STUDENTS),
        ]

        for heading, group in all_student_groups:
            self.stdout.write(self.style.MIGRATE_HEADING(f"\n{heading}"))
            for roll_no, name, email, year, branch in group:
                user, created = self._upsert(roll_no, name, email, password, UserRole.STUDENT, year, branch)
                created_total += int(created)
                updated_total += int(not created)
                if not skip_points:
                    total_pts = self._seed_points(user, year)
                    self.stdout.write(
                        f"  {'Created' if created else 'Updated'} : {roll_no:<12} {name:<22} {total_pts:>4} pts"
                    )
                else:
                    self.stdout.write(
                        f"  {'Created' if created else 'Updated'} : {roll_no:<12} {name}"
                    )

        # ── Organizer (no points) ──────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING("\nOrganizer"))
        for roll_no, name, email, year, branch in ORGANIZERS:
            _, created = self._upsert(roll_no, name, email, password, UserRole.ORGANIZER, year, branch)
            self.stdout.write(f"  {'Created' if created else 'Updated'} : {roll_no}  {name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_total} account(s) created, {updated_total} account(s) updated."
                + ("" if skip_points else "  Points randomised for all students.")
                + f"\nPassword for all accounts: {password}"
            )
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    def _upsert(
        self,
        roll_no: str,
        name: str,
        email: str,
        password: str,
        role: str,
        year: int | None,
        branch: str,
    ) -> tuple["User", bool]:
        """
        Create or update a single user.

        Returns (user_instance, was_created).
        """
        try:
            user = User.objects.get(roll_no=roll_no)
            user.name   = name
            user.email  = email
            user.role   = role
            user.year   = year
            user.branch = branch
            user.set_password(password)
            user.save(update_fields=["name", "email", "role", "year", "branch", "password"])
            return user, False
        except User.DoesNotExist:
            user = User.objects.create_user(
                roll_no=roll_no,
                name=name,
                email=email,
                password=password,
                role=role,
                year=year,
                branch=branch,
            )
            return user, True

    def _seed_points(self, user: "User", year: int | None) -> int:
        """
        Wipe all existing seed-generated ledger entries for the user and replace
        them with a freshly randomised set.

        Only entries that have event=None (i.e. not tied to a real event) and
        source in the four seed sources are removed, so real production points
        are left untouched.

        Returns the new total_points written to the user row.
        """
        if year is None:
            # Organizers / users without a year receive no points.
            return 0

        cfg = YEAR_CONFIG.get(year, YEAR_CONFIG[1])

        # ── Remove previous seed entries ──────────────────────────────────────
        # Only wipe entries that the seed command itself could have created
        # (event=None + a seed-eligible source).  Real attendance / winner
        # entries that reference an actual event are left alone.
        seed_sources = [
            LedgerSource.ATTENDANCE,
            LedgerSource.WINNER,
            LedgerSource.CERTIFICATE,
            LedgerSource.PAPER,
        ]
        PointLedger.objects.filter(user=user, event=None, source__in=seed_sources).delete()

        entries: list[PointLedger] = []

        # ── Attendance credits ────────────────────────────────────────────────
        n_attendance = random.randint(*cfg["attendance_range"])
        for i in range(1, n_attendance + 1):
            pts = random.randint(*cfg["attendance_pts"])
            entries.append(PointLedger(
                user=user,
                event=None,
                entry_type=LedgerEntryType.CREDIT,
                points=pts,
                reason=f"Participation in campus event #{i} via attendance",
                source=LedgerSource.ATTENDANCE,
            ))

        # ── Winner credit (probabilistic) ─────────────────────────────────────
        if random.random() < cfg["winner_chance"]:
            pts = random.randint(*cfg["winner_pts"])
            entries.append(PointLedger(
                user=user,
                event=None,
                entry_type=LedgerEntryType.CREDIT,
                points=pts,
                reason="Winner award in campus competition",
                source=LedgerSource.WINNER,
            ))

        # ── Certificate credit (probabilistic) ───────────────────────────────
        if random.random() < cfg["cert_chance"]:
            pts = random.randint(*cfg["cert_pts"])
            entries.append(PointLedger(
                user=user,
                event=None,
                entry_type=LedgerEntryType.CREDIT,
                points=pts,
                reason="Certificate submission approved",
                source=LedgerSource.CERTIFICATE,
            ))

        # ── Research paper credit (probabilistic) ─────────────────────────────
        if random.random() < cfg["paper_chance"]:
            pts = random.randint(*cfg["paper_pts"])
            entries.append(PointLedger(
                user=user,
                event=None,
                entry_type=LedgerEntryType.CREDIT,
                points=pts,
                reason="Research paper submission approved",
                source=LedgerSource.PAPER,
            ))

        # ── Persist entries + sync total_points atomically ────────────────────
        with transaction.atomic():
            PointLedger.objects.bulk_create(entries)
            # Recompute total from the full ledger so real production entries
            # (if any) are also counted in the final total.
            from django.db.models import Sum
            agg = (
                PointLedger.objects
                .filter(user=user, entry_type=LedgerEntryType.CREDIT)
                .aggregate(total=Sum("points"))
            )
            debits = (
                PointLedger.objects
                .filter(user=user, entry_type=LedgerEntryType.DEBIT)
                .aggregate(total=Sum("points"))
            )
            credit_sum = agg["total"]  or 0
            debit_sum  = debits["total"] or 0
            total_pts  = credit_sum - debit_sum
            user.total_points = total_pts
            user.save(update_fields=["total_points"])

        return total_pts
