#!/bin/sh
set -eu

COMMAND="${1:-}"
PROJECT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
CODEX_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if [ -n "${NODE_BIN:-}" ]; then
  NODE="$NODE_BIN"
elif command -v node >/dev/null 2>&1; then
  NODE="$(command -v node)"
elif [ -x "$CODEX_NODE" ]; then
  NODE="$CODEX_NODE"
else
  echo "Node.js 20+ est requis. Installe Node.js ou definis NODE_BIN=/chemin/vers/node." >&2
  exit 1
fi

cd "$PROJECT_DIR"

case "$COMMAND" in
  dev)
    exec "$NODE" scripts/dev-server.mjs
    ;;
  build)
    NODE_ENV=production exec "$NODE" scripts/build-static.mjs
    ;;
  preview)
    NODE_ENV=production "$NODE" scripts/build-static.mjs
    PORT="${PORT:-4173}" exec "$NODE" scripts/dev-server.mjs --public
    ;;
  check)
    NODE_ENV=production exec "$NODE" scripts/doctor.mjs
    ;;
  *)
    echo "Usage: sh scripts/run.sh dev|build|preview|check" >&2
    exit 1
    ;;
esac
