#!/usr/bin/env bash
set -uo pipefail
IFS=$'\n\t'

BASE=/opt/app
LOGDIR=$BASE/logs

# Define services to stop (matching the startup script)
SERVICES=(
  "admin_restaurant_website|npm run dev"
  "public_restaurant_website|npm run dev"
  "customer login-website|npm start"
  "restaurant_backend_service|node index.js"
)

echo "Shutting down services..."

# Function to kill processes by command pattern
kill_by_pattern() {
  local pattern="$1"
  local pids=$(pgrep -f "$pattern" 2>/dev/null)
  
  if [ -n "$pids" ]; then
    echo "  → Killing PIDs: $pids"
    kill $pids 2>/dev/null
    
    # Give processes time to terminate gracefully
    sleep 2
    
    # Force kill if still running
    for pid in $pids; do
      if kill -0 $pid 2>/dev/null; then
        echo "  → Force killing PID: $pid"
        kill -9 $pid 2>/dev/null
      fi
    done
  else
    echo "  → No processes found"
  fi
}

# Stop each service
for entry in "${SERVICES[@]}"; do
  IFS='|' read -r folder cmd <<<"$entry"
  APPDIR="$BASE/$folder"
  
  echo "Stopping: $folder"
  
  # Kill by matching the app directory and command
  kill_by_pattern "$APPDIR.*$cmd"
done

# Also kill any remaining node processes in the app directories
echo -e "\nCleaning up any remaining Node.js processes..."
for entry in "${SERVICES[@]}"; do
  IFS='|' read -r folder cmd <<<"$entry"
  APPDIR="$BASE/$folder"
  
  # Kill any node/npm processes running from this directory
  kill_by_pattern "node.*$APPDIR"
  kill_by_pattern "npm.*$APPDIR"
done

echo -e "\nShutdown complete."
echo "Check logs in $LOGDIR for any errors."

exit 0