"""
Uploaded files: random names and allowed types (audit AB4, T-10 / T-06).

/media/ is served by the gateway without a login, and files kept their original names
(IMG_1234.jpg, repair photos per month) — easy to guess. A random name (uuid) keeps the folder
layout but makes a file reachable only by someone who got its address from the API. Only image
formats are accepted, so nobody can upload HTML or SVG and have it served from this domain.
"""
import os
import uuid

from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.deconstruct import deconstructible

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # the same 20 MB as client_max_body_size in Nginx


@deconstructible
class RandomName:
    """upload_to: `<folder>/<YYYY>/<MM>/<uuid><ext>` (folder without dates when dated=False)."""

    def __init__(self, folder, dated=True):
        self.folder = folder.strip("/")
        self.dated = dated

    def __call__(self, instance, filename):
        ext = os.path.splitext(filename)[1].lower()[:10]
        name = f"{uuid.uuid4().hex}{ext}"
        if self.dated:
            now = timezone.now()
            return f"{self.folder}/{now:%Y}/{now:%m}/{name}"
        return f"{self.folder}/{name}"

    def __eq__(self, other):
        return isinstance(other, RandomName) and (self.folder, self.dated) == (other.folder, other.dated)


def validate_image_upload(file):
    """Only image formats (no SVG/HTML), at most 20 MB — for new uploads only."""
    # A file already stored (FieldFile, committed) was accepted under the old rules: re-checking it
    # on every admin save would block editing old records (an SVG logo, a PDF in photos) and
    # `size` of a missing file raises — validate what is being uploaded now.
    if getattr(file, "_committed", False):
        return
    ext = os.path.splitext(getattr(file, "name", "") or "")[1].lower()
    if ext not in IMAGE_EXTENSIONS:
        raise ValidationError("Dozwolone są tylko zdjęcia: JPG, PNG, WebP, GIF albo HEIC.")
    size = getattr(file, "size", 0) or 0
    if size > MAX_UPLOAD_BYTES:
        raise ValidationError("Plik jest za duży (najwyżej 20 MB).")
