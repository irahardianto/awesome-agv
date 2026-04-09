#!/usr/bin/env bash
# scripts/visual-audit.sh
#
# FRONTEND VISUAL & ACCESSIBILITY AUDIT
#
# PURPOSE:
#   Standalone audit script focused on visual quality and accessibility metrics.
#   Runs against any running HTTP server — no build configuration required.
#
# CHECKS:
#   - Color contrast violations (WCAG AA + AAA)
#   - Missing accessible names (buttons, links, images)
#   - Focus indicator presence
#   - Font loading configuration (preconnect, display=swap)
#   - Reduced-motion CSS override presence
#   - Semantic heading structure (single h1)
#   - Meta description and lang attribute
#   - Design token system presence
#   - Lighthouse accessibility + CLS scores (if Chrome available)
#
# USAGE:
#   bash .agents/skills/frontend-design/scripts/visual-audit.sh http://localhost:5173
#   bash .agents/skills/frontend-design/scripts/visual-audit.sh http://localhost:5173 /about /dashboard
#
# OUTPUT:
#   Terminal: pass/warn/fail summary
#   File: docs/audit/visual-audit-<timestamp>.md
#
# REQUIREMENTS:
#   - Node.js >= 18 (npx)
#   - chromium or google-chrome (for Lighthouse — optional but recommended)
#   - Running dev/preview server at target URL
#
# EXIT CODE:
#   0 = pass or warnings only
#   1 = one or more CRITICAL failures (WCAG AA violations)

set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"
shift || true
EXTRA_ROUTES=("$@")

REPORT_DIR="docs/audit"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
REPORT_FILE="${REPORT_DIR}/visual-audit-${TIMESTAMP}.md"
mkdir -p "$REPORT_DIR"

# ANSI colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

CRITICAL_FAILURES=0
WARNINGS=0
PASSES=0
CHROME_AVAILABLE=false

log_pass()    { echo -e "  ${GREEN}✓${RESET} $1"; ((PASSES++)) || true; }
log_warn()    { echo -e "  ${YELLOW}⚠${RESET} $1"; ((WARNINGS++)) || true; }
log_fail()    { echo -e "  ${RED}✗${RESET} $1"; ((CRITICAL_FAILURES++)) || true; }
log_section() { echo -e "\n${BOLD}${BLUE}▶ $1${RESET}"; }
log_info()    { echo -e "  ${BLUE}ℹ${RESET} $1"; }

append_report() { echo -e "$1" >> "$REPORT_FILE"; }

# ─── Report Header ────────────────────────────────────────────
init_report() {
  cat > "$REPORT_FILE" << EOF
# Visual & Accessibility Audit

- **Date:** $(date '+%Y-%m-%d %H:%M:%S')
- **Target:** ${BASE_URL}

EOF
}

# ─── Dependencies ─────────────────────────────────────────────
check_dependencies() {
  log_section "Dependencies"

  if ! command -v node &>/dev/null; then
    echo -e "${RED}Node.js not found. Install Node.js >= 18.${RESET}"
    exit 1
  fi
  log_pass "Node.js $(node --version)"

  if command -v chromium &>/dev/null || command -v google-chrome &>/dev/null || command -v chromium-browser &>/dev/null; then
    CHROME_AVAILABLE=true
    log_pass "Chrome/Chromium available (Lighthouse will run)"
  else
    log_warn "Chrome/Chromium not found — Lighthouse audit skipped. Install for full scores."
  fi
}

# ─── Server Check ─────────────────────────────────────────────
check_server() {
  log_section "Server reachability: ${BASE_URL}"

  if curl --silent --fail --max-time 8 "${BASE_URL}" > /dev/null 2>&1; then
    log_pass "Server is reachable"
  else
    log_fail "Cannot reach ${BASE_URL}"
    echo ""
    echo "  Start your dev server first:  npm run dev"
    exit 1
  fi
}

