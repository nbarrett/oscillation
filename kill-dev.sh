#!/bin/bash

APP_NAME="oscillation"
SWARM_REGISTRY="$(dirname "$0")/.claude-swarm/registry.json"

echo "Stopping Oscillation development server..."

# Kill Next.js dev processes
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null

# Kill any process on the dev port (default 3000)
DEV_PORT="${DEV_PORT:-3002}"
lsof -ti:"$DEV_PORT" 2>/dev/null | xargs kill -9 2>/dev/null

if [ -f "$SWARM_REGISTRY" ] && command -v node >/dev/null 2>&1; then
  node -e "
    const fs = require('fs');
    const reg = JSON.parse(fs.readFileSync('$SWARM_REGISTRY', 'utf8'));
    if (reg['$APP_NAME']) {
      reg['$APP_NAME'].status = 'stopped';
      reg['$APP_NAME'].stoppedAt = new Date().toISOString();
      reg['$APP_NAME'].pid = null;
    }
    fs.writeFileSync('$SWARM_REGISTRY', JSON.stringify(reg, null, 2) + '\n');
  " 2>/dev/null || true
fi

echo "All development processes stopped"
echo ""
echo "Tip: You can restart with ./run-dev.sh"
