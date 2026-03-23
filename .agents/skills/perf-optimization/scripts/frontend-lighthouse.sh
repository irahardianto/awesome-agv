#!/usr/bin/env bash
# frontend-lighthouse.sh — Robust frontend performance profiling for AI agents.
#
# Two modes:
#   1. `lighthouse` — Run headless Lighthouse with timeout and binary discovery
#   2. `bundle`     — Analyze Vite build output (always works, no Chrome needed)
#
# Usage:
#   frontend-lighthouse.sh lighthouse <url> [preset]
#   frontend-lighthouse.sh bundle <frontend-dir>
#
# Arguments:
#   lighthouse mode:
#     url     — The URL to audit (e.g., http://localhost:4173)
#     preset  — "desktop" or "mobile" (default: mobile)
#
#   bundle mode:
#     frontend-dir — Path to the frontend project root (must have vite.config.*)
#
# Examples:
#   frontend-lighthouse.sh lighthouse http://localhost:4173 desktop
#   frontend-lighthouse.sh bundle ./apps/frontend
#   frontend-lighthouse.sh bundle /home/user/project/apps/frontend
#
# Prerequisites:
#   lighthouse mode: Node.js + Chrome/Chromium (or globally installed lighthouse)
#   bundle mode:     Node.js + Vite project (no Chrome needed)
#
# Robustness features (learned from real-world agent sessions):
#   - Binary discovery: checks PATH, npx, ~/.npm-global/bin, common install locations
#   - Timeout: kills Lighthouse after LIGHTHOUSE_TIMEOUT seconds (default: 120)
#   - Fallback: if Lighthouse fails/hangs, suggests running bundle mode instead
#   - Error reporting disabled: prevents interactive consent prompts
#   - Bundle mode: always works, extracts chunk sizes from vite build output
#
# Output: Structured markdown tables suitable for LLM consumption.

set -euo pipefail

MODE="${1:-}"
LIGHTHOUSE_TIMEOUT="${LIGHTHOUSE_TIMEOUT:-120}"

# ─── Binary Discovery ──────────────────────────────────────────────────────────
# Lighthouse can be installed globally via npm, in ~/.npm-global, or via npx.
# Try multiple locations to find a working binary.
find_lighthouse() {
    # 1. Check PATH
    if command -v lighthouse &>/dev/null; then
        echo "lighthouse"
        return
    fi

    # 2. Check common global install locations
    local candidates=(
        "$HOME/.npm-global/bin/lighthouse"
        "/usr/local/bin/lighthouse"
        "/usr/bin/lighthouse"
    )
    for candidate in "${candidates[@]}"; do
        if [[ -x "$candidate" ]]; then
            echo "$candidate"
            return
        fi
    done

    # 3. Fall back to npx (will auto-install if needed)
    echo "npx --yes lighthouse"
}

# ─── Lighthouse Mode ───────────────────────────────────────────────────────────
run_lighthouse() {
    local url="$1"
    local preset="${2:-mobile}"

    local lh_cmd
    lh_cmd=$(find_lighthouse)

    local preset_flag=""
    if [[ "$preset" == "desktop" ]]; then
        preset_flag="--preset=desktop"
    fi

    local tmpfile
    tmpfile=$(mktemp /tmp/lighthouse-XXXXXX.json)
    trap 'rm -f "$tmpfile"' EXIT

    echo "# Lighthouse Report: ${url} (${preset})"
    echo ""
    echo "Binary: ${lh_cmd}"
    echo "Timeout: ${LIGHTHOUSE_TIMEOUT}s"
    echo ""

    # Run Lighthouse with timeout to prevent infinite hangs in headless environments.
    # --enable-error-reporting=false prevents interactive consent prompts.
    # --no-sandbox is required in containerized/CI environments.
    local lh_pid
    local lh_exit=0

    $lh_cmd "$url" \
        --output=json \
        --output-path="$tmpfile" \
        --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
        --only-categories=performance \
        $preset_flag \
        --enable-error-reporting=false \
        --quiet 2>/dev/null &
    lh_pid=$!

    # Wait with timeout — kill if Lighthouse hangs (common in headless/CI)
    local elapsed=0
    while kill -0 "$lh_pid" 2>/dev/null; do
        if (( elapsed >= LIGHTHOUSE_TIMEOUT )); then
            kill -9 "$lh_pid" 2>/dev/null || true
            wait "$lh_pid" 2>/dev/null || true
            echo "⚠️  Lighthouse timed out after ${LIGHTHOUSE_TIMEOUT}s."
            echo ""
            echo "This usually means Chrome/Chromium is not available or the headless"
            echo "environment doesn't support it. Try bundle mode instead:"
            echo ""
            echo "  $0 bundle <frontend-dir>"
            echo ""
            return 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done

    wait "$lh_pid" || lh_exit=$?

    if [[ $lh_exit -ne 0 ]]; then
        echo "⚠️  Lighthouse exited with code ${lh_exit}."
        echo "Try bundle mode instead: $0 bundle <frontend-dir>"
        return 1
    fi

    if [[ ! -s "$tmpfile" ]]; then
        echo "⚠️  Lighthouse produced no output."
        echo "Try bundle mode instead: $0 bundle <frontend-dir>"
        return 1
    fi

    # Extract metrics into structured markdown
    node -e "
const fs = require('fs');
const r = JSON.parse(fs.readFileSync('$tmpfile', 'utf8'));
const a = r.audits;
const score = Math.round((r.categories.performance.score || 0) * 100);

console.log('## Performance Score: ' + score + '/100');
console.log('');
console.log('## Core Web Vitals');
console.log('');
console.log('| Metric | Value | Score |');
console.log('|---|---|---|');

const vitals = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'interactive',
];