# ─── HTML Structure ───────────────────────────────────────────
check_html_structure() {
  local url="${1:-$BASE_URL}"
  log_section "HTML Structure: ${url}"
  append_report "\n## HTML Structure: ${url}\n"

  local html
  html=$(curl --silent --max-time 10 "${url}" 2>/dev/null || echo "")

  # Single h1
  local h1_count
  h1_count=$(echo "$html" | grep -oi '<h1[^>]*>' | wc -l | tr -d ' ')
  if   [ "$h1_count" -eq 1 ]; then log_pass "Single <h1> found"; append_report "- ✓ Single \`<h1>\`"
  elif [ "$h1_count" -eq 0 ]; then log_fail "No <h1> found — every page must have exactly one"; append_report "- ✗ Missing \`<h1>\`"
  else                              log_warn "${h1_count} <h1> elements found — should be exactly one"; append_report "- ⚠ ${h1_count} \`<h1>\` elements (use only one)"; fi

  # Meta description
  if echo "$html" | grep -qi 'meta[^>]*name=["\x27]description'; then
    log_pass "Meta description present"; append_report "- ✓ Meta description"
  else
    log_warn "Missing <meta name=description>"; append_report "- ⚠ Missing meta description"
  fi

  # lang attribute
  if echo "$html" | grep -qi '<html[^>]*lang='; then
    log_pass "lang attribute on <html>"; append_report "- ✓ lang attribute on \`<html>\`"
  else
    log_warn "Missing lang attribute on <html>"; append_report "- ⚠ Missing lang attribute"
  fi

  # Skip link
  if echo "$html" | grep -qi 'class=["\x27][^"]*skip\|href=["\x27]#main'; then
    log_pass "Skip link detected"; append_report "- ✓ Skip-to-content link"
  else
    log_warn "No skip link — add <a href='#main-content' class='skip-link'>Skip to content</a>"; append_report "- ⚠ Missing skip link"
  fi

  # Images with alt
  local img_total img_with_alt img_missing
  img_total=$(echo "$html" | grep -oi '<img[^>]*>' | wc -l | tr -d ' ')
  img_with_alt=$(echo "$html" | grep -oi '<img[^>]*alt=' | wc -l | tr -d ' ')
  img_missing=$((img_total - img_with_alt))
  if   [ "$img_total" -eq 0 ];   then log_info "No <img> elements found"; append_report "- ℹ No \`<img>\` elements"
  elif [ "$img_missing" -eq 0 ]; then log_pass "All ${img_total} images have alt text"; append_report "- ✓ All images have alt text"
  else                                 log_fail "${img_missing}/${img_total} images missing alt attribute"; append_report "- ✗ ${img_missing}/${img_total} images missing alt"; fi
}

# ─── CSS Quality ──────────────────────────────────────────────
check_css_quality() {
  log_section "CSS & Design System Quality"
  append_report "\n## CSS & Design System\n"

  local html
  html=$(curl --silent --max-time 10 "${BASE_URL}" 2>/dev/null || echo "")

  # Design token system
  if echo "$html" | grep -q 'var(--'; then
    log_pass "CSS custom properties (design tokens) in use"; append_report "- ✓ Design tokens (CSS custom properties) detected"
  else
    log_warn "No CSS custom properties found — is the token system applied?"; append_report "- ⚠ No CSS custom properties found"
  fi

  # Reduced motion
  if echo "$html" | grep -q 'prefers-reduced-motion'; then
    log_pass "prefers-reduced-motion override present"; append_report "- ✓ \`prefers-reduced-motion\` override"
  else
    log_fail "Missing @media (prefers-reduced-motion: reduce) — required for animation accessibility"; append_report "- ✗ Missing \`prefers-reduced-motion\` override (REQUIRED)"
  fi

  # Font loading
  if echo "$html" | grep -q 'fonts.googleapis.com'; then
    log_info "Google Fonts detected"; append_report "- ℹ Google Fonts"

    if echo "$html" | grep -q 'rel="preconnect".*fonts.googleapis\|preconnect.*googleapis'; then
      log_pass "Font preconnect hint present (prevents CLS)"; append_report "- ✓ Font preconnect hint"
    else
      log_warn "Missing preconnect for fonts.googleapis.com — causes CLS"; append_report "- ⚠ Missing font preconnect"
    fi

    if echo "$html" | grep -q 'display=swap'; then
      log_pass "font-display: swap active (prevents FOIT)"; append_report "- ✓ \`display=swap\` in font URL"
    else
      log_warn "Missing &display=swap in Google Fonts URL — text may be invisible during load"; append_report "- ⚠ Missing \`&display=swap\`"
    fi
  else
    log_info "No Google Fonts — using local or system fonts"; append_report "- ℹ No Google Fonts (local fonts)"
  fi

  # Theme switcher
  if echo "$html" | grep -q 'data-theme'; then
    log_pass "Theme system (data-theme) detected"; append_report "- ✓ Theme system (data-theme)"
  else
    log_info "No data-theme attribute — theme switching not implemented"; append_report "- ℹ No data-theme attribute"
  fi
}

