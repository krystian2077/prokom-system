#!/usr/bin/env bash
# Backup of one prokom-tech stack: database + uploaded media, encrypted with age, copied off the
# server. Pattern: prokom-gaming/scripts/backup.sh (same age key, same B2 bucket, own prefix).
# Usage (on the VPS, in /srv/prokom/prokom-tech):
#   scripts/vps/backup.sh <prod|staging> [daily|predeploy]
#     cron every night: daily (the backup of the 1st of the month is also kept as "monthly")
#     deploy.sh before a production deploy: predeploy
# Result: prokom-tech-<stack>-<UTC>.tar.age (inside: db.dump = pg_dump -Fc, media.tar, manifest.txt)
#   locally:     BACKUP_DIR/<stack>/<kind>/       (default ../backups/tech)
#   off-server:  RCLONE_REMOTE/tech-<stack>/<kind>/
# Retention: daily 14 days, monthly 93, predeploy 30.
# Settings: .env.backup next to the env files (or BACKUP_ENV=<file>):
#   AGE_RECIPIENT="$(cat /srv/prokom/secrets/age.pub)"  public key; the private one only in the password manager
#   RCLONE_REMOTE=offsite:prokom-backups-r7k2
#   BACKUP_DIR (optional), BACKUP_LOCAL_ONLY=1 (local tests only)
#   BACKUP_HEARTBEAT_URL_PROD / _STAGING  Better Stack heartbeat: ping after a good backup, <url>/fail on error
# Restore: scripts/vps/restore.sh (docs/tech/WDROZENIE.md).
set -euo pipefail
export MSYS_NO_PATHCONV=1

stack="${1:?usage: scripts/vps/backup.sh <prod|staging> [daily|predeploy]}"
kind="${2:-daily}"
case "$stack" in prod | staging) ;; *) echo "Unknown stack: $stack" >&2; exit 2 ;; esac
case "$kind" in daily | predeploy) ;; *) echo "Unknown kind: $kind" >&2; exit 2 ;; esac

root="$(cd "$(dirname "$0")/../.." && pwd)"
env_file="${BACKUP_ENV:-$root/.env.backup}"
if [ -f "$env_file" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
fi
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) backup prokom-tech-$stack: $*"; }

heartbeat_var="BACKUP_HEARTBEAT_URL_$(echo "$stack" | tr '[:lower:]' '[:upper:]')"
heartbeat="${!heartbeat_var:-}"
ping_heartbeat() {
  [ -n "$heartbeat" ] || return 0
  curl -fsS -m 10 --retry 3 -o /dev/null "$heartbeat$1" || log "heartbeat ping failed"
}
on_exit() {
  local status=$?
  rm -rf "${work:-}"
  if [ "$status" -ne 0 ]; then ping_heartbeat /fail; fi
}
trap on_exit EXIT

: "${AGE_RECIPIENT:?set AGE_RECIPIENT (public age key) in .env.backup}"
backup_dir="${BACKUP_DIR:-$root/../backups/tech}"
if [ -z "${RCLONE_REMOTE:-}" ] && [ "${BACKUP_LOCAL_ONLY:-}" != 1 ]; then
  echo "Set RCLONE_REMOTE (off-server copy) or BACKUP_LOCAL_ONLY=1 for a local test." >&2
  exit 2
fi

project="prokom-tech-$stack"
db="prokom_tech_$stack"
pg="$project-db-1"
media_volume="${project}_mediafiles"
helper_image="$(docker inspect -f '{{.Config.Image}}' "$pg")"

# The unencrypted dump holds customers' personal data: kept next to the backups (not in /tmp),
# removed on exit.
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
work="$(mktemp -d "$backup_dir/.backup-XXXXXX")"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
name="$project-$stamp.tar.age"

log "database $db"
docker exec "$pg" pg_dump -U prokom -d "$db" -Fc >"$work/db.dump"
# A dump pg_restore cannot read is no backup: check it before it replaces older ones.
docker exec -i "$pg" pg_restore --list >/dev/null <"$work/db.dump"

log "media volume $media_volume"
docker run --rm -v "$media_volume:/media:ro" "$helper_image" tar -C /media -cf - . >"$work/media.tar"

{
  echo "stack=$stack"
  echo "kind=$kind"
  echo "created=$stamp"
  echo "database=$db"
  echo "backend_image=$(docker inspect -f '{{.Config.Image}}' "$project-backend-1" 2>/dev/null || echo unknown)"
  echo "repairs=$(docker exec "$pg" psql -U prokom -d "$db" -tAc 'select count(*) from repairs_repairrequest' 2>/dev/null || echo unknown)"
  echo "migrations:"
  docker exec "$pg" psql -U prokom -d "$db" -tAc "select app || '.' || name from django_migrations order by id"
} >"$work/manifest.txt"

kinds=("$kind")
[ "$kind" = daily ] && [ "$(date -u +%d)" = 01 ] && kinds+=(monthly)

target="$backup_dir/$stack/$kind"
mkdir -p "$target"
tar -C "$work" -cf - db.dump media.tar manifest.txt | age -r "$AGE_RECIPIENT" >"$target/$name"
log "written $target/$name ($(du -h "$target/$name" | cut -f1))"
for extra in "${kinds[@]:1}"; do
  mkdir -p "$backup_dir/$stack/$extra"
  cp "$target/$name" "$backup_dir/$stack/$extra/$name"
done

retention_days() { case "$1" in daily) echo 14 ;; monthly) echo 93 ;; predeploy) echo 30 ;; esac; }

for k in "${kinds[@]}"; do
  days="$(retention_days "$k")"
  if [ -n "${RCLONE_REMOTE:-}" ]; then
    remote="$RCLONE_REMOTE/tech-$stack/$k/"
    log "off-server copy to $remote"
    rclone copy "$backup_dir/$stack/$k/$name" "$remote"
    rclone delete --min-age "${days}d" "$remote"
  fi
  find "$backup_dir/$stack/$k" -name '*.tar.age' -mtime +"$days" -delete
done

ping_heartbeat ""
log "done"
