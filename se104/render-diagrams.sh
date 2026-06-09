#!/bin/bash
# Render all Mermaid diagrams with correct font size for A4 report
# ReportFigure (147.2mm display): render 600px, font 18px → ~12pt
# LandscapeFigure (234.7mm display): render 1000px, font 18px → ~12pt

MMDC="/tmp/mmdc-test/node_modules/.bin/mmdc"
PCFG="$(pwd)/puppeteer.json"
SRC="$(pwd)/figures/mermaid-source"
OUT="$(pwd)/figures"

INIT="%%{init: {\"theme\": \"base\", \"themeVariables\": {\"fontSize\": \"18px\"}}}%%"

render() {
    local src="$1"
    local dst="$2"
    local width="$3"
    local scale="${4:-1}"
    local tmpf
    tmpf=$(mktemp /tmp/mmd_XXXXXX.mmd)
    printf '%s\n' "$INIT" > "$tmpf"
    cat "$src" >> "$tmpf"
    echo "  Rendering $dst (${width}px)..."
    "$MMDC" -i "$tmpf" -o "$dst" -p "$PCFG" --width "$width" --scale "$scale" --backgroundColor white 2>&1 | grep -v "^Generating"
    rm -f "$tmpf"
}

echo "=== ReportFigure diagrams (600px → ~12pt) ==="
render "$SRC/ch00-overview/process-overview.mmd"         "$OUT/ch00-overview/process-overview.pdf"           600
render "$SRC/ch02-system-design/system-context.mmd"      "$OUT/ch02-system-design/system-context.pdf"        600
render "$SRC/ch02-system-design/container-diagram.mmd"   "$OUT/ch02-system-design/container-diagram.pdf"     600
render "$SRC/ch02-system-design/layered-architecture.mmd" "$OUT/ch02-system-design/layered-architecture.pdf" 600
render "$SRC/ch06-deployment/local-deployment.mmd"       "$OUT/ch06-deployment/local-deployment.pdf"         600
render "$SRC/ch05-testing/testing-strategy.mmd"          "$OUT/ch05-testing/testing-strategy.pdf"            600

echo "=== LandscapeFigure diagrams (1000px → ~12pt) ==="
render "$SRC/ch01-requirements/usecase-phase1.mmd"       "$OUT/ch01-requirements/usecase-phase1.png"         1000 2
render "$SRC/ch01-requirements/usecase-phase2.mmd"       "$OUT/ch01-requirements/usecase-phase2.png"         1000 2
render "$SRC/ch02-system-design/backend-component.mmd"   "$OUT/ch02-system-design/backend-component.pdf"     1000
render "$SRC/ch03-software-design/erd-phase1.mmd"        "$OUT/ch03-software-design/erd-phase1.pdf"          1000
render "$SRC/ch03-software-design/erd-phase2-delta.mmd"  "$OUT/ch03-software-design/erd-phase2-delta.pdf"    1000

echo "=== Done ==="