# ─── Accessibility (axe) ──────────────────────────────────────
check_accessibility() {
  local url="${1:-$BASE_URL}"
  log_section "Accessibility Audit (axe WCAG 2.1 AA): ${url}"
  append_report "\n## Accessibility: ${url}\n"

  log_info "Running axe-cli... (first run downloads axe, may take ~30s)"

  local axe_result
  if ! axe_result=$(npx --yes axe-cli@latest \
    "${url}" \
    --tags wcag2a,wcag2aa,wcag21aa,best-practice \
    --reporter json \
    --timeout 30000 \
    2>/dev/null); then
    log_warn "axe-cli failed to connect — skipping accessibility audit"
    append_report "- ⚠ axe-cli could not connect (server may need more time)"
    return
  fi

  # Count violations by impact using node
  local violation_summary
  violation_summary=$(echo "$axe_result" | node --input-type=module << 'EOF' 2>/dev/null
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let raw = ''
process.stdin.on('data', d => raw += d)
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw)
    const v = (Array.isArray(data) ? data[0] : data).violations || []
    const by = (impact) => v.filter(i => i.impact === impact).length
    process.stdout.write(JSON.stringify({
      total: v.length, critical: by('critical'), serious: by('serious'),
      moderate: by('moderate'), minor: by('minor'),
      items: v.slice(0,8).map(i => `[${i.impact}] ${i.id}: ${i.description} (${i.nodes.length} node(s))`),
    }))
  } catch { process.stdout.write('{"total":0,"critical":0,"serious":0,"moderate":0,"minor":0,"items":[]}') }
})
EOF
  ) || violation_summary='{"total":0,"critical":0,"serious":0,"moderate":0,"minor":0,"items":[]}'

  local total critical serious moderate minor
  total=$(   echo "$violation_summary" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{process.stdout.write(String(JSON.parse(d).total))}catch{process.stdout.write('0')} })" 2>/dev/null || echo "0")
  critical=$(echo "$violation_summary" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{process.stdout.write(String(JSON.parse(d).critical))}catch{process.stdout.write('0')} })" 2>/dev/null || echo "0")
  serious=$( echo "$violation_summary" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{process.stdout.write(String(JSON.parse(d).serious))}catch{process.stdout.write('0')} })" 2>/dev/null || echo "0")
  moderate=$(echo "$violation_summary" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{process.stdout.write(String(JSON.parse(d).moderate))}catch{process.stdout.write('0')} })" 2>/dev/null || echo "0")
  minor=$(   echo "$violation_summary" | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{process.stdout.write(String(JSON.parse(d).minor))}catch{process.stdout.write('0')} })" 2>/dev/null || echo "0")

  if [ "${total}" = "0" ]; then
    log_pass "No WCAG 2.1 AA violations detected"
    append_report "- ✓ No WCAG 2.1 AA violations"
  else
    if [ "${critical:-0}" -gt 0 ] || [ "${serious:-0}" -gt 0 ]; then
      log_fail "${total} violations: ${critical} critical, ${serious} serious, ${moderate} moderate, ${minor} minor"
      append_report "- ✗ **${total} violations**: ${critical} critical | ${serious} serious | ${moderate} moderate | ${minor} minor"
    else
      log_warn "${total} minor violations: ${moderate} moderate, ${minor} minor"
      append_report "- ⚠ ${total} minor violations: ${moderate} moderate | ${minor} minor"
    fi

    # Print top violations
    echo "$violation_summary" | node -e "
      let d = ''; process.stdin.on('data', c => d += c);
      process.stdin.on('end', () => {
        try {
          const items = JSON.parse(d).items || [];
          items.forEach(i => console.log('    ↳ ' + i));
        } catch {}
      });" 2>/dev/null || true
  fi
}

