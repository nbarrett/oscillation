#!/bin/sh
set -e

echo "Running Prisma migrations..."

# Try to resolve any failed migrations first
node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260201010000_add_multiplayer_tables 2>/dev/null || true

# Now run migrate deploy
node node_modules/prisma/build/index.js migrate deploy

echo "Migrations complete"
