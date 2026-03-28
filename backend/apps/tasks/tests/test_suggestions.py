"""Testy heurystyk propozycji zadań przy naprawie."""
from types import SimpleNamespace
import uuid

from django.test import SimpleTestCase

from apps.common.enums import RepairStatus
from apps.tasks.suggestions import raw_suggestions_for_repair


class RawSuggestionsTests(SimpleTestCase):
    def test_status_and_keywords(self):
        r = SimpleNamespace(
            status=RepairStatus.WAITING_FOR_PARTS,
            problem_description="wymiana wyświetlacza i baterii",
            pk=uuid.uuid4(),
        )
        raw = raw_suggestions_for_repair(r)
        keys = {x["suggestion_key"] for x in raw}
        self.assertIn("status:waiting_for_parts:followup", keys)
        self.assertIn("kw:screen", keys)
        self.assertIn("kw:battery", keys)

    def test_ready_for_pickup(self):
        r = SimpleNamespace(
            status=RepairStatus.READY_FOR_PICKUP,
            problem_description="",
            pk=uuid.uuid4(),
        )
        raw = raw_suggestions_for_repair(r)
        keys = {x["suggestion_key"] for x in raw}
        self.assertIn("status:ready_for_pickup:contact", keys)
        self.assertIn("status:ready_for_pickup:foil", keys)
