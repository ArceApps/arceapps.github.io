#!/usr/bin/env bash
# Render all .mmd files in public/images/diagrams/ to SVG
# Requires: @mermaid-js/mermaid-cli (installed as devDependency)
set -euo pipefail

DIAGRAMS_DIR="public/images/diagrams"

if [ ! -d "$DIAGRAMS_DIR" ]; then
  echo "No diagrams directory found, skipping."
  exit 0
fi

echo "🔧 Rendering Mermaid diagrams..."
rendered=0
failed=0

for mmd_file in "$DIAGRAMS_DIR"/*.mmd; do
  [ -f "$mmd_file" ] || continue
  svg_file="${mmd_file%.mmd}.svg"
  
  # Skip if SVG is newer than source
  if [ -f "$svg_file" ] && [ "$svg_file" -nt "$mmd_file" ]; then
    echo "  ⏭️  $svg_file (up to date)"
    continue
  fi
  
  if npx mmdc -i "$mmd_file" -o "$svg_file" -b transparent -t dark --cssFile "" 2>/dev/null; then
    echo "  ✅ $svg_file"
    rendered=$((rendered + 1))
  else
    echo "  ❌ Failed: $mmd_file"
    failed=$((failed + 1))
  fi
done

echo "📊 Diagrams rendered: $rendered, failed: $failed"