vitals.forEach(k => {
    if (a[k]) {
        const s = a[k].score !== null ? Math.round(a[k].score * 100) : 'N/A';
        console.log('| ' + a[k].title + ' | ' + (a[k].displayValue || 'N/A') + ' | ' + s + ' |');
    }
});

console.log('');
console.log('## Opportunities');
console.log('');

const opportunities = Object.values(a)
    .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.details.overallSavingsMs > 0)
    .sort((x, y) => (y.details.overallSavingsMs || 0) - (x.details.overallSavingsMs || 0));

if (opportunities.length > 0) {
    console.log('| Opportunity | Potential Savings |');
    console.log('|---|---|');
    opportunities.forEach(o => {
        console.log('| ' + o.title + ' | ' + Math.round(o.details.overallSavingsMs) + ' ms |');
    });
} else {
    console.log('No significant opportunities found.');
}

console.log('');
console.log('## Diagnostics');
console.log('');

const diagnostics = Object.values(a)
    .filter(audit => audit.details && audit.details.type === 'table' && audit.score !== null && audit.score < 0.9)
    .slice(0, 10);

if (diagnostics.length > 0) {
    console.log('| Diagnostic | Score |');
    console.log('|---|---|');
    diagnostics.forEach(d => {
        console.log('| ' + d.title + ' | ' + Math.round(d.score * 100) + ' |');
    });
} else {
    console.log('All diagnostics passed.');
}
"
}

