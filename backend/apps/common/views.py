"""
PRO-KOM Serwis — Globalne wyszukiwanie i konfiguracja publiczna.
"""
from django.db.models import Q
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import AllowAny

from apps.common.permissions import IsStaffOrAdmin
from apps.repairs.models import RepairRequest
from apps.repairs.serializers import RepairRequestListSerializer
from apps.clients.models import Client
from apps.clients.serializers import ClientListSerializer
from apps.devices.models import Device
from apps.devices.serializers import DeviceListSerializer


class GlobalSearchView(APIView):
    """
    GET /api/v1/search/?q=<fraza>

    Globalne wyszukiwanie: numer naprawy, klient (imię, nazwisko, e-mail, telefon),
    urządzenie (model, numer seryjny, IMEI). Tylko staff/admin.
    Zwraca sekcje: repairs, clients, devices (max po 20 wyników).
    """
    permission_classes = [IsStaffOrAdmin]

    def get(self, request: Request):
        q = (request.query_params.get("q") or "").strip()
        if not q or len(q) < 2:
            return Response({
                "repairs": [],
                "clients": [],
                "devices": [],
                "message": "Podaj parametr q (min. 2 znaki).",
            })

        # Naprawy: numer, klient (imię, nazwisko, email), urządzenie (serial, IMEI), opis
        repairs = (
            RepairRequest.objects.filter(
                Q(repair_number__icontains=q)
                | Q(client__first_name__icontains=q)
                | Q(client__last_name__icontains=q)
                | Q(client__email__icontains=q)
                | Q(client__phone__icontains=q)
                | Q(device__model_name__icontains=q)
                | Q(device__serial_number__icontains=q)
                | Q(device__imei__icontains=q)
                | Q(problem_description__icontains=q)
            )
            .select_related("client", "device", "assigned_to")
            .order_by("-created_at")[:20]
        )

        # Klienci: imię, nazwisko, email, telefon, numer klienta
        clients = (
            Client.objects.filter(
                Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
                | Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(client_number__icontains=q)
            )
            .order_by("-created_at")[:20]
        )

        # Urządzenia: nazwa modelu, serial, IMEI, klient
        devices = (
            Device.objects.filter(
                Q(model_name__icontains=q)
                | Q(serial_number__icontains=q)
                | Q(imei__icontains=q)
                | Q(client__first_name__icontains=q)
                | Q(client__last_name__icontains=q)
            )
            .select_related("client", "brand", "device_model")
            .order_by("-created_at")[:20]
        )

        return Response({
            "repairs": RepairRequestListSerializer(repairs, many=True).data,
            "clients": ClientListSerializer(clients, many=True).data,
            "devices": DeviceListSerializer(devices, many=True).data,
        })


class ParcelLockerAddressView(APIView):
    """
    GET /api/v1/config/parcel-locker-address/
    Zwraca stały adres paczkomatu PRO-KOM (do formularza zgłoszenia, etykiet).
    Dostęp publiczny (AllowAny).
    """
    permission_classes = [AllowAny]

    def get(self, request: Request):
        return Response({
            "parcel_locker_address": getattr(settings, "PARCEL_LOCKER_ADDRESS", ""),
        })
