"""
Management command: seed_shop

Populates the shop_items table with a representative set of rewards for
testing and development.  Safe to run multiple times — existing items are
matched by name and updated in place rather than duplicated.

Usage
-----
  python manage.py seed_shop            # create/update all items
  python manage.py seed_shop --clear    # delete all items first, then seed
"""

from django.core.management.base import BaseCommand

from shop.models import ShopItem

# ── Seed data ─────────────────────────────────────────────────────────────────
# Each dict maps directly to ShopItem fields.
# update_or_create uses `name` as the lookup key so re-running the command
# updates stock/cost without creating duplicates.

SEED_ITEMS: list[dict] = [
    # ── Merchandise ───────────────────────────────────────────────────────────
    {
        "name": "CampusEngage T-Shirt",
        "description": "Official branded t-shirt. Available in S / M / L / XL on collection.",
        "points_cost": 200,
        "category": "Merchandise",
        "stock": 50,
    },
    {
        "name": "Branded Water Bottle",
        "description": "Stainless-steel insulated bottle with the campus logo embossed.",
        "points_cost": 150,
        "category": "Merchandise",
        "stock": 30,
    },
    {
        "name": "Campus Notebook",
        "description": "A5 ruled notebook with CampusEngage branding — 200 pages.",
        "points_cost": 75,
        "category": "Merchandise",
        "stock": 100,
    },
    {
        "name": "Lanyard + ID Holder",
        "description": "Retractable lanyard with a transparent hard-cover ID card holder.",
        "points_cost": 50,
        "category": "Merchandise",
        "stock": 75,
    },
    {
        "name": "Laptop Sticker Pack",
        "description": "Set of 10 die-cut vinyl stickers featuring campus club logos.",
        "points_cost": 40,
        "category": "Merchandise",
        "stock": 200,
    },
    # ── Discounts ─────────────────────────────────────────────────────────────
    {
        "name": "Canteen Voucher ₹100",
        "description": "₹100 credit on your next canteen visit. Valid for 30 days.",
        "points_cost": 100,
        "category": "Discounts",
        "stock": 500,
    },
    {
        "name": "Canteen Voucher ₹50",
        "description": "₹50 credit on your next canteen visit. Valid for 30 days.",
        "points_cost": 50,
        "category": "Discounts",
        "stock": 1000,
    },
    {
        "name": "Bookstore 20% Off",
        "description": "One-time 20% discount on any single purchase at the campus bookstore.",
        "points_cost": 80,
        "category": "Discounts",
        "stock": 50,
    },
    {
        "name": "Print Lab 50 Free Pages",
        "description": "Redeem for 50 free A4 black-and-white prints at the library print lab.",
        "points_cost": 60,
        "category": "Discounts",
        "stock": 100,
    },
    # ── Experiences ───────────────────────────────────────────────────────────
    {
        "name": "Priority Event Registration",
        "description": "Skip the waitlist — register for any campus event 24 hours before general opening.",
        "points_cost": 300,
        "category": "Experiences",
        "stock": 20,
    },
    {
        "name": "Alumni Mentorship Session",
        "description": "One-hour one-on-one mentorship session with a verified alumni mentor of your choice.",
        "points_cost": 400,
        "category": "Experiences",
        "stock": 10,
    },
    {
        "name": "Lunch with a Faculty Member",
        "description": "Enjoy lunch with a faculty member of your choice — a unique networking opportunity.",
        "points_cost": 500,
        "category": "Experiences",
        "stock": 5,
    },
    {
        "name": "Lab After-Hours Access (1 night)",
        "description": "One approved after-hours access pass for the computer lab (subject to warden approval).",
        "points_cost": 250,
        "category": "Experiences",
        "stock": 15,
    },
    # ── Low-cost / starter items ───────────────────────────────────────────────
    {
        "name": "Digital Certificate of Recognition",
        "description": "An official digitally-signed certificate acknowledging your campus contributions.",
        "points_cost": 30,
        "category": "Digital",
        "stock": 9999,
    },
    {
        "name": "Profile Badge: Active Contributor",
        "description": "Unlock the 'Active Contributor' badge displayed on your campus profile.",
        "points_cost": 20,
        "category": "Digital",
        "stock": 9999,
    },
]


class Command(BaseCommand):
    help = "Seed the shop_items table with sample items for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing shop items before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted_count, _ = ShopItem.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted_count} existing shop item(s)."))

        created_count = 0
        updated_count = 0

        for item_data in SEED_ITEMS:
            # Separate the lookup key from the fields to set.
            name = item_data["name"]
            defaults = {k: v for k, v in item_data.items() if k != "name"}

            _, created = ShopItem.objects.update_or_create(name=name, defaults=defaults)

            if created:
                created_count += 1
                self.stdout.write(f"  Created : {name}")
            else:
                updated_count += 1
                self.stdout.write(f"  Updated : {name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} item(s) created, {updated_count} item(s) updated."
            )
        )