# ─── Bundle Analysis Mode ──────────────────────────────────────────────────────
# Always works — no Chrome needed. Extracts chunk sizes from vite build output.
# This was the most useful data source during the FATH frontend session: it
# revealed the 297KB monolithic index chunk and guided all 6 fixes.
run_bundle() {
    local frontend_dir="$1"

    if [[ ! -d "$frontend_dir" ]]; then
        echo "Error: directory '$frontend_dir' does not exist."
        exit 1
    fi

    # Verify it's a Vite project
    if ! ls "$frontend_dir"/vite.config.* &>/dev/null; then
        echo "Error: no vite.config.* found in '$frontend_dir'. Is this a Vite project?"
        exit 1
    fi

    echo "# Bundle Analysis: ${frontend_dir}"
    echo ""
    echo "Running \`vite build\`..."
    echo ""

    local build_output
    build_output=$(cd "$frontend_dir" && npx vite build 2>&1)
    local build_exit=$?

    if [[ $build_exit -ne 0 ]]; then
        echo "⚠️  Build failed (exit code $build_exit):"
        echo ""
        echo '```'
        echo "$build_output"
        echo '```'
        return 1
    fi

    # Parse build output into structured tables
    node -e "
const output = \`$build_output\`;
const lines = output.split('\n');

const jsChunks = [];
const cssChunks = [];

// Parse Vite build output lines like:
// dist/assets/index-BExof8y3.js    20.04 kB │ gzip:  6.90 kB
for (const line of lines) {
    const match = line.match(/dist\/assets\/(.+?)\s+([\d.]+)\s*kB\s*│\s*gzip:\s*([\d.]+)\s*kB/);
    if (match) {
        const [, name, rawKB, gzipKB] = match;
        const entry = { name, raw: parseFloat(rawKB), gzip: parseFloat(gzipKB) };
        if (name.endsWith('.js')) jsChunks.push(entry);
        else if (name.endsWith('.css')) cssChunks.push(entry);
    }
}

// Sort by gzip size descending
jsChunks.sort((a, b) => b.gzip - a.gzip);
cssChunks.sort((a, b) => b.gzip - a.gzip);

const totalJsRaw = jsChunks.reduce((s, c) => s + c.raw, 0);
const totalJsGzip = jsChunks.reduce((s, c) => s + c.gzip, 0);
const totalCssRaw = cssChunks.reduce((s, c) => s + c.raw, 0);
const totalCssGzip = cssChunks.reduce((s, c) => s + c.gzip, 0);

console.log('## JS Chunks (sorted by gzip size)');
console.log('');
console.log('| Chunk | Raw (KB) | Gzip (KB) |');
console.log('|---|---|---|');
jsChunks.forEach(c => {
    // Clean chunk name: remove hash suffix for readability
    const clean = c.name.replace(/-[A-Za-z0-9_-]{8}\\.js$/, '.js');
    console.log('| ' + clean + ' | ' + c.raw.toFixed(2) + ' | ' + c.gzip.toFixed(2) + ' |');
});
console.log('| **Total JS** | **' + totalJsRaw.toFixed(2) + '** | **' + totalJsGzip.toFixed(2) + '** |');

if (cssChunks.length > 0) {
    console.log('');
    console.log('## CSS Chunks');
    console.log('');
    console.log('| Chunk | Raw (KB) | Gzip (KB) |');
    console.log('|---|---|---|');
    cssChunks.forEach(c => {
        const clean = c.name.replace(/-[A-Za-z0-9_-]{8}\\.css$/, '.css');
        console.log('| ' + clean + ' | ' + c.raw.toFixed(2) + ' | ' + c.gzip.toFixed(2) + ' |');
    });
    console.log('| **Total CSS** | **' + totalCssRaw.toFixed(2) + '** | **' + totalCssGzip.toFixed(2) + '** |');
}

console.log('');
console.log('## Summary');
console.log('');
console.log('| Metric | Value |');
console.log('|---|---|');
console.log('| JS chunks | ' + jsChunks.length + ' |');
console.log('| CSS chunks | ' + cssChunks.length + ' |');
console.log('| Total JS (gzip) | ' + totalJsGzip.toFixed(2) + ' KB |');
console.log('| Total CSS (gzip) | ' + totalCssGzip.toFixed(2) + ' KB |');
console.log('| Largest JS chunk | ' + (jsChunks[0]?.name || 'N/A') + ' (' + (jsChunks[0]?.gzip.toFixed(2) || '0') + ' KB gzip) |');

// Flag potential issues
console.log('');
console.log('## Flags');
console.log('');
const bigChunks = jsChunks.filter(c => c.gzip > 50);
if (bigChunks.length > 0) {
    console.log('⚠️  **Large chunks (>50 KB gzip):**');
    bigChunks.forEach(c => {
        console.log('  - ' + c.name + ': ' + c.gzip.toFixed(2) + ' KB gzip');
    });
    console.log('');
    console.log('Consider splitting vendor libraries into separate chunks (see: Artifact Partitioning pattern in SKILL.md).');
} else {
    console.log('✅ No oversized chunks detected.');
}

const vendorChunks = jsChunks.filter(c => c.name.startsWith('vendor-'));
if (vendorChunks.length > 0) {
    console.log('');
    console.log('✅ Vendor chunk splitting detected: ' + vendorChunks.map(c => c.name).join(', '));
} else if (jsChunks.some(c => c.gzip > 40)) {
    console.log('');
    console.log('⚠️  No vendor chunk splitting detected. The largest chunk may contain framework + app code bundled together.');
}
"
}

# ─── Main ──────────────────────────────────────────────────────────────────────

case "${MODE}" in
    lighthouse|lh)
        URL="${2:-}"
        PRESET="${3:-mobile}"
        if [[ -z "$URL" ]]; then
            echo "Usage: $0 lighthouse <url> [desktop|mobile]"
            echo "       $0 bundle <frontend-dir>"
            exit 1
        fi
        run_lighthouse "$URL" "$PRESET"
        ;;
    bundle|build)
        DIR="${2:-}"
        if [[ -z "$DIR" ]]; then
            echo "Usage: $0 bundle <frontend-dir>"
            echo "       $0 lighthouse <url> [desktop|mobile]"
            exit 1
        fi
        run_bundle "$DIR"
        ;;
    *)
        echo "Frontend Performance Profiling Script"
        echo ""
        echo "Usage:"
        echo "  $0 lighthouse <url> [desktop|mobile]  — Run Lighthouse (needs Chrome)"
        echo "  $0 bundle <frontend-dir>              — Analyze Vite build chunks (no Chrome)"
        echo ""
        echo "Examples:"
        echo "  $0 lighthouse http://localhost:4173 desktop"
        echo "  $0 bundle ./apps/frontend"
        echo ""
        echo "Environment:"
        echo "  LIGHTHOUSE_TIMEOUT=120  — Seconds before killing a hung Lighthouse (default: 120)"
        exit 1
        ;;
esac
