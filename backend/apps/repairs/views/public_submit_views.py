"""
PRO-KOM Serwis — Publiczne zgłoszenie naprawy (formularz online)
================================================================
Endpoint AllowAny — bez logowania.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from apps.repairs.serializers.public_submit import PublicRepairSubmitSerializer
from apps.repairs.services import submit_repair_from_public_form


class PublicRepairSubmitView(APIView):
    """
    POST /api/v1/repairs/submit/
    Body: { "client": { ... }, "device": { ... }, "delivery_method", "return_method", ... }
    Zwraca: { "repair_number": "REP-...", "message": "...", "tracking_url": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicRepairSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        client_data = data["client"]
        device_data = data["device"]

        try:
            repair, _client_created = submit_repair_from_public_form(
                first_name=client_data["first_name"],
                last_name=client_data["last_name"],
                email=client_data["email"],
                phone=client_data["phone"],
                preferred_contact=client_data.get("preferred_contact", "email"),
                street=client_data.get("street", ""),
                city=client_data.get("city", ""),
                postal_code=client_data.get("postal_code", ""),
                country=client_data.get("country", "Polska"),
                category=device_data["category"],
                problem_description=device_data["problem_description"],
                brand_id=device_data.get("brand_id"),
                device_model_id=device_data.get("device_model_id"),
                model_name=device_data.get("model_name", ""),
                serial_number=device_data.get("serial_number", ""),
                imei=device_data.get("imei", ""),
                delivery_method=data.get("delivery_method", "in_person"),
                return_method=data.get("return_method", "in_person"),
                delivery_street=data.get("delivery_street", ""),
                delivery_city=data.get("delivery_city", ""),
                delivery_postal_code=data.get("delivery_postal_code", ""),
                delivery_country=data.get("delivery_country", "Polska"),
                hammer_glass_interest=data.get("hammer_glass_interest") or None,
                accessory_product_ids=data.get("accessory_interest") or [],
                accessory_choose_for_me=data.get("accessory_choose_for_me", False),
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "repair_number": repair.repair_number,
                "message": (
                    "Zgłoszenie zostało przyjęte. "
                    "Skontaktujemy się w celu potwierdzenia lub po diagnozie."
                ),
                "tracking_url": f"/naprawy/{repair.repair_number}/",
            },
            status=status.HTTP_201_CREATED,
        )
