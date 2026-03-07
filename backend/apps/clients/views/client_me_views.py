"""Widok profilu klienta (panel klienta — /me/)."""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.clients.serializers import ClientProfileSerializer
from apps.clients.serializers.client_profile import ClientProfileUpdateSerializer


class ClientMeView(APIView):
    """
    GET /api/v1/clients/me/ — dane profilu klienta.
    PATCH /api/v1/clients/me/ — aktualizacja przez klienta (imię, nazwisko, telefon, adres, preferencje).
    Tylko dla użytkownika z rolą client i istniejącym profilem.
    """
    permission_classes = [IsAuthenticated]

    def _get_client(self, request):
        if request.user.role != "client":
            return None
        return getattr(request.user, "client_profile", None)

    def get(self, request):
        client = self._get_client(request)
        if client is None:
            return Response(
                {"detail": "Brak powiązanego profilu klienta."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ClientProfileSerializer(client).data)

    def patch(self, request):
        client = self._get_client(request)
        if client is None:
            return Response(
                {"detail": "Brak powiązanego profilu klienta."},
                status=status.HTTP_404_NOT_FOUND,
            )
        ser = ClientProfileUpdateSerializer(client, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ClientProfileSerializer(client).data)
