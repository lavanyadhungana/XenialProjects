#!/usr/bin/env bash
set -uo pipefail
IFS=$'\n\t'

BASE=/opt/app
LOGDIR=$BASE/logs
mkdir -p "$LOGDIR"

# Define “folder|command” entries
SERVICES=(
  "admin_restaurant_website|npm run dev"
  "public_restaurant_website|npm run dev"
  "customer login-website|npm start"
  "restaurant_backend_service|node index.js"
)

echo "Launching services in background; logs → $LOGDIR"

for entry in "${SERVICES[@]}"; do
  IFS='|' read -r folder cmd <<<"$entry"
  APPDIR="$BASE/$folder"
  LOGFILE="$LOGDIR/${folder// /_}.log"

  if [ ! -d "$APPDIR" ]; then
    echo "⚠️  Folder not found: $folder"
    continue
  fi

  # Install dependencies (one-off)
  (
    cd "$APPDIR"
    npm install &>/dev/null || echo "⚠️ npm install failed in $folder"
  )

  # Launch detached with nohup
  nohup bash -lc "cd '$APPDIR' && $cmd" \
    >>"$LOGFILE" 2>&1 &

  echo "→ $folder started, logging to $LOGFILE"
done

echo "All services launched. Exiting now."
exit 0
