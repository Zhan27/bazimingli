#!/usr/bin/env bash
# Rebuild both HTML files; build.mjs checks syntax, secrets and consistency.
set -euo pipefail
cd "$(dirname "$0")"
node scripts/build.mjs
