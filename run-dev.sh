#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_LOG="${DEV_LOG:-$ROOT_DIR/dev.log}"
NODE_VERSION="${NODE_VERSION:-22.21.1}"

APP_NAME="oscillation"
SWARM_LOG="$ROOT_DIR/logs/dev.log"
SWARM_REGISTRY="$ROOT_DIR/.claude-swarm/registry.json"

info() {
  printf '\033[32m[run-dev]\033[0m %s\n' "$*"
}

fail() {
  printf '\033[31m[run-dev]\033[0m %s\n' "$*" >&2
  exit 1
}

load_nvm() {
  if command -v nvm >/dev/null 2>&1; then
    return
  fi

  if [ -z "${NVM_DIR:-}" ]; then
    export NVM_DIR="$HOME/.nvm"
  fi

  if [ -s "$NVM_DIR/nvm.sh" ]; then
    if [ -z "${MANPATH+x}" ]; then
      export MANPATH=''
    fi
    # shellcheck disable=SC1090
    set +u
    . "$NVM_DIR/nvm.sh"
    set -u
  fi
}

ensure_node() {
  load_nvm

  if command -v nvm >/dev/null 2>&1; then
    nvm install "$NODE_VERSION" >/dev/null
    nvm use "$NODE_VERSION" >/dev/null
    info "Using Node $(node -v) via nvm"
    return
  fi

  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js not detected. Install nvm or Node $NODE_VERSION."
  fi

  local current current_major
  current="$(node -v)"
  current_major="${current#v}"
  current_major="${current_major%%.*}"
  if [ "${current_major}" -lt 22 ]; then
    fail "Node >=22 is required. Found $current."
  fi
  info "Using system Node $current"
}

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    return
  fi

  info "pnpm not found, installing..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable pnpm >/dev/null 2>&1 || npm install -g pnpm >/dev/null
  else
    npm install -g pnpm >/dev/null
  fi

  if ! command -v pnpm >/dev/null 2>&1; then
    fail "Failed to install pnpm. Please install it manually: npm install -g pnpm"
  fi
  info "pnpm installed successfully"
}

ensure_env_file() {
  if [ ! -f "$ROOT_DIR/.env" ]; then
    fail "Missing $ROOT_DIR/.env. Copy .env.example and populate DATABASE_URL and OS_MAPS_API_KEY before running."
  fi
}

port_in_use() {
  local host="$1"
  local port="$2"

  if command -v nc >/dev/null 2>&1; then
    if nc -z "$host" "$port" >/dev/null 2>&1; then
      return 0
    fi
    return 1
  fi

  if command -v lsof >/dev/null 2>&1; then
    if lsof -PiTCP:"$port" -sTCP:LISTEN -n >/dev/null 2>&1; then
      return 0
    fi
  fi

  if command -v netstat >/dev/null 2>&1; then
    if netstat -an 2>/dev/null | grep -i listen | grep -E "[:.]$port[[:space:]]" >/dev/null 2>&1; then
      return 0
    fi
  fi

  return 1
}

check_port() {
  local port="${DEV_PORT:-3002}"
  if port_in_use "localhost" "$port"; then
    fail "Port $port is already in use. Run ./kill-dev.sh first or set DEV_PORT to use a different port."
  fi
}

install_deps() {
  pushd "$ROOT_DIR" >/dev/null
  info "Installing dependencies..."
  pnpm install
  info "Generating Prisma client..."
  pnpm exec prisma generate
  popd >/dev/null
}

push_schema() {
  pushd "$ROOT_DIR" >/dev/null
  info "Pushing schema to PostgreSQL..."
  pnpm exec prisma db push
  popd >/dev/null
}

start_dev() {
  mkdir -p "$(dirname "$SWARM_LOG")"
  : >"$DEV_LOG"
  : >"$SWARM_LOG"

  info "Clearing Next.js cache..."
  rm -rf "$ROOT_DIR/.next" "$ROOT_DIR/node_modules/.cache"

  export NEXT_IGNORE_INCORRECT_LOCKFILE=1

  info "Starting Next.js dev server (logs: $DEV_LOG | $SWARM_LOG)..."
  (
    cd "$ROOT_DIR"
    pnpm dev:direct --port "${DEV_PORT:-3002}"
  ) | tee -a "$DEV_LOG" "$SWARM_LOG" &
  DEV_PID=$!

  swarm_register "$DEV_PID"
}

cleanup() {
  info "Stopping dev server..."
  if [ -n "${DEV_PID:-}" ] && kill -0 "$DEV_PID" >/dev/null 2>&1; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
    wait "$DEV_PID" >/dev/null 2>&1 || true
  fi
  swarm_deregister
}

swarm_register() {
  local pid="$1"
  local port="${DEV_PORT:-3002}"
  mkdir -p "$(dirname "$SWARM_LOG")" "$(dirname "$SWARM_REGISTRY")"
  node -e "
    const fs = require('fs');
    const reg = fs.existsSync('$SWARM_REGISTRY') ? JSON.parse(fs.readFileSync('$SWARM_REGISTRY', 'utf8')) : {};
    reg['$APP_NAME'] = {
      status: 'running',
      pid: $pid,
      port: $port,
      log: '$SWARM_LOG',
      project: '$ROOT_DIR',
      health: 'http://localhost:$port/api/health',
      startedAt: new Date().toISOString(),
      stoppedAt: null
    };
    fs.writeFileSync('$SWARM_REGISTRY', JSON.stringify(reg, null, 2) + '\n');
  "
  info "Registered in swarm registry"
}

swarm_deregister() {
  [ -f "$SWARM_REGISTRY" ] || return 0
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
}

kill_existing() {
  local kill_script="$ROOT_DIR/kill-dev.sh"
  if [ -x "$kill_script" ]; then
    info "Stopping any existing dev processes..."
    "$kill_script" 2>/dev/null || true
    sleep 1
  fi
}

main() {
  ensure_node
  ensure_pnpm
  ensure_env_file
  kill_existing
  install_deps
  push_schema
  start_dev

  trap cleanup EXIT INT TERM
  info "Oscillation dev server -> http://localhost:${DEV_PORT:-3002}"
  info "Press Ctrl+C to stop."
  wait
}

main "$@"
