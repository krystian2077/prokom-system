"""
PRO-KOM Serwis — Common App — Enums
====================================
Wspólne enumy używane w wielu miejscach systemu.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class DeviceCategory(models.TextChoices):
    """Główne kategorie urządzeń."""
    PHONE = "phone", _("Telefon")
    TABLET = "tablet", _("Tablet")
    SMARTWATCH = "smartwatch", _("Smartwatch")
    LAPTOP = "laptop", _("Laptop")
    DESKTOP = "desktop", _("Komputer stacjonarny")
    PRINTER = "printer", _("Drukarka")
    CONSOLE = "console", _("Konsola")
    DATA_RECOVERY = "data_recovery", _("Odzyskiwanie danych")
    OTHER = "other", _("Inne")


class RepairStatus(models.TextChoices):
    """
    Statusy naprawy — publiczne i wewnętrzne.
    Klient widzi uproszczoną wersję.
    """
    # Przyjęcie
    NEW = "new", _("Nowe zgłoszenie")
    ACCEPTED = "accepted", _("Przyjęte do serwisu")

    # Diagnoza
    IN_DIAGNOSTICS = "in_diagnostics", _("W diagnostyce")
    DIAGNOSTICS_DONE = "diagnostics_done", _("Diagnoza zakończona")

    # Wycena
    QUOTE_PENDING = "quote_pending", _("Przygotowanie wyceny")
    QUOTE_SENT = "quote_sent", _("Wycena wysłana")
    QUOTE_ACCEPTED = "quote_accepted", _("Wycena zaakceptowana")
    QUOTE_REJECTED = "quote_rejected", _("Wycena odrzucona")

    # Naprawa
    WAITING_FOR_PARTS = "waiting_for_parts", _("Oczekiwanie na części")
    IN_REPAIR = "in_repair", _("W trakcie naprawy")
    REPAIR_DONE = "repair_done", _("Naprawa zakończona")

    # Testowanie
    IN_TESTING = "in_testing", _("Testowanie")
    TESTING_PASSED = "testing_passed", _("Testy przeszły")
    TESTING_FAILED = "testing_failed", _("Testy nie przeszły")

    # Zakończenie
    READY_FOR_PICKUP = "ready_for_pickup", _("Gotowe do odbioru")
    PICKED_UP = "picked_up", _("Odebrane")
    SHIPPED = "shipped", _("Wysłane")
    DELIVERED = "delivered", _("Dostarczone")

    # Anulowanie / problemy
    CANCELLED = "cancelled", _("Anulowane")
    UNREPAIRABLE = "unrepairable", _("Nie do naprawy")
    ABANDONED = "abandoned", _("Porzucone przez klienta")


class RepairPriority(models.TextChoices):
    """Priorytet naprawy."""
    LOW = "low", _("Niski")
    NORMAL = "normal", _("Normalny")
    HIGH = "high", _("Wysoki")
    URGENT = "urgent", _("Pilny")
    SAME_DAY = "same_day", _("Same Day")


class DeliveryMethod(models.TextChoices):
    """Sposób dostarczenia urządzenia."""
    IN_PERSON = "in_person", _("Osobiście w serwisie")
    COURIER = "courier", _("Kurier")
    PARCEL_LOCKER = "parcel_locker", _("Paczkomat")


class ReturnMethod(models.TextChoices):
    """Sposób zwrotu urządzenia."""
    IN_PERSON = "in_person", _("Odbiór osobisty")
    COURIER = "courier", _("Kurier")
    PARCEL_LOCKER = "parcel_locker", _("Paczkomat")


class ContactPreference(models.TextChoices):
    """Preferowany sposób kontaktu."""
    PHONE = "phone", _("Telefon")
    EMAIL = "email", _("E-mail")
    SMS = "sms", _("SMS")
    PANEL = "panel", _("Panel klienta")


class ClientType(models.TextChoices):
    """Typ klienta: osoba prywatna lub firma."""
    INDIVIDUAL = "individual", _("Osoba prywatna")
    BUSINESS = "business", _("Firma")


class ClientSegment(models.TextChoices):
    """Segment klienta (do analityki i badge'ów)."""
    NEW = "new", _("Nowy klient")
    RETURNING = "returning", _("Klient powracający")
    REGULAR = "regular", _("Klient stały")
    PREMIUM = "premium", _("Klient premium")
    BUSINESS = "business", _("Klient biznesowy")


class ConsentType(models.TextChoices):
    """Typy zgód."""
    CONTACT = "contact", _("Zgoda na kontakt")
    TERMS = "terms", _("Akceptacja regulaminu")
    DIAGNOSTICS = "diagnostics", _("Zgoda na diagnozę")
    REPAIR = "repair", _("Zgoda na naprawę")
    SHIPPING = "shipping", _("Zgoda na warunki wysyłki")
    MARKETING = "marketing", _("Zgoda marketingowa")
    DATA_PROCESSING = "data_processing", _("Zgoda na przetwarzanie danych")


class MessageType(models.TextChoices):
    """Typy wiadomości."""
    INFO = "info", _("Informacyjna")
    QUOTE = "quote", _("Wycena")
    STATUS_UPDATE = "status_update", _("Aktualizacja statusu")
    QUESTION = "question", _("Pytanie")
    ANSWER = "answer", _("Odpowiedź")
    REMINDER = "reminder", _("Przypomnienie")
    INTERNAL_NOTE = "internal_note", _("Notatka wewnętrzna")


class CommunicationChannel(models.TextChoices):
    """Kanały komunikacji."""
    EMAIL = "email", _("E-mail")
    SMS = "sms", _("SMS")
    PANEL = "panel", _("Panel klienta")
    PHONE = "phone", _("Telefon")
    INTERNAL = "internal", _("Wewnętrzna")


class DocumentType(models.TextChoices):
    """Typy dokumentów."""
    ACCEPTANCE_PROTOCOL = "acceptance_protocol", _("Protokół przyjęcia")
    QUOTE = "quote", _("Wycena")
    INVOICE = "invoice", _("Faktura")
    WARRANTY = "warranty", _("Gwarancja")
    COMPLETION_PROTOCOL = "completion_protocol", _("Protokół zakończenia")
    LABEL = "label", _("Etykieta")
    QR_CODE = "qr_code", _("Kod QR")


class RepairType(models.TextChoices):
    """Typ sprawy (standardowa, gwarancyjna, reklamacja, z umówionym terminem)."""
    STANDARD = "standard", _("Standardowa")
    WARRANTY = "warranty", _("Gwarancyjna")
    COMPLAINT = "complaint", _("Reklamacja")
    SCHEDULED = "scheduled", _("Z umówionym terminem")


class ComplaintWarrantyStatus(models.TextChoices):
    """Status reklamacji / gwarancji (osobny od statusu naprawy)."""
    ACCEPTED = "accepted", _("Przyjęta")
    VERIFICATION = "verification", _("Weryfikacja")
    AWAITING_DECISION = "awaiting_decision", _("Oczekuje na decyzję")
    RECOGNIZED = "recognized", _("Uznana")
    REJECTED = "rejected", _("Odrzucona")
    IN_PROGRESS = "in_progress", _("W trakcie realizacji")
    CLOSED = "closed", _("Zakończona")


class RepairSource(models.TextChoices):
    """Źródło zgłoszenia naprawy."""
    ONLINE = "online", _("Formularz online")
    IN_PERSON = "in_person", _("Przyjęcie stacjonarne")
    PHONE = "phone", _("Telefoniczne")
    EMAIL = "email", _("E-mail")
    FACEBOOK = "facebook", _("Facebook")
    WHATSAPP = "whatsapp", _("WhatsApp")
    OTHER = "other", _("Inne")


class InternalRepairStatus(models.TextChoices):
    """
    Wewnętrzny status techniczny (tylko dla staff).
    Uzupełnia publiczny status naprawy.
    """
    NONE = "none", _("—")
    IN_QUEUE = "in_queue", _("W kolejce")
    IN_DIAGNOSTICS = "in_diagnostics", _("W diagnostyce")
    WAITING_PARTS = "waiting_parts", _("Czeka na części")
    IN_REPAIR = "in_repair", _("W naprawie")
    WAITING_DECISION = "waiting_decision", _("Czeka na decyzję klienta")
    IN_TESTING = "in_testing", _("W testach")
    READY = "ready", _("Gotowe")
    DONE = "done", _("Zakończone")
    BLOCKED = "blocked", _("Zablokowane")


class PaymentStatus(models.TextChoices):
    """Status płatności."""
    PENDING = "pending", _("Oczekująca")
    PAID = "paid", _("Opłacona")
    PARTIALLY_PAID = "partially_paid", _("Częściowo opłacona")
    REFUNDED = "refunded", _("Zwrócona")
    CANCELLED = "cancelled", _("Anulowana")

