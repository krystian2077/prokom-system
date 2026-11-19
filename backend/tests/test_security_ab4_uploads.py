"""Audit AB4 (T-10, T-06): random names for uploaded files and image formats only."""
import re
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.authtoken.models import Token

from apps.common.uploads import RandomName, validate_image_upload
from apps.repairs.services.public_submit import submit_repair_from_public_form

User = get_user_model()
PNG = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
       b"\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82")


def test_random_name_hides_the_original_file_name():
    path = RandomName("repairs/photos")(None, "IMG_1234 Jan Kowalski.JPG")
    assert re.fullmatch(r"repairs/photos/\d{4}/\d{2}/[0-9a-f]{32}\.jpg", path)
    assert "Kowalski" not in path
    assert RandomName("brands/logos", dated=False)(None, "logo.png").startswith("brands/logos/")


def test_only_images_up_to_20_mb():
    validate_image_upload(SimpleUploadedFile("a.jpg", b"x"))
    validate_image_upload(SimpleUploadedFile("a.HEIC", b"x"))
    for bad in ("a.svg", "a.html", "a.php", "a"):
        with pytest.raises(ValidationError):
            validate_image_upload(SimpleUploadedFile(bad, b"x"))
    big = SimpleUploadedFile("a.png", b"x")
    big.size = 21 * 1024 * 1024
    with pytest.raises(ValidationError):
        validate_image_upload(big)


@pytest.mark.django_db
def test_repair_photo_upload_gets_a_random_name_and_html_is_refused(api_client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        repair, _ = submit_repair_from_public_form(
            first_name="Anna", last_name="Nowak", email="upl@example.com", phone="600100200",
            category="phone", problem_description="Ekran",
        )
    staff = User.objects.create_user(email="st@example.com", password="Mocne-Haslo-2026!x", role="staff")
    token, _ = Token.objects.get_or_create(user=staff)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    ok = api_client.post(f"/api/v1/repairs/{repair.id}/images/",
                         {"repair": str(repair.id), "image": SimpleUploadedFile("IMG_0001.png", PNG, content_type="image/png")},
                         format="multipart")
    assert ok.status_code in (200, 201), ok.content
    stored = repair.images.first().image.name
    assert "IMG_0001" not in stored and re.search(r"/[0-9a-f]{32}\.png$", stored)

    bad = api_client.post(f"/api/v1/repairs/{repair.id}/images/",
                          {"repair": str(repair.id), "image": SimpleUploadedFile("x.html", b"<script>alert(1)</script>", content_type="text/html")},
                          format="multipart")
    assert bad.status_code == 400


@pytest.mark.django_db
def test_old_stored_files_do_not_block_saving(settings, tmp_path):
    from apps.devices.models import Brand
    settings.MEDIA_ROOT = tmp_path
    brand = Brand.objects.create(name="Stara Marka", slug="stara-marka")
    brand.logo.name = "brands/logos/stare-logo.svg"  # stored before AB4, file not even on disk
    brand.save()
    brand.full_clean()  # what the admin runs on save — must not complain about the old file


@pytest.mark.django_db
def test_package_photo_upload_is_validated(api_client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    with patch("apps.communications.services.send.send_repair_submission_confirmation"):
        repair, _ = submit_repair_from_public_form(
            first_name="Anna", last_name="Nowak", email="pkg@example.com", phone="600100200",
            category="phone", problem_description="Ekran",
        )
    staff = User.objects.create_user(email="st2@example.com", password="Mocne-Haslo-2026!x", role="staff")
    token, _ = Token.objects.get_or_create(user=staff)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    bad = api_client.post(f"/api/v1/repairs/{repair.id}/mark-package-received/",
                          {"package_ok": "true", "package_photo": SimpleUploadedFile("x.svg", b"<svg/>", content_type="image/svg+xml")},
                          format="multipart")
    assert bad.status_code == 400
    repair.refresh_from_db()
    assert not repair.package_photo
