#!/usr/bin/env bash
# Restores a backup (scripts/vps/backup.sh) or a Hetzner export (scripts/vps/eksport-hetzner.sh)
# into a running prokom-tech stack. DESTRUCTIVE for the target: its database is dropped and
# recreated, its media volume emptied. Pattern: prokom-gaming/scripts/restore.sh.
# Usage (on the VPS, in /srv/prokom/prokom-tech):
#   scripts/vps/restore.sh [--no-start] <file | rclone remote path> <project> <database>
# Examples:
#   staging from the Hetzner export (rehearsal, MIGRACJA §7) — then anonymize BEFORE starting:
#     scripts/vps/restore.sh --no-start ../import/prokom-tech-import-<UTC>.tar prokom-tech-staging prokom_tech_staging
#     docker exec -i prokom-tech-staging-db-1 psql -v ON_ERROR_STOP=1 -U prokom -d prokom_tech_staging < scripts/vps/anonimizuj.sql
#   restore test into staging from an off-server backup of prod:
#     RESTORE_ANY_DB=1 scripts/vps/restore.sh --no-start offsite:prokom-backups-r7k2/tech-prod/daily/<file> prokom-tech-staging prokom_tech_staging
#     (and anonymize before starting — it is production data)
#   rollback with the database: scripts/vps/restore.sh --no-start ../backups/tech/prod/predeploy/<file> prokom-tech-prod prokom_tech_prod
# The target stack's db must be running. backend, celery, celery-beat are stopped for the restore;
# without --no-start they are started again (the same containers).
# Safety: the manifest's database must equal <database> (RESTORE_ANY_DB=1 to restore elsewhere on
# purpose); prod and staging ask to type the project name (RESTORE_CONFIRM=<project> answers it).
# Settings: .env.backup (or BACKUP_ENV) — AGE_IDENTITY: file with the PRIVATE age key, taken from
# the password manager for the restore and shredded afterwards (shred -u). A plain .tar (not
# encrypted) is accepted only with kind=import in its manifest (the Hetzner export).
set -euo pipefail
export MSYS_NO_PATHCONV=1

usage="usage: scripts/vps/restore.sh [--no-start] <file | remote path> <project> <database>"
start_app=1
if [ "${1:-}" = --no-start ]; then start_app=0; shift; fi
source="${1:?$usage}"
project="${2:?$usage}"
db="${3:?$usage}"

root="$(cd "$(dirname "$0")/../.." && pwd)"
env_file="${BACKUP_ENV:-$root/.env.backup}"
if [ -f "$env_file" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
fi
plain=0
case "$source" in *.tar) plain=1 ;; esac
[ "$plain" = 1 ] || : "${AGE_IDENTITY:?set AGE_IDENTITY (file with the private age key)}"
backup_dir="${BACKUP_DIR:-$root/../backups/tech}"

pg="$project-db-1"
app_containers=("$project-backend-1" "$project-celery-1" "$project-celery-beat-1")
media_volume="${project}_mediafiles"
helper_image="$(docker inspect -f '{{.Config.Image}}' "$pg")"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) restore $project: $*"; }

mkdir -p "$backup_dir"
work="$(mktemp -d "$backup_dir/.restore-XXXXXX")"
trap 'rm -rf "$work"' EXIT

if [ -f "$source" ]; then
  file="$source"
else
  log "download $source"
  rclone copyto "$source" "$work/backup.tar.age"
  file="$work/backup.tar.age"
fi

if [ "$plain" = 1 ]; then
  cp "$file" "$work/backup.tar"
elif ! age -d -i "$AGE_IDENTITY" -o "$work/backup.tar" "$file"; then
  log "cannot decrypt — wrong AGE_IDENTITY or not a backup file; nothing was changed"
  exit 1
fi
tar -C "$work" -xf - <"$work/backup.tar"
rm "$work/backup.tar"
echo "--- manifest"
grep -v '^  ' "$work/manifest.txt" | sed -n '1,12p'
echo "---"

if [ "$plain" = 1 ] && [ "$(sed -n 's/^kind=//p' "$work/manifest.txt")" != import ]; then
  log "an unencrypted file must be a Hetzner export (kind=import) — nothing was changed"
  exit 1
fi
backup_db="$(sed -n 's/^database=//p' "$work/manifest.txt")"
if [ "$backup_db" != "$db" ] && [ "${RESTORE_ANY_DB:-}" != 1 ]; then
  log "the file is for database $backup_db, not $db — wrong file or target? (RESTORE_ANY_DB=1 if intended); nothing was changed"
  exit 1
fi

case "$project" in
  prokom-tech-prod | prokom-tech-staging)
    if [ "${RESTORE_CONFIRM:-}" != "$project" ]; then
      read -r -p "This replaces the database and media of $project. Type the project name: " answer
      [ "$answer" = "$project" ] || { echo "Aborted." >&2; exit 1; }
    fi
    ;;
esac

stopped=()
for c in "${app_containers[@]}"; do
  if [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null || echo false)" = true ]; then
    log "stop $c"
    docker stop "$c" >/dev/null
    stopped+=("$c")
  fi
done

log "database $db (drop, create, restore)"
docker exec "$pg" dropdb -U prokom --if-exists --force "$db"
docker exec "$pg" createdb -U prokom "$db"
# --no-owner/--no-acl: the Hetzner database has another role name; everything belongs to `prokom` here.
docker exec -i "$pg" pg_restore -U prokom -d "$db" --no-owner --no-acl --exit-on-error <"$work/db.dump"
log "repairs in the restored database: $(docker exec "$pg" psql -U prokom -d "$db" -tAc 'select count(*) from repairs_repairrequest')"

log "media volume $media_volume"
docker run --rm -i -v "$media_volume:/media" "$helper_image" \
  sh -c 'find /media -mindepth 1 -delete && tar -C /media -xf -' <"$work/media.tar"

if [ "$start_app" = 0 ] || [ "${#stopped[@]}" -eq 0 ]; then
  log "done — app left stopped; next: (staging: anonimizuj.sql), then docker compose … up -d --wait and scripts/vps/smoke.sh"
  exit 0
fi
for c in "${stopped[@]}"; do docker start "$c" >/dev/null; done
log "done — started again: ${stopped[*]}; now run scripts/vps/smoke.sh"
