#!/bin/sh
set -e

echo "Running Prisma migrations..."

if command -v prisma >/dev/null 2>&1; then
  PRISMA="prisma"
else
  PRISMA="node node_modules/prisma/build/index.js"
fi

$PRISMA migrate resolve --rolled-back 20260201010000_add_multiplayer_tables 2>/dev/null || true
$PRISMA migrate deploy

echo "Migrations complete"
