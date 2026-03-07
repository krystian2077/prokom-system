"""
Ładowanie danych startowych: Hammer Glass (folie) + Akcesoria (kategorie i produkty).
Dane z ulotki Hammer Glass 12.2025, MOXIE oraz listy ładowarek, kabli, powerbanków.
Uruchom: python manage.py seed_prokom_products
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils.text import slugify


# ---- Hammer Glass: typy folii (sort_order) ----
HG_FILM_TYPES = [
    {"name": "Clear", "slug": "clear", "sort_order": 10},
    {"name": "Matt", "slug": "matt", "sort_order": 20},
    {"name": "Privacy", "slug": "privacy", "sort_order": 30},
    {"name": "Smartwatch", "slug": "smartwatch", "sort_order": 40},
    {"name": "Tablet", "slug": "tablet", "sort_order": 50},
]

# ---- Hammer Glass: produkty (Folia, Typ, Ochrona, Cechy, Cena od) ----
# protection_level: wysoka -> HIGH, bardzo wysoka -> VERY_HIGH, premium -> PREMIUM
HG_PRODUCTS = [
    {"name": "Active Shield", "type_slug": "clear", "protection": "wysoka", "features": "regeneracja mikrorys", "price": 40},
    {"name": "Active Shield Matt", "type_slug": "matt", "protection": "wysoka", "features": "mniej smug", "price": 50},
    {"name": "Cristal Shield", "type_slug": "clear", "protection": "bardzo_wysoka", "features": "wysoka przejrzystość", "price": 70},
    {"name": "Matt Finish", "type_slug": "matt", "protection": "bardzo_wysoka", "features": "komfort użytkowania", "price": 80},
    {"name": "Privacy Matt Finish", "type_slug": "privacy", "protection": "bardzo_wysoka", "features": "ochrona prywatności", "price": 80},
    {"name": "Prime Protector", "type_slug": "clear", "protection": "premium", "features": "najwyższa ochrona", "price": 90},
    {"name": "Cristal UV", "type_slug": "clear", "protection": "premium", "features": "wzmocniona ochrona", "price": 90},
    {"name": "Cristal UV Matt", "type_slug": "matt", "protection": "premium", "features": "matowa ochrona", "price": 100},
    {"name": "Watch Armour", "type_slug": "smartwatch", "protection": "wysoka", "features": "ochrona zegarka", "price": 50},
    {"name": "Tablet Armour", "type_slug": "tablet", "protection": "wysoka", "features": "ochrona tabletu", "price": 70},
]

# ---- Akcesoria: kategorie ----
ACC_CATEGORIES = [
    {"name": "Ładowarki", "slug": "ladowniki", "sort_order": 10},
    {"name": "Kable", "slug": "kable", "sort_order": 20},
    {"name": "Powerbanki", "slug": "powerbanki", "sort_order": 30},
    {"name": "Inne", "slug": "inne", "sort_order": 40},
    {"name": "Ochrona", "slug": "ochrona", "sort_order": 50},
]

# ---- Akcesoria: produkty (kategoria po slug, cena 0 = do uzupełnienia w adminie) ----
ACC_PRODUCTS = [
    # Ładowarki
    ("ladowniki", "Ładowarka GaN 140W", 0),
    ("ladowniki", "Ładowarka GaN 100W", 0),
    ("ladowniki", "Ładowarka GaN 65W", 0),
    ("ladowniki", "Ładowarka GaN 45W", 0),
    ("ladowniki", "Ładowarka GaN 30W", 0),
    ("ladowniki", "Ładowarka GaN 25W", 0),
    ("ladowniki", "Ładowarka GaN 20W", 0),
    # Kable
    ("kable", "USB-C do USB-C 240W", 0),
    ("kable", "USB-C do USB-C 100W", 0),
    ("kable", "USB-C do USB-C 60W", 0),
    ("kable", "USB-A do USB-C", 0),
    ("kable", "USB-A do Lightning", 0),
    ("kable", "USB-C do Lightning 27W", 0),
    ("kable", "USB-A do MicroUSB", 0),
    # Powerbanki
    ("powerbanki", "Powerbank 10000 mAh", 0),
    ("powerbanki", "Powerbank 20000 mAh", 0),
    ("powerbanki", "Powerbank 30000 mAh", 0),
    ("powerbanki", "Powerbank indukcyjny 5000 mAh", 0),
    ("powerbanki", "Powerbank indukcyjny 10000 mAh", 0),
    # Inne
    ("inne", "Uchwyt samochodowy", 0),
    ("inne", "Uchwyt samochodowy z ładowaniem indukcyjnym", 0),
    ("inne", "Stacja ładowania bezprzewodowego", 0),
    # Ochrona
    ("ochrona", "Szkła hartowane", 0),
    ("ochrona", "Folie Hammer Glass", 0),
    ("ochrona", "Etui ochronne", 0),
]


class Command(BaseCommand):
    help = "Ładuje Hammer Glass (typy folii + produkty) oraz Akcesoria (kategorie + produkty). Idempotentne."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Aktualizuj istniejące produkty HG (cena, cechy, poziom ochrony).",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        self.stdout.write("Seedowanie Hammer Glass i Akcesoriów...")

        # ---- Hammer Glass: typy folii ----
        from apps.hammer_glass.models import HammerGlassFilmType, HammerGlassProduct

        type_by_slug = {}
        for ft in HG_FILM_TYPES:
            obj, created = HammerGlassFilmType.objects.get_or_create(
                slug=ft["slug"],
                defaults={"name": ft["name"], "sort_order": ft["sort_order"]},
            )
            type_by_slug[ft["slug"]] = obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Utworzono typ folii: {obj.name}"))

        # ---- Hammer Glass: produkty ----
        for i, p in enumerate(HG_PRODUCTS):
            film_type = type_by_slug.get(p["type_slug"])
            if not film_type:
                self.stdout.write(self.style.WARNING(f"  Pominięto {p['name']}: brak typu {p['type_slug']}"))
                continue
            compatible = []
            if p["type_slug"] == "smartwatch":
                compatible = ["smartwatch"]
            elif p["type_slug"] == "tablet":
                compatible = ["tablet"]
            else:
                compatible = ["phone", "tablet"]  # Clear/Matt/Privacy dla telefonów i tabletów

            defaults = {
                "price": Decimal(str(p["price"])),
                "protection_level": p["protection"],
                "features": p["features"],
                "sort_order": i + 1,
                "compatible_device_categories": compatible,
            }
            obj, created = HammerGlassProduct.objects.get_or_create(
                name=p["name"],
                film_type=film_type,
                defaults=defaults,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Utworzono folia: {obj.name} ({p['price']} zł)"))
            elif force:
                HammerGlassProduct.objects.filter(pk=obj.pk).update(**defaults)
                self.stdout.write(f"  Zaktualizowano: {obj.name}")

        # ---- Akcesoria: kategorie ----
        from apps.accessories.models import AccessoryCategory, AccessoryProduct

        cat_by_slug = {}
        for c in ACC_CATEGORIES:
            obj, created = AccessoryCategory.objects.get_or_create(
                slug=c["slug"],
                defaults={"name": c["name"], "sort_order": c["sort_order"]},
            )
            cat_by_slug[c["slug"]] = obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Utworzono kategorię: {obj.name}"))

        # ---- Akcesoria: produkty ----
        for cat_slug, name, price in ACC_PRODUCTS:
            category = cat_by_slug.get(cat_slug)
            if not category:
                continue
            obj, created = AccessoryProduct.objects.get_or_create(
                name=name,
                category=category,
                defaults={"price": Decimal(str(price)), "sort_order": 0},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Utworzono akcesorium: {name}"))

        self.stdout.write(self.style.SUCCESS("Zakończono seed_prokom_products."))