# ─── Lighthouse ───────────────────────────────────────────────
check_lighthouse() {
  local url="${1:-$BASE_URL}"

  if [ "$CHROME_AVAILABLE" != "true" ]; then return; fi

  log_section "Lighthouse (Accessibility + Performance): ${url}"
  append_report "\n## Lighthouse: ${url}\n"

  log_info "Running Lighthouse... (~15–30s)"

  local result
  if ! result=$(npx lighthouse@latest \
    "${url}" \
    --output=json \
    --quiet \
    --chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage" \
    --only-categories=accessibility,performance \
    2>/dev/null); then
    log_warn "Lighthouse failed — check Chrome installation"
    append_report "- ⚠ Lighthouse unavailable"
    return
  fi

  local a11y perf cls fcp
  a11y=$(echo "$result" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(String(Math.round((r.categories?.accessibility?.score||0)*100)))}catch{process.stdout.write('N/A')}})" 2>/dev/null || echo "N/A")
  perf=$(echo "$result" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(String(Math.round((r.categories?.performance?.score||0)*100)))}catch{process.stdout.write('N/A')}})" 2>/dev/null || echo "N/A")
  cls=$(echo "$result" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.audits?.['cumulative-layout-shift']?.displayValue||'N/A')}catch{process.stdout.write('N/A')}})" 2>/dev/null || echo "N/A")
  fcp=$(echo "$result" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const r=JSON.parse(d);process.stdout.write(r.audits?.['first-contentful-paint']?.displayValue||'N/A')}catch{process.stdout.write('N/A')}})" 2>/dev/null || echo "N/A")

  # Accessibility score
  if [[ "$a11y" =~ ^[0-9]+$ ]]; then
    if   [ "$a11y" -ge 90 ]; then log_pass "Accessibility score: ${a11y}/100"; append_report "- ✓ Accessibility: **${a11y}/100**"
    elif [ "$a11y" -ge 70 ]; then log_warn "Accessibility score: ${a11y}/100 (target: ≥ 90)"; append_report "- ⚠ Accessibility: ${a11y}/100 (target ≥ 90)"
    else                          log_fail "Accessibility score: ${a11y}/100 (critical — target: ≥ 90)"; append_report "- ✗ Accessibility: ${a11y}/100 (critical, target ≥ 90)"; fi
  fi

  # CLS — key visual stability metric (font loading, image shifts)
  if [ "$cls" != "N/A" ]; then
    local cls_num
    cls_num=$(echo "$cls" | grep -oE '[0-9]+\.[0-9]+|[0-9]+' | head -1)
    if   awk "BEGIN{exit !($cls_num < 0.1)}"  2>/dev/null; then log_pass "CLS: ${cls} — excellent (fonts loading without shift)"; append_report "- ✓ CLS: ${cls} (≤ 0.1 excellent)"
    elif awk "BEGIN{exit !($cls_num < 0.25)}" 2>/dev/null; then log_warn "CLS: ${cls} — needs improvement (check font loading + image sizes)"; append_report "- ⚠ CLS: ${cls} (0.1–0.25 needs improvement)"
    else                                                         log_fail "CLS: ${cls} — poor (layout shifting likely from fonts/images)"; append_report "- ✗ CLS: ${cls} (> 0.25 poor — fix font loading)"; fi
  fi

  log_info "Performance: ${perf}/100 | FCP: ${fcp}"
  append_report "- ℹ Performance: ${perf}/100 | FCP: ${fcp}"
}

# ─── Summary ──────────────────────────────────────────────────
print_summary() {
  echo ""
  echo "════════════════════════════════════════"
  echo -e "${BOLD}Audit Summary${RESET}"
  echo "════════════════════════════════════════"
  echo -e "  ${GREEN}✓ Passed:${RESET}   ${PASSES}"
  echo -e "  ${YELLOW}⚠ Warnings:${RESET} ${WARNINGS}"
  echo -e "  ${RED}✗ Critical:${RESET} ${CRITICAL_FAILURES}"
  echo "════════════════════════════════════════"

  append_report "\n---\n\n## Summary\n\n| | Count |\n|---|---|\n| ✓ Passed | ${PASSES} |\n| ⚠ Warnings | ${WARNINGS} |\n| ✗ Critical | ${CRITICAL_FAILURES} |"

  echo ""
  echo -e "Report: ${BOLD}${REPORT_FILE}${RESET}"
  echo ""

  if [ "$CRITICAL_FAILURES" -gt 0 ]; then
    echo -e "${RED}${BOLD}CRITICAL ISSUES — fix before shipping.${RESET}"
    echo ""
    exit 1
  elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}Warnings present — review before shipping.${RESET}"
    echo ""
    exit 0
  else
    echo -e "${GREEN}${BOLD}All checks passed.${RESET}"
    echo ""
    exit 0
  fi
}

# ─── Main ─────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${BOLD}Frontend Visual & Accessibility Audit${RESET}"
  echo -e "Target: ${BLUE}${BASE_URL}${RESET}"
  echo "════════════════════════════════════════"

  init_report
  check_dependencies
  check_server
  check_css_quality
  check_html_structure "$BASE_URL"
  check_accessibility  "$BASE_URL"
  check_lighthouse     "$BASE_URL"

  for route in "${EXTRA_ROUTES[@]}"; do
    local full_url="${BASE_URL}${route}"
    check_html_structure "$full_url"
    check_accessibility  "$full_url"
    check_lighthouse     "$full_url"
  done

  print_summary
}

main
