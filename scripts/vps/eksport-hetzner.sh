#!/usr/bin/env bash
# Export of the production data from the OLD server (Hetzner) for the move to the VPS
# (MIGRACJA-VPS §7 pt 1 — rehearsal, §8 pt 3 — switch day). Read-only for the running site.
# Run on Hetzner, in the project directory (/app):
#   bash eksport-hetzner.sh <target database>
#     rehearsal (into staging, anonymized there):  bash eksport-hetzner.sh prokom_tech_staging
#     switch day (into production):                bash eksport-hetzner.sh prokom_tech_prod
# Copy this file there first:  scp scripts/vps/eksport-hetzner.sh <hetzner>:/app/
# Result in /app/eksport/ (mode 600): prokom-tech-import-<UTC>.tar + .sha256
#   inside: db.dump (pg_dump -Fc), media.tar, manifest.txt (kind=import) — what restore.sh expects.
# The file holds customers' personal data: move it Hetzner → your computer → VPS only over
# scp/ssh, compare the sha256 after each copy, and delete it everywhere when done (shred -u).
set -euo pipefail
export MSYS_NO_PATHCONV=1 # only matters for a local test in Git Bash

target_db="${1:?usage: bash eksport-hetzner.sh <prokom_tech_staging|prokom_tech_prod>}"
case "$target_db" in prokom_tech_staging | prokom_tech_prod) ;; *) echo "Unknown target: $target_db" >&2; exit 2 ;; esac

# Always with the env file: without it compose interpolates empty passwords (harmless for exec,
# fatal for `up` — incident 14.11.2026). /app has .env.prod, no .env.
compose=(docker compose --env-file .env.prod -f docker-compose.prod.yml)
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$PWD/eksport"
umask 077
mkdir -p "$out"
work="$(mktemp -d "$out/.work-XXXXXX")"
trap 'rm -rf "$work"' EXIT
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) eksport: $*"; }

log "pg_dump (the site keeps running)"
# User and database come from the container's own environment — nothing is printed.
"${compose[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$work/db.dump"
"${compose[@]}" exec -T db pg_restore --list >/dev/null <"$work/db.dump"

# Compose project on Hetzner is `app` (INWENTARZ.md §B: app_postgres_data, app_mediafiles, …).
media_volume="${MEDIA_VOLUME:-app_mediafiles}"
docker volume inspect "$media_volume" >/dev/null 2>&1 ||
  { log "volume $media_volume not found (docker volume ls; MEDIA_VOLUME=<name> to override) — nothing written"; exit 1; }
log "media volume $media_volume"
docker run --rm -v "$media_volume:/media:ro" postgres:16-alpine tar -C /media -cf - . >"$work/media.tar"

repairs="$("${compose[@]}" exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from repairs_repairrequest"' | tr -d '[:space:]')"
{
  echo "stack=hetzner"
  echo "kind=import"
  echo "created=$stamp"
  echo "database=$target_db"
  echo "source_commit=$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "repairs=$repairs"
  echo "migrations:"
  "${compose[@]}" exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select app || '"'"'.'"'"' || name from django_migrations order by id"'
} >"$work/manifest.txt"

name="prokom-tech-import-$stamp.tar"
tar -C "$work" -cf "$out/$name" db.dump media.tar manifest.txt
(cd "$out" && sha256sum "$name" >"$name.sha256")
log "written $out/$name ($(du -h "$out/$name" | cut -f1)), repairs=$repairs"
log "sha256: $(cut -d' ' -f1 "$out/$name.sha256")"
