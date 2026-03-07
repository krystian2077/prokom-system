"""PRO-KOM Serwis — Documents services."""
from .pdf import build_acceptance_protocol_pdf
from .qr import build_repair_qr_image

__all__ = ["build_acceptance_protocol_pdf", "build_repair_qr_image"]
