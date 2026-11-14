#!/usr/bin/env bash
# Deploy one commit (images from GHCR, tag = full SHA) to a prokom-tech stack, with rollback.
# Usage (on the VPS, in /srv/prokom/prokom-tech):  scripts/vps/deploy.sh <prod|staging> <sha>
# Pattern: prokom-gaming/scripts/deploy.sh (G16), adapted to Django (migrations run here, not at start).
# Steps:
#   1. prod: backup "predeploy" (scripts/vps/backup.sh) — a failed backup stops everything
#   2. pull backend + frontend images of <sha> — a missing image stops everything
#   3. APP_IMAGE_TAG=<sha> in .env.<stack>, db + redis up
#   4. pending migrations? list them; on prod ask for confirmation (MIGRATE_CONFIRM=1 skips the
#      question), then migrate. MIGRACJA-VPS §8: on switch day nothing should be pending — if it
#      is, stop and decide.
#   5. collectstatic → up -d --wait (healthchecks) → scripts/vps/smoke.sh
# On failure after the tag change:
#   - no migration ran in this deploy → previous tag back + core smoke test, exit 1
#   - migrations ran → NO rollback (old code may not run on the new schema), exit 1, decide by hand
#     (WDROZENIE.md „Cofnięcie”)
# Logs: ../deploys.log (one line per deploy, shared with prokom-web and prokom-gaming) and
# ../deploy-output.log. Never prints the content of .env files.
set -euo pipefail
trap '' PIPE HUP # a dropped SSH session must not kill the deploy half way
export MSYS_NO_PATHCONV=1

usage="usage: scripts/vps/deploy.sh <prod|staging> <sha>"
stack="${1:?$usage}"
sha="${2:?$usage}"
case "$stack" in prod | staging) ;; *) echo "Unknown stack: $stack" >&2; exit 2 ;; esac
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "Not a full commit SHA: $sha" >&2; exit 2; }

root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
env_file=".env.$stack"
[ -f "$env_file" ] || { echo "Missing $root/$env_file" >&2; exit 2; }

compose=(docker compose --env-file "$env_file" -f compose.vps.yml -f "compose.$stack.yml")
backend_image="ghcr.io/krystian2077/prokom-tech-backend"
frontend_image="ghcr.io/krystian2077/prokom-tech-frontend"
[ "$stack" = staging ] && frontend_image+="-staging"
db_container="prokom-tech-$stack-db-1"
logdir="$root/.."

log() {
  local line
  line="$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy tech-$stack: $*"
  echo "$line" >>"$logdir/deploy-output.log"
  echo "$line" 2>/dev/null || true
}
# One value from an env file, without sourcing it (the file holds secrets).
env_value() { sed -n "s/^$2=//p" "$1" | tail -1; }
run_logged() { "$@" 2>&1 | while IFS= read -r l; do log "$l"; done; return "${PIPESTATUS[0]}"; }

# DEPLOY_LOCAL_TEST=1 — local test of this script only (images built locally, no server lock).
local_test="${DEPLOY_LOCAL_TEST:-}"

# One deploy at a time on the whole server (same lock file as prokom-web and prokom-gaming).
exec 9>"$logdir/.deploy.lock"
if [ "$local_test" = 1 ] && ! command -v flock >/dev/null; then
  log "local test: no flock here, running without the server lock"
else
  flock -w 600 9 || { log "another deploy still running"; exit 1; }
fi

prev="$(env_value "$env_file" APP_IMAGE_TAG)"
record() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) tech-$stack ${prev:0:7} -> ${sha:0:7} $1" >>"$logdir/deploys.log"; }

set_tag() {
  if grep -q '^APP_IMAGE_TAG=' "$env_file"; then
    sed -i "s/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=$1/" "$env_file" # keeps mode 600 and owner
  else
    echo "APP_IMAGE_TAG=$1" >>"$env_file"
  fi
  [ "$(env_value "$env_file" APP_IMAGE_TAG)" = "$1" ]
}

manage() { "${compose[@]}" run --rm --no-deps -T backend python manage.py "$@"; }
pending_migrations() { manage showmigrations --plan | grep '^\[ \]' || true; }

