"""Parsowanie wiadomości RFC822 do pól używanych przez inbound_processing."""
from __future__ import annotations

import re
from email import message_from_bytes
from email import policy
from email.header import decode_header
from email.message import Message
from typing import Tuple


def decode_mime_header(value: str | None) -> str:
    if not value:
        return ""
    parts = decode_header(value)
    out: list[str] = []
    for frag, enc in parts:
        if isinstance(frag, bytes):
            out.append(frag.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(frag)
    return "".join(out)


def html_to_text(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_plain_body(msg: Message) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition") or "")
            if "attachment" in disp.lower():
                continue
            if ctype == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
            if ctype == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    html = payload.decode(charset, errors="replace")
                    return html_to_text(html)
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            text = payload.decode(charset, errors="replace")
            if msg.get_content_type() == "text/html":
                return html_to_text(text)
            return text
    return ""


def parse_rfc822_bytes(raw: bytes) -> Tuple[str, str, str]:
    """
    Zwraca (from_raw, subject, body_plain).
    from_raw — surowy nagłówek From (parseaddr w inbound_processing).
    """
    msg = message_from_bytes(raw, policy=policy.default)
    from_raw = msg.get("From") or ""
    subject = decode_mime_header(msg.get("Subject"))
    body = extract_plain_body(msg).strip()
    return from_raw, subject, body
