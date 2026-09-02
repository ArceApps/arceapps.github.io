#!/usr/bin/env bash
set -euo pipefail

# This script creates a clean mirror of the web-portfolio codebase
# for public release on arceapps.github.io, excluding internal docs,
# agent configs, specifications, and prompt files.

SOURCE_DIR="${1:-.}"
DEST_DIR="${2:-/tmp/public-mirror}"

echo "Preparing clean mirror from $SOURCE_DIR to $DEST_DIR..."

rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

# Rsync files while excluding internal docs and agent metadata
rsync -av --delete \
  --exclude='.git' \
  --exclude='.github/workflows/sync-to-public.yml' \
  --exclude='.opencode' \
  --exclude='agents' \
  --exclude='docs' \
  --exclude='openspec' \
  --exclude='AGENTS.md' \
  --exclude='BUGS.md' \
  --exclude='AUDIT_WEB_*.md' \
  --exclude='CONTEXT.md' \
  --exclude='design.md' \
  --exclude='test-results' \
  --exclude='.astro' \
  --exclude='dist' \
  --exclude='node_modules' \
  "$SOURCE_DIR/" "$DEST_DIR/"

echo "Mirror prepared successfully at $DEST_DIR."