start() { run_logged "${compose[@]}" up -d --wait --wait-timeout 300; }
smoke() { run_logged bash scripts/vps/smoke.sh "$stack" ${1:+"$1"}; }

migrated=0
fail() {
  if [ "$migrated" = 1 ]; then
    log "FAILED — migrations ran in this deploy, so NO rollback (old code may not run on the new schema)"
    log "${sha:0:7} stays — check it and decide by hand: docs/tech/WDROZENIE.md „Cofnięcie”"
    record "FAILED, not rolled back (migrations applied)"
    exit 1
  fi
  if [[ ! "$prev" =~ ^[0-9a-f]{40}$ ]]; then
    log "FAILED — first deploy of this stack, nothing to roll back to"
    record "FAILED, first deploy"
    exit 1
  fi
  log "FAILED — back to ${prev:0:7}"
  if set_tag "$prev" && start && smoke core; then
    log "rollback done, ${prev:0:7} is running"
    record "FAILED, rolled back"
  else
    log "ROLLBACK FAILED — forward to ${sha:0:7} again, so $stack does not stay down"
    if set_tag "$sha" && start; then record "FAILED, rollback failed, ${sha:0:7} running again"; else record "FAILED, $stack DOWN"; fi
    log "manual action: docs/tech/WDROZENIE.md"
  fi
  exit 1
}

log "${prev:0:7} -> ${sha:0:7}"

# 1. Backup before touching production (skipped only on the very first deploy: no database yet).
if [ "$stack" = prod ] && docker inspect "$db_container" >/dev/null 2>&1; then
  log "backup before the deploy"
  scripts/vps/backup.sh prod predeploy || { log "backup failed — nothing changed"; record "FAILED, backup"; exit 1; }
fi

# 2. Pull first: a missing image stops the deploy before anything changes.
for img in "$backend_image:$sha" "$frontend_image:$sha"; do
  if [ "$local_test" = 1 ]; then
    docker image inspect "$img" >/dev/null 2>&1 || { log "local test: image $img not built"; exit 1; }
    continue
  fi
  docker pull -q "$img" >/dev/null || { log "image $img not found — nothing changed"; record "FAILED, no image"; exit 1; }
done

# 3. New tag, database and Redis up.
set_tag "$sha" || fail
run_logged "${compose[@]}" up -d --wait --wait-timeout 120 db redis || fail

# 4. Migrations — explicit, after the backup, and only with confirmation on prod.
pending="$(pending_migrations)" || fail
if [ -n "$pending" ]; then
  log "pending migrations:"
  echo "$pending" | while IFS= read -r l; do log "  $l"; done
  if [ "$stack" = prod ] && [ "${MIGRATE_CONFIRM:-}" != 1 ]; then
    answer=""
    if [ -t 0 ]; then read -r -p "Apply these migrations on PRODUCTION? Type MIGRUJ: " answer; fi
    if [ "$answer" != MIGRUJ ]; then
      log "migrations not confirmed — back to the previous tag, nothing else changed"
      [[ "$prev" =~ ^[0-9a-f]{40}$ ]] && set_tag "$prev"
      record "STOPPED, migrations not confirmed"
      exit 1
    fi
  fi
  migrated=1
  run_logged manage migrate --noinput || fail
else
  log "no pending migrations"
fi

# 5. Static files into the shared volume, then the whole stack, healthchecks, smoke test.
run_logged manage collectstatic --noinput || fail
start || fail
smoke || fail

log "done, ${sha:0:7} is running"
record "ok"

# Old images fill the disk: keep the ones both stacks name in their env files (+ the previous one).
keep=" $sha $prev "
for f in .env.staging .env.prod; do [ -f "$f" ] && keep+="$(env_value "$f" APP_IMAGE_TAG) "; done
for repo in ghcr.io/krystian2077/prokom-tech-backend ghcr.io/krystian2077/prokom-tech-frontend ghcr.io/krystian2077/prokom-tech-frontend-staging; do
  docker image ls "$repo" --format '{{.Tag}}' | while read -r tag; do
    case "$keep" in *" $tag "*) ;; *) docker image rm "$repo:$tag" >/dev/null 2>&1 || true ;; esac
  done
done
