from datetime import date

import pytest

from apps.communications.services import send as send_service


class _DummyClient:
    email = "klient@example.com"
    phone = "+48 600 700 800"

    @staticmethod
    def get_full_name():
        return "Jan Kowalski"


class _DummyDevice:
    @staticmethod
    def get_device_name():
        return "Samsung Galaxy S22"


class _DummyRepair:
    repair_number = "R-2026-0001"
    client = _DummyClient()
    device = _DummyDevice()
    problem_description = "Wymiana szybki"
    delivery_method = "courier"
    return_method = "pickup"
    claim_token = None
    claim_token_expires_at = None
    hammer_glass_interest = None
    accessory_interests = None
    client_notes = ""
    device_turns_on = True
    visual_condition_description = ""
    estimated_cost = None
    estimated_completion_date = date(2026, 4, 30)

    @staticmethod
    def get_delivery_method_display():
        return "Kurier"

    @staticmethod
    def get_return_method_display():
        return "Odbior osobisty"

    @staticmethod
    def get_priority_display():
        return "Normalny"

    @staticmethod
    def get_estimated_duration_display():
        return "3-5 dni"


@pytest.mark.parametrize("intake_stationary", [False, True])
def test_submission_confirmation_email_does_not_include_priority(monkeypatch, intake_stationary):
    repair = _DummyRepair()
    captured = {}

    def _fake_render_to_string(template_name, context):
        captured["template_name"] = template_name
        captured["context"] = context
        return "<html>mail</html>"

    def _fake_send_email_html(to_email, subject, body_plain, html_content, fail_silently=True):
        captured["to_email"] = to_email
        captured["subject"] = subject
        captured["body_plain"] = body_plain
        captured["html_content"] = html_content
        return 1

    monkeypatch.setattr(send_service, "render_to_string", _fake_render_to_string)
    monkeypatch.setattr(send_service, "send_email_html", _fake_send_email_html)

    sent = send_service.send_repair_submission_confirmation(
        repair,
        fail_silently=False,
        intake_stationary=intake_stationary,
    )

    assert sent == 1
    assert "priority_display" not in captured["context"]
    assert "Priorytet" not in captured["body_plain"]

