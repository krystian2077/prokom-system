"""Widoki API wycen (powiązane z naprawą)."""
import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Max
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend

from apps.common.permissions import IsStaffOrAdmin
from apps.pricing.models import Quote, QuoteItem, QuoteStatus
from apps.pricing.serializers import (
    QuoteSerializer,
    QuoteListSerializer,
    QuoteItemCreateSerializer,
    QuoteDraftUpdateSerializer,
    QuoteItemUpdateSerializer,
)
from apps.repairs.models import RepairRequest

from apps.pricing.services import create_quote_version_snapshot


def _quote_allows_staff_body_edit(quote: Quote) -> bool:
    """Edycja pozycji / notatek przy wycenie — szkic lub wysłana (ponowne poprawki przed decyzją klienta)."""
    return quote.status in (QuoteStatus.DRAFT, QuoteStatus.SENT)


class QuoteViewSet(viewsets.ModelViewSet):
    """CRUD wycen. Filtrowanie po repair. Tylko staff/admin."""
    permission_classes = [IsStaffOrAdmin]
    serializer_class = QuoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["repair", "status"]

    def get_queryset(self):
        return (
            Quote.objects.select_related("repair", "repair__client", "repair__device", "created_by")
            .annotate(items_count=Count("items"))
            .prefetch_related("items", "items__part", "items__labour_type")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return QuoteListSerializer
        return QuoteSerializer

    def perform_create(self, serializer):
        repair = serializer.validated_data["repair"]
        with transaction.atomic():
            # Blokada naprawy — równoległe „Nowa wycena” nie dostaje tej samej wersji.
            RepairRequest.objects.select_for_update().filter(pk=repair.pk).first()
            max_v = Quote.objects.filter(repair=repair).aggregate(m=Max("version"))["m"] or 0
            serializer.save(created_by=self.request.user, version=max_v + 1)

    def destroy(self, request, *args, **kwargs):
        quote = self.get_object()
        if quote.status not in (
            QuoteStatus.DRAFT,
            QuoteStatus.REJECTED,
            QuoteStatus.EXPIRED,
        ):
            return Response(
                {"detail": "Można usunąć tylko wycenę w statusie: szkic, odrzucona lub wygasła."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        quote = self.get_object()
        if not _quote_allows_staff_body_edit(quote):
            return Response(
                {
                    "detail": "Edycja notatek / ważności możliwa tylko dla wyceny w szkicu lub wysłanej "
                    "(do ponownej wysyłki zaktualizowanej treści)."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = QuoteDraftUpdateSerializer(quote, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        quote.refresh_from_db()
        return Response(QuoteSerializer(quote).data)

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.partial_update(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["patch", "delete"],
        # QuoteItem ma klucz liczbowy (BigAutoField), nie UUID — w URL musi być np. .../items/1/
        url_path=r"items/(?P<item_id>\d+)",
    )
    def quote_item(self, request, pk=None, item_id=None):
        """PATCH/DELETE pojedynczej pozycji (wycena w szkicu lub wysłana — edycja na miejscu)."""
        quote = self.get_object()
        if not _quote_allows_staff_body_edit(quote):
            return Response(
                {"detail": "Zmiana pozycji możliwa tylko przy wycenie w szkicu lub wysłanej."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            item = quote.items.get(pk=int(item_id))
        except QuoteItem.DoesNotExist:
            return Response({"detail": "Nie znaleziono pozycji."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            item.delete()
            quote.refresh_from_db()
            quote.recalculate_total()
            return Response(QuoteSerializer(quote).data, status=status.HTTP_200_OK)

        ser = QuoteItemUpdateSerializer(item, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        quote.refresh_from_db()
        return Response(QuoteSerializer(quote).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        """POST /api/v1/pricing/quotes/<id>/items/ — dodaj pozycję do wyceny."""
        quote = self.get_object()
        if not _quote_allows_staff_body_edit(quote):
            return Response(
                {"detail": "Dodawanie pozycji możliwe tylko przy wycenie w szkicu lub wysłanej."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = QuoteItemCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        QuoteItem.objects.create(quote=quote, **ser.validated_data)
        return Response(QuoteSerializer(quote).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="send")
    def send_quote(self, request, pk=None):
        """
        POST /api/v1/pricing/quotes/<id>/send/
        Body (opcjonalnie): { "send_email": true } — wyślij kopię wyceny na e-mail klienta (jeśli ma adres).

        - Pierwsze wysłanie: status szkic → wysłana, snapshot, status naprawy + powiadomienia.
        - Ponowna wysyłka: wycena już „wysłana” — aktualizacja `sent_at`, nowy snapshot, powiadomienia
          (klient widzi zaktualizowane kwoty w panelu); odpowiedź zawiera `"resend": true`.
        """
        quote = self.get_object()
        is_resend = quote.status == QuoteStatus.SENT
        if quote.status not in (QuoteStatus.DRAFT, QuoteStatus.SENT):
            return Response(
                {
                    "detail": "Można wysłać tylko wycenę w statusie szkic lub wysłana (ponowna wysyłka zaktualizowanej treści).",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not quote.items.exists():
            return Response(
                {"detail": "Dodaj co najmniej jedną pozycję do wyceny przed wysłaniem."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total = quote.total_amount or Decimal("0")
        if total <= 0:
            return Response(
                {"detail": "Suma wyceny musi być większa od zera."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if is_resend:
            quote.sent_at = timezone.now()
            quote.save(update_fields=["sent_at"])
        else:
            quote.status = QuoteStatus.SENT
            quote.sent_at = timezone.now()
            quote.save(update_fields=["status", "sent_at"])

        create_quote_version_snapshot(quote, created_by_id=request.user.id)

        from apps.common.enums import RepairStatus
        from apps.repairs.services import change_repair_status
        repair = quote.repair
        if not is_resend and repair.status != RepairStatus.QUOTE_SENT:
            change_repair_status(
                repair,
                new_status=RepairStatus.QUOTE_SENT,
                changed_by_id=request.user.id,
                notes="Wycena wysłana do klienta.",
                skip_transition_check=True,
            )

        # Najpierw e-mail do klienta (synchroniczny SMTP), potem kolejka Celery — unikamy „wiszenia” UI,
        # gdy broker Redis nie odpowiada (wtedy .delay() może blokować lub wyjątkować).
        send_email_flag = bool(request.data.get("send_email"))
        email_sent = False
        email_detail = None
        if send_email_flag:
            from apps.communications.services.send import send_quote_summary_email_to_client

            ok, detail = send_quote_summary_email_to_client(
                repair, quote, request.user, fail_silently=False, is_resend=is_resend
            )
            email_sent = ok
            email_detail = detail
            if ok:
                quote.last_client_email_sent_at = timezone.now()
                quote.save(update_fields=["last_client_email_sent_at"])

        try:
            from apps.communications.tasks import send_notification_for_repair_event

            send_notification_for_repair_event.delay(
                str(repair.id),
                "quote_sent",
                sent_by_id=request.user.id,
            )
        except Exception as exc:
            logging.getLogger(__name__).warning(
                "Nie udało się zakolejkować powiadomień quote_sent (Celery/Redis): %s",
                exc,
                exc_info=True,
            )

        payload = dict(QuoteSerializer(quote).data)
        payload["email_sent"] = email_sent
        payload["resend"] = is_resend
        if email_detail:
            payload["email_detail"] = email_detail
        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="revise")
    def revise(self, request, pk=None):
        """
        POST /api/v1/pricing/quotes/<id>/revise/
        Tworzy nowy szkic (kolejna wersja) z kopią pozycji z wysłanej/zakończonej wyceny —
        do edycji i ponownego wysłania do klienta.
        """
        source = self.get_object()
        if source.status == QuoteStatus.DRAFT:
            return Response(
                {"detail": "Ta wycena jest już szkicem — edytuj ją bezpośrednio."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if source.status not in (
            QuoteStatus.SENT,
            QuoteStatus.ACCEPTED,
            QuoteStatus.REJECTED,
            QuoteStatus.EXPIRED,
        ):
            return Response(
                {"detail": "Nie można utworzyć wersji roboczej z tej wyceny."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        repair = source.repair
        if Quote.objects.filter(repair=repair, status=QuoteStatus.DRAFT).exists():
            return Response(
                {
                    "detail": "Masz już otwarty szkic w tej naprawie. Edytuj go lub usuń, zanim utworzysz kolejną wersję z tej wyceny.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        max_v = Quote.objects.filter(repair=repair).aggregate(m=Max("version"))["m"] or 0
        with transaction.atomic():
            new_q = Quote.objects.create(
                repair=repair,
                version=max_v + 1,
                status=QuoteStatus.DRAFT,
                created_by=request.user,
                notes=source.notes or "",
                valid_until=source.valid_until,
            )
            for it in source.items.all():
                QuoteItem.objects.create(
                    quote=new_q,
                    item_type=it.item_type,
                    part_id=it.part_id,
                    labour_type_id=it.labour_type_id,
                    description=it.description,
                    part_origin=it.part_origin,
                    quantity=it.quantity,
                    parts_price=it.parts_price,
                    labour_price=it.labour_price,
                )
        new_q.refresh_from_db()
        return Response(QuoteSerializer(new_q).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="versions")
    def list_versions(self, request, pk=None):
        """GET /api/v1/pricing/quotes/<id>/versions/ — historia wersji wyceny (snapshots)."""
        quote = self.get_object()
        versions = quote.versions.select_related("created_by").order_by("-version_number")
        data = [
            {
                "id": v.id,
                "version_number": v.version_number,
                "total_amount": str(v.total_amount),
                "items_snapshot": v.items_snapshot,
                "created_at": v.created_at,
                "created_by_id": str(v.created_by_id) if v.created_by_id else None,
                "created_by_email": v.created_by.email if v.created_by else None,
            }
            for v in versions
        ]
        return Response(data)
