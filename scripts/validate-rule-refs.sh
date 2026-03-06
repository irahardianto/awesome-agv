#!/usr/bin/env bash
# =============================================================================
# validate-rule-refs.sh
#
# Purpose:
#   Validates all @-references in the .agent/rules/ directory to ensure that
#   every referenced file actually exists. A broken @-reference causes agents
#   to fail silently when loading related principles, resulting in incomplete
#   guidance being applied.
#
# Usage:
#   bash .agent/scripts/validate-rule-refs.sh
#   # Or from any directory:
#   bash /path/to/.agent/scripts/validate-rule-refs.sh
#
# Exit codes:
#   0 — all references are valid
#   1 — one or more broken references found
#
# How it works:
#   1. Scans every .md file in .agent/rules/ for @-references (e.g. @foo.md)
#   2. For each reference, checks that the corresponding file exists in rules/
#   3. Reports all broken references with the source file and line number
# =============================================================================

set -euo pipefail

# ---- Configuration ----------------------------------------------------------

# Resolve the rules directory relative to this script's location.
# Works regardless of which directory the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULES_DIR="$(cd "$SCRIPT_DIR/../.agent/rules" && pwd)"

# ---- Colour helpers ---------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

# ---- State ------------------------------------------------------------------
BROKEN=0      # count of broken references
CHECKED=0     # count of references validated

echo ""
echo "🔍 Validating @-references in: $RULES_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ---- Main validation loop ---------------------------------------------------

# Iterate over every markdown file in the rules directory.
while IFS= read -r -d '' file; do
  # Extract all @-references from the file.
  # Pattern: @ followed by one or more alphanumeric / hyphen chars, then .md
  # Examples: @security-mandate.md, @go-idioms-and-patterns.md
  while IFS= read -r ref; do
    # Strip the leading @ to get just the filename
    filename="${ref:1}"
    target="$RULES_DIR/$filename"
    ((CHECKED++)) || true

    if [[ ! -f "$target" ]]; then
      # Report source file relative to the rules directory for readability
      relative_source="${file#$RULES_DIR/}"
      echo -e "  ${RED}✗ BROKEN${NC}  $relative_source  →  ${YELLOW}$ref${NC}  (file not found)"
      ((BROKEN++)) || true
    fi
  done < <(grep -oP '@[a-zA-Z0-9][a-zA-Z0-9-]*\.md' "$file" 2>/dev/null || true)
done < <(find "$RULES_DIR" -name "*.md" -print0)

# ---- Summary ----------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  References checked : $CHECKED"

if [[ "$BROKEN" -eq 0 ]]; then
  echo -e "  ${GREEN}✅ ALL REFERENCES VALID${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}❌ BROKEN REFERENCES: $BROKEN${NC}"
  echo ""
  echo "  Fix the references above before committing."
  echo ""
  exit 1
fi
