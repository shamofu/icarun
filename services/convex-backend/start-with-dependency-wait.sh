#!/usr/bin/env bash
set -Eeuo pipefail

wait_pid=""

forward_signal() {
  local signal="$1"
  if [[ -n "$wait_pid" ]]; then
    kill "-$signal" "$wait_pid" 2>/dev/null || true
  fi
}

trap 'forward_signal TERM' TERM
trap 'forward_signal INT' INT

node /convex/wait-for-postgres.mjs &
wait_pid=$!
wait "$wait_pid"
wait_pid=""
trap - TERM INT

cd /convex
exec ./run_backend.sh "$@"
