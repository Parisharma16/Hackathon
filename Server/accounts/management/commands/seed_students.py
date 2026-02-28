"""
Management command: seed_students

Creates a realistic set of Year-2 and Year-3 student accounts for testing.
One organizer account is also created so event creation can be tested
without promoting a real student.

Safe to run multiple times — existing accounts (matched by roll_no) are
updated in place; no duplicates are created.

Usage
-----
  python manage.py seed_students              # create/update all seed students
  python manage.py seed_students --clear      # delete only seeded accounts, then re-seed
  python manage.py seed_students --password X # use a custom password for all accounts
                                               # (default: Test@1234)
"""

from django.core.management.base import BaseCommand

from accounts.models import User, UserRole

# ── Default password ───────────────────────────────────────────────────────────
# All seed accounts share this password so testers do not have to remember
# per-account values.  It satisfies Django's default password validators.
DEFAULT_PASSWORD = "Test@1234"

# ── Seed data ─────────────────────────────────────────────────────────────────
# Format: (roll_no, name, email, year, branch)
# All accounts get role="student" unless specified otherwise.

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

# One organizer so event/attendance tests do not require promoting a student.
ORGANIZERS = [
    ("ORG001", "Event Organizer",   "organizer@campus.edu",        None, ""),
]

# Roll numbers that this command created — used by --clear to avoid deleting
# real accounts.
ALL_SEED_ROLL_NOS = (
    [r for r, *_ in YEAR_2_STUDENTS]
    + [r for r, *_ in YEAR_3_STUDENTS]
    + [r for r, *_ in ORGANIZERS]
)


class Command(BaseCommand):
    help = "Seed Year-2 and Year-3 student accounts (plus one organizer) for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded accounts before re-creating them.",
        )
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Password for all seed accounts (default: {DEFAULT_PASSWORD}).",
        )

    def handle(self, *args, **options):
        password: str = options["password"]

        if options["clear"]:
            deleted, _ = User.objects.filter(roll_no__in=ALL_SEED_ROLL_NOS).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing seed account(s)."))

        created_total = 0
        updated_total = 0

        # ── Year 2 ────────────────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING("\nYear 2 students"))
        for roll_no, name, email, year, branch in YEAR_2_STUDENTS:
            created, updated = self._upsert(roll_no, name, email, password, UserRole.STUDENT, year, branch)
            created_total += created
            updated_total += updated

        # ── Year 3 ────────────────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING("\nYear 3 students"))
        for roll_no, name, email, year, branch in YEAR_3_STUDENTS:
            created, updated = self._upsert(roll_no, name, email, password, UserRole.STUDENT, year, branch)
            created_total += created
            updated_total += updated

        # ── Organizer ─────────────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING("\nOrganizer"))
        for roll_no, name, email, year, branch in ORGANIZERS:
            created, updated = self._upsert(roll_no, name, email, password, UserRole.ORGANIZER, year, branch)
            created_total += created
            updated_total += updated

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_total} account(s) created, {updated_total} account(s) updated."
                f"\nPassword for all accounts: {password}"
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
    ) -> tuple[int, int]:
        """
        Create or update a single user account.

        Returns (created_count, updated_count) — each is 0 or 1.
        """
        try:
            user = User.objects.get(roll_no=roll_no)
            # Update all fields except the password so an existing account
            # retains its points while still getting any name/email corrections.
            user.name   = name
            user.email  = email
            user.role   = role
            user.year   = year
            user.branch = branch
            user.set_password(password)
            user.save(update_fields=["name", "email", "role", "year", "branch", "password"])
            self.stdout.write(f"  Updated : {roll_no}  {name}")
            return 0, 1
        except User.DoesNotExist:
            User.objects.create_user(
                roll_no=roll_no,
                name=name,
                email=email,
                password=password,
                role=role,
                year=year,
                branch=branch,
            )
            self.stdout.write(f"  Created : {roll_no}  {name}")
            return 1, 0
