#!/usr/bin/env bash
# Smoke test of a prokom-tech stack (MIGRACJA-VPS §7 pt 3 — the automatic part).
# Usage (on the VPS, in /srv/prokom/prokom-tech):
#   scripts/vps/smoke.sh <prod|staging> [core]
#     default: through the stack's gateway on the loopback port (GATEWAY_PORT from .env.<stack>),
#              with the site's Host header and X-Forwarded-Proto: https, like the shared Nginx sends
#     core:    only what every version has (used after a rollback by deploy.sh)
# Environment:
#   SMOKE_URL=https://staging.prokomserwis.pl   test through the shared Nginx instead of the loopback
#   SMOKE_AUTH=user:password                   basic auth of staging (never printed)
#   SMOKE_SUBMIT=1                             staging only: send a test repair and track it
# Backend has no /api/health/ (T0) — the checks use real routes. Exits 1 on any failure.
set -euo pipefail
export MSYS_NO_PATHCONV=1

stack="${1:?usage: scripts/vps/smoke.sh <prod|staging> [core]}"
mode="${2:-full}"
case "$stack" in prod | staging) ;; *) echo "Unknown stack: $stack" >&2; exit 2 ;; esac

root="$(cd "$(dirname "$0")/../.." && pwd)"
env_file="$root/.env.$stack"
env_value() { sed -n "s/^$2=//p" "$1" | tail -1; }

host="$(env_value "$env_file" ALLOWED_HOSTS | cut -d, -f1 | tr -d ' ')"
[ -n "$host" ] || { echo "ALLOWED_HOSTS missing in $env_file" >&2; exit 2; }

curl_args=(-s -o /dev/null -w '%{http_code}' --max-time 20)
if [ -n "${SMOKE_URL:-}" ]; then
  base="${SMOKE_URL%/}"
  proto_header=()
else
  port="$(env_value "$env_file" GATEWAY_PORT)"
  [ -n "$port" ] || { echo "GATEWAY_PORT missing in $env_file" >&2; exit 2; }
  base="http://127.0.0.1:$port"
  curl_args+=(-H "Host: $host")
  proto_header=(-H 'X-Forwarded-Proto: https')
fi
[ -n "${SMOKE_AUTH:-}" ] && curl_args+=(-u "$SMOKE_AUTH")

failures=0
# check <expected codes, e.g. 200|302> <path> [extra curl args...]
check() {
  local expect="$1" path="$2" code
  shift 2
  code="$(curl "${curl_args[@]}" "${proto_header[@]}" "$@" "$base$path" || true)"
  if [[ "$code" =~ ^($expect)$ ]]; then
    echo "ok   $code  $path"
  else
    echo "FAIL $code  $path  (expected $expect)"
    failures=$((failures + 1))
  fi
}

echo "smoke tech-$stack → $base (Host: $host)"
[ -z "${SMOKE_URL:-}" ] && check 200 /gateway-health
check 200 /
check 200 /panel/login
check 200 /admin/login/
check 400 /api/v1/repairs/track/ # API reachable: 400 = missing ref/phone, as designed

if [ "$mode" != core ]; then
  check 200 /client/login
  check 200 /zgloszenie
  check 200 /track
  check 200 /static/admin/css/base.css # collectstatic + gateway volume
  check 404 /media/__smoke_missing__.jpg # media served by the gateway (404 from nginx, not Next)
  if [ -z "${SMOKE_URL:-}" ]; then
    # Without X-Forwarded-Proto Django must redirect to https — proves the header decides, i.e. the
    # gateway forwards the shared Nginx value instead of its own http (redirect-loop guard).
    code="$(curl "${curl_args[@]}" "$base/admin/login/" || true)"
    if [ "$code" = 301 ]; then echo "ok   301  /admin/login/ without X-Forwarded-Proto"; else
      echo "FAIL $code  /admin/login/ without X-Forwarded-Proto (expected 301)"; failures=$((failures + 1)); fi
  fi
fi

if [ "${SMOKE_SUBMIT:-}" = 1 ]; then
  if [ "$stack" != staging ]; then
    echo "SMOKE_SUBMIT works on staging only (never a test repair in production by script)" >&2
    exit 2
  fi
  # ASCII only (Polish letters as JSON escapes): the same bytes in any shell or terminal encoding.
  payload='{"client":{"first_name":"Test","last_name":"Smoke","email":"smoke@example.test","phone":"500000123","preferred_contact":"email"},"device":{"category":"phone","brand_name":"Test","model_name":"Smoke","problem_description":"Test smoke.sh - do usuni\u0119cia."},"delivery_method":"in_person","return_method":"in_person","additional_notes":"Punkt przyj\u0119cia: Rabka-Zdr\u00f3j\n\nTEST smoke.sh"}'
  submit_args=(-s --max-time 60 -H 'Content-Type: application/json' -d "$payload")
  [ -z "${SMOKE_URL:-}" ] && submit_args+=(-H "Host: $host")
  [ -n "${SMOKE_AUTH:-}" ] && submit_args+=(-u "$SMOKE_AUTH")
  body="$(curl "${submit_args[@]}" "${proto_header[@]}" "$base/api/v1/repairs/submit/" || true)"
  number="$(printf '%s' "$body" | sed -n 's/.*"repair_number":"\([^"]*\)".*/\1/p')"
  if [ -n "$number" ]; then
    echo "ok   submit → $number"
    ref="$(printf '%s' "$number" | sed 's#/#%2F#g')"
    check 200 "/api/v1/repairs/track/?ref=$ref&phone_last4=0123"
  else
    echo "FAIL submit (no repair_number in the response): $(printf '%s' "$body" | head -c 300)"
    failures=$((failures + 1))
  fi
fi

if [ "$failures" -gt 0 ]; then
  echo "smoke tech-$stack: $failures failure(s)"
  exit 1
fi
echo "smoke tech-$stack: all ok"
