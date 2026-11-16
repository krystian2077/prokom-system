#!/usr/bin/env bash
# Mail of a prokom-tech stack: the app sends from kontakt@prokomserwis.pl through the Seohost mail
# hosting (same server as prokom-web / Gaming), staff notifications go to kontakt@ (+ extra addresses
# during the switch). Run it yourself — the password is typed here, checked with a real SMTP login
# (port 587, STARTTLS — Django's EMAIL_USE_TLS=True in prod.py) and written only into the env file:
#   ssh -t prokom-vps 'bash /srv/prokom/prokom-tech/scripts/vps/mail-login.sh prod'
# Then: docker compose --env-file .env.prod -f compose.vps.yml -f compose.prod.yml up -d backend celery celery-beat
# Optional 2nd arg: extra staff notification addresses, comma separated (e.g. the old Gmail for 2 weeks).
set -euo pipefail
stack="${1:?usage: mail-login.sh <prod|staging> [extra,staff,addresses]}"
extra="${2:-}"
case "$stack" in prod | staging) ;; *) echo "Unknown stack: $stack"; exit 2 ;; esac
root="$(cd "$(dirname "$0")/../.." && pwd)"
env_file="$root/.env.$stack"
[ -f "$env_file" ] || { echo "No $env_file"; exit 1; }

host=srv128408.seohost.com.pl # the certificate of the mail server is issued for this name
port=587
box=kontakt@prokomserwis.pl
staff="$box${extra:+,$extra}"
[ "$stack" = staging ] && staff="${extra:-$box}" # staging: never notify the service from a data copy

check() {
  SMTP_CHECK_USER="$1" SMTP_CHECK_PASS="$2" python3 - "$host" "$port" <<'PY'
import os, smtplib, ssl, sys
try:
    with smtplib.SMTP(sys.argv[1], int(sys.argv[2]), timeout=15) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(os.environ["SMTP_CHECK_USER"], os.environ["SMTP_CHECK_PASS"])
except smtplib.SMTPAuthenticationError:
    sys.exit("wrong password")
PY
}

read -rsp "Password of $box (paste: right click): " raw
echo
p="$(printf '%s' "$raw" | sed -e 's/\x1b\[20[01]~//g' | tr -d '\r\n')"
unset raw
case "$p" in *"'"*) echo "The password contains ' — change it in the hosting panel."; exit 1 ;; esac
if ! check "$box" "$p"; then echo "Login of $box failed — nothing written."; exit 1; fi
echo "OK: $box"

exec 9>"$root/../.deploy.lock"
flock -w 600 9 || { echo "A deploy is running — try again in a minute."; exit 1; }
tmp="$(mktemp "$env_file.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
grep -vE '^(EMAIL_HOST|EMAIL_PORT|EMAIL_HOST_USER|EMAIL_HOST_PASSWORD|DEFAULT_FROM_EMAIL|STAFF_NOTIFICATION_EMAILS|SERWIS_PRINT_EMAIL|SERWIS_PRINT_HOURS)=' "$env_file" >"$tmp" ||
  { echo "Could not read $env_file — nothing written."; exit 1; }
grep -q '^DATABASE_URL=' "$tmp" || { echo "$env_file has no DATABASE_URL — nothing written."; exit 1; }
{
  echo "EMAIL_HOST=$host"
  echo "EMAIL_PORT=$port"
  echo "EMAIL_HOST_USER=$box"
  echo "EMAIL_HOST_PASSWORD='$p'"
  echo "DEFAULT_FROM_EMAIL='PRO-KOM Tech <$box>'"
  echo "STAFF_NOTIFICATION_EMAILS=$staff"
  echo "SERWIS_PRINT_EMAIL=$box"
  echo "SERWIS_PRINT_HOURS='Pn–Pt 9:00–17:00 · Sob 9:00–14:00'"
} >>"$tmp"
unset p
chmod 600 "$tmp"
chown --reference="$env_file" "$tmp"
cp -p "$env_file" "$env_file.bak"
mv "$tmp" "$env_file"
trap - EXIT
echo "Saved in $env_file (mail lines only; previous file: $env_file.bak)."
echo "Restart: docker compose --env-file .env.$stack -f compose.vps.yml -f compose.$stack.yml up -d backend celery celery-beat"
