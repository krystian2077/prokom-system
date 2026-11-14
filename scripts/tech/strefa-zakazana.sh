#!/usr/bin/env bash
# Forbidden-zone guard for the PRO-KOM Tech rebuild (docs/tech/SPEC.md §2).
# Fails when the branch changes backend or panel files, unless the file is
# listed in the approved-exceptions table in docs/tech/WYJATKI.md.
#
# Usage: scripts/tech/strefa-zakazana.sh [base-ref]   (default: origin/develop)
# In CI pass the PR base, e.g. origin/${GITHUB_BASE_REF}.
set -euo pipefail

BASE="${1:-origin/develop}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
EXCEPTIONS_FILE="docs/tech/WYJATKI.md"

if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
  echo "strefa-zakazana: nie znam gałęzi bazowej '$BASE' (zrób git fetch)." >&2
  exit 2
fi

# Forbidden zone, kept in sync with SPEC §2. In bash `case`, `*` also matches `/`.
# globals.css and tailwind.config.ts are shared with the panels; the script can't
# tell panel rules from public ones, so any change there needs an approved exception.
is_forbidden() {
  case "$1" in
    backend/*) return 0 ;;
    frontend/app/panel/*|frontend/app/admin-panel/*|frontend/app/client/*) return 0 ;;
    frontend/components/panel/*|frontend/features/client-*|frontend/contexts/*) return 0 ;;
    frontend/lib/api.ts|frontend/lib/panel-api.ts|frontend/lib/auth-storage.ts|frontend/lib/theme.ts) return 0 ;;
    frontend/hooks/*|frontend/store/*|frontend/stores/*|frontend/types/*) return 0 ;;
    frontend/middleware.ts|frontend/tailwind.config.ts|frontend/app/globals.css) return 0 ;;
  esac
  return 1
}

# Approved exceptions: 2nd column of the table under "## Zatwierdzone wyjątki".
approved_exceptions() {
  [ -f "$EXCEPTIONS_FILE" ] || return 0
  awk -F'|' '
    /^## / { in_table = ($0 ~ /Zatwierdzone/) ; next }
    in_table && /^\|/ {
      f = $3; gsub(/[`[:space:]]/, "", f)
      if (f != "" && f != "Plik" && f !~ /^-+$/ && f != "—") print f
    }' "$EXCEPTIONS_FILE"
}

mapfile -t exceptions < <(approved_exceptions)
mapfile -t changed < <(git diff --name-only "$BASE"...HEAD)

violations=()
for file in "${changed[@]}"; do
  [ -n "$file" ] || continue
  is_forbidden "$file" || continue
  allowed=false
  for ex in "${exceptions[@]+"${exceptions[@]}"}"; do
    [ "$file" = "$ex" ] && allowed=true && break
  done
  $allowed || violations+=("$file")
done

if [ "${#violations[@]}" -gt 0 ]; then
  echo "BŁĄD: zmiany w strefie zakazanej (docs/tech/SPEC.md §2), baza: $BASE" >&2
  printf '  - %s\n' "${violations[@]}" >&2
  echo "Backend i panele zostają bez zmian. Wyjątek tylko za zgodą Krystiana, wpisany w $EXCEPTIONS_FILE." >&2
  exit 1
fi

echo "strefa-zakazana: OK (${#changed[@]} zmienionych plików względem $BASE, wyjątki: ${#exceptions[@]})."
