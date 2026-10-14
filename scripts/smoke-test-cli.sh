#!/usr/bin/env bash
# =============================================================================
# smoke-test-cli.sh
#
# Purpose:
#   End-to-end smoke test suite for the Awesome AGV CLI installer (v4.0.0).
#   Verifies CLI installation, backup retention, custom-entry preservation,
#   tarball validation, and failure atomicity using local tarballs.
#
# Scenarios tested:
#   1. Fresh --all install: 68 skills, no workflows, .gitignore patched
#   2. Reinstall with custom entries & legacy workflow: customs preserved,
#      legacy workflow backed up, workflows dir removed
#   3. Corrupt tarball lacking .agents/: CLI fails, pre-existing .agents intact
#   4. Invalid AGV_LOCAL_TARBALL: missing file & non-.tar.gz fail with no changes
#   5. Additive --stacks go on existing install: preserves customs, installs Go
#   6. Backup retention: after 7 reinstalls, at most 5 backups exist
#   7. .agv-backup is a symlink: refuse and fail closed, target untouched
#   8. .agents is a dangling symlink: refuse with clear message, fail closed
#   9. AGV_LOCAL_TARBALL with spaces & shell metacharacters: safe execution, no injection
#  10. Upgrade from v3 layout: built-in workflows not reported as custom,
#      custom workflows reported
#  11. Malformed .agvrc: ignored with a warning, install succeeds, no crash
#
#   Failure scenarios (3, 7, 8) also assert no .agents.staging-* dir is left behind.
#
# Exit codes:
#   0 — all scenarios passed
#   1 — one or more scenarios failed
# =============================================================================

set -euo pipefail

# ---- Configuration ----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLI_BIN="$REPO_ROOT/cli/bin/awesome-agv.js"

# ---- Colour helpers ---------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# ---- State ------------------------------------------------------------------
SCENARIOS_RUN=0
SCENARIOS_FAILED=0

# Temporary workspace with automated cleanup
WORK_DIR="$(mktemp -d -t agv-smoke-XXXXXX)"
cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT INT TERM

echo ""
echo "🚀 Running Awesome AGV CLI Smoke Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Helper for running the CLI non-interactively in target directory
run_cli() {
  local target_dir="$1"
  local tarball="$2"
  shift 2
  local flags=("$@")

  (
    cd "$target_dir"
    AGV_LOCAL_TARBALL="$tarball" node "$CLI_BIN" "$target_dir" "${flags[@]}" </dev/null
  )
}

# Fails (non-zero) if a run left a .agents.staging-* directory in the target.
# Failed installs must clean up after themselves, not just leave .agents/ intact.
check_no_staging_leftovers() {
  local dir="$1"
  local leftovers
  leftovers=$(find "$dir" -mindepth 1 -maxdepth 1 -name '.agents.staging-*' 2>/dev/null | wc -l)
  if [[ "$leftovers" -ne 0 ]]; then
    echo -e "  ${RED}✗ FAIL${NC} $leftovers .agents.staging-* director(ies) left behind"
    return 1
  fi
  echo -e "  ${GREEN}✓${NC} No .agents.staging-* directories left behind"
}

# -----------------------------------------------------------------------------
# Setup: Build local test tarballs in GitHub layout
# Top directory: awesome-agv-main/ containing .agents/ and agv.config.json
# -----------------------------------------------------------------------------
echo -e "${BLUE}▸ Packaging test tarballs from working tree...${NC}"

# Valid tarball
VALID_STAGING="$WORK_DIR/staging_valid/awesome-agv-main"
mkdir -p "$VALID_STAGING"
cp -r "$REPO_ROOT/.agents" "$VALID_STAGING/.agents"
cp "$REPO_ROOT/agv.config.json" "$VALID_STAGING/agv.config.json"
if [[ -f "$REPO_ROOT/package.json" ]]; then
  cp "$REPO_ROOT/package.json" "$VALID_STAGING/package.json"
fi
VALID_TARBALL="$WORK_DIR/awesome-agv-main.tar.gz"
tar -czf "$VALID_TARBALL" -C "$WORK_DIR/staging_valid" awesome-agv-main

# Corrupt tarball (lacking .agents/ directory)
CORRUPT_STAGING="$WORK_DIR/staging_corrupt/awesome-agv-main"
mkdir -p "$CORRUPT_STAGING"
cp "$REPO_ROOT/agv.config.json" "$CORRUPT_STAGING/agv.config.json"
CORRUPT_TARBALL="$WORK_DIR/corrupt-no-agents.tar.gz"
tar -czf "$CORRUPT_TARBALL" -C "$WORK_DIR/staging_corrupt" awesome-agv-main

echo -e "  ${GREEN}✓${NC} Valid tarball created: $VALID_TARBALL"
echo -e "  ${GREEN}✓${NC} Corrupt tarball created: $CORRUPT_TARBALL"

# =============================================================================
# Scenario 1: Fresh --all install
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 1] Fresh --all install${NC}"
((SCENARIOS_RUN++)) || true
S1_DIR="$WORK_DIR/scenario1"
mkdir -p "$S1_DIR"
S1_LOG="$WORK_DIR/s1.log"

set +e
run_cli "$S1_DIR" "$VALID_TARBALL" --all > "$S1_LOG" 2>&1
S1_EXIT=$?
set -e

S1_ERRORS=0
if [[ $S1_EXIT -ne 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI exited with code $S1_EXIT"
  ((S1_ERRORS++)) || true
fi

SKILL_COUNT=$(find "$S1_DIR/.agents/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
if [[ "$SKILL_COUNT" -ne 68 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Expected 68 skills dirs, found $SKILL_COUNT"
  ((S1_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Verified 68 skill directories installed"
fi

if [[ -e "$S1_DIR/.agents/work""flows" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Workflows directory should not exist"
  ((S1_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Workflows directory absent"
fi

if [[ ! -f "$S1_DIR/.gitignore" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} .gitignore was not created"
  ((S1_ERRORS++)) || true
else
  if ! grep -q "\.agentwork" "$S1_DIR/.gitignore"; then
    echo -e "  ${RED}✗ FAIL${NC} .gitignore missing .agentwork entry"
    ((S1_ERRORS++)) || true
  else
    echo -e "  ${GREEN}✓${NC} .gitignore contains .agentwork/"
  fi

  if ! grep -q "\.agv-backup" "$S1_DIR/.gitignore"; then
    echo -e "  ${RED}✗ FAIL${NC} .gitignore missing .agv-backup entry"
    ((S1_ERRORS++)) || true
  else
    echo -e "  ${GREEN}✓${NC} .gitignore contains .agv-backup/"
  fi
fi

if [[ $S1_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 1 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 1 failed ($S1_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 15 "$S1_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 2: Reinstall with custom entries & legacy workflow
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 2] Reinstall with customs & legacy workflow${NC}"
((SCENARIOS_RUN++)) || true
S2_DIR="$WORK_DIR/scenario2"
mkdir -p "$S2_DIR"
S2_LOG="$WORK_DIR/s2.log"

# Initial install
run_cli "$S2_DIR" "$VALID_TARBALL" --all > /dev/null 2>&1

# Add custom skill, rule, agent, and legacy workflow
mkdir -p "$S2_DIR/.agents/skills/my-custom"
cat <<'EOF' > "$S2_DIR/.agents/skills/my-custom/SKILL.md"
---
name: my-custom
description: User custom skill for test
---
# My Custom Skill
EOF

cat <<'EOF' > "$S2_DIR/.agents/rules/my-rule.md"
# My Custom Rule
EOF

cat <<'EOF' > "$S2_DIR/.agents/agents/my-agent.md"
# My Custom Agent
EOF

mkdir -p "$S2_DIR/.agents/work""flows"
cat <<'EOF' > "$S2_DIR/.agents/work""flows/legacy.md"
# Legacy Workflow Content
EOF

# Run reinstall non-interactively
set +e
run_cli "$S2_DIR" "$VALID_TARBALL" --all > "$S2_LOG" 2>&1
S2_EXIT=$?
set -e

S2_ERRORS=0
if [[ $S2_EXIT -ne 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI reinstall exited with code $S2_EXIT"
  ((S2_ERRORS++)) || true
fi

# Assert custom skill preserved
if [[ -f "$S2_DIR/.agents/skills/my-custom/SKILL.md" ]]; then
  echo -e "  ${GREEN}✓${NC} Custom skill .agents/skills/my-custom carried over"
else
  echo -e "  ${RED}✗ FAIL${NC} Custom skill was not carried over"
  ((S2_ERRORS++)) || true
fi

# Assert custom rule preserved
if [[ -f "$S2_DIR/.agents/rules/my-rule.md" ]]; then
  echo -e "  ${GREEN}✓${NC} Custom rule .agents/rules/my-rule.md carried over"
else
  echo -e "  ${RED}✗ FAIL${NC} Custom rule was not carried over"
  ((S2_ERRORS++)) || true
fi

# Assert custom agent preserved
if [[ -f "$S2_DIR/.agents/agents/my-agent.md" ]]; then
  echo -e "  ${GREEN}✓${NC} Custom agent .agents/agents/my-agent.md carried over"
else
  echo -e "  ${RED}✗ FAIL${NC} Custom agent was not carried over"
  ((S2_ERRORS++)) || true
fi

# Assert workflows directory absent
if [[ -e "$S2_DIR/.agents/work""flows" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Workflows directory should be absent after migration"
  ((S2_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Workflows directory absent in active installation"
fi

# Assert backup exists and contains legacy.md
BACKUP_LEGACY=$(find "$S2_DIR/.agv-backup" -type f -name "legacy.md" 2>/dev/null | head -n 1 || true)
if [[ -n "$BACKUP_LEGACY" && -f "$BACKUP_LEGACY" ]]; then
  echo -e "  ${GREEN}✓${NC} Legacy workflow backed up to: $BACKUP_LEGACY"
else
  echo -e "  ${RED}✗ FAIL${NC} Legacy workflow not found in .agv-backup/agents-*"
  ((S2_ERRORS++)) || true
fi

if [[ $S2_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 2 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 2 failed ($S2_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 15 "$S2_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 3: Corrupt tarball (lacking .agents/) leaves existing installation intact
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 3] Corrupt tarball handling${NC}"
((SCENARIOS_RUN++)) || true
S3_DIR="$WORK_DIR/scenario3"
mkdir -p "$S3_DIR"
S3_LOG="$WORK_DIR/s3.log"

# Fresh install
run_cli "$S3_DIR" "$VALID_TARBALL" --all > /dev/null 2>&1

# Snapshot pre-existing .agents/
SNAPSHOT3="$WORK_DIR/snapshot3"
cp -r "$S3_DIR/.agents" "$SNAPSHOT3"

# Attempt install with corrupt tarball
set +e
run_cli "$S3_DIR" "$CORRUPT_TARBALL" --all > "$S3_LOG" 2>&1
S3_EXIT=$?
set -e

S3_ERRORS=0
if [[ $S3_EXIT -eq 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI should exit non-zero on corrupt tarball, but exited 0"
  ((S3_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} CLI exited non-zero ($S3_EXIT) as expected"
fi

# Verify existing .agents/ remains byte-identical
if diff -r "$S3_DIR/.agents" "$SNAPSHOT3" > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Existing .agents/ directory unchanged after corrupt tarball attempt"
else
  echo -e "  ${RED}✗ FAIL${NC} Existing .agents/ was modified or deleted during failed install"
  ((S3_ERRORS++)) || true
fi

check_no_staging_leftovers "$S3_DIR" || ((S3_ERRORS++)) || true

if [[ $S3_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 3 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 3 failed ($S3_ERRORS error(s))${NC}"
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 4: Invalid AGV_LOCAL_TARBALL parameter
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 4] Invalid AGV_LOCAL_TARBALL handling${NC}"
((SCENARIOS_RUN++)) || true
S4_DIR="$WORK_DIR/scenario4"
mkdir -p "$S4_DIR"

# Fresh install
run_cli "$S4_DIR" "$VALID_TARBALL" --all > /dev/null 2>&1

# Snapshot
SNAPSHOT4="$WORK_DIR/snapshot4"
cp -r "$S4_DIR/.agents" "$SNAPSHOT4"

S4_ERRORS=0

# 4a: Missing file
set +e
run_cli "$S4_DIR" "$WORK_DIR/nonexistent.tar.gz" --all > "$WORK_DIR/s4a.log" 2>&1
S4A_EXIT=$?
set -e

if [[ $S4A_EXIT -eq 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI should exit non-zero for missing tarball file"
  ((S4_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Non-existent tarball exited non-zero ($S4A_EXIT)"
fi

# 4b: Non-.tar.gz file
INVALID_EXT_FILE="$WORK_DIR/not_a_tarball.txt"
echo "not a tarball" > "$INVALID_EXT_FILE"

set +e
run_cli "$S4_DIR" "$INVALID_EXT_FILE" --all > "$WORK_DIR/s4b.log" 2>&1
S4B_EXIT=$?
set -e

if [[ $S4B_EXIT -eq 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI should exit non-zero for non-.tar.gz file"
  ((S4_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Non-.tar.gz tarball exited non-zero ($S4B_EXIT)"
fi

# Verify existing .agents/ remains unchanged
if diff -r "$S4_DIR/.agents" "$SNAPSHOT4" > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Existing .agents/ unchanged after invalid tarball attempts"
else
  echo -e "  ${RED}✗ FAIL${NC} Existing .agents/ was modified by invalid tarball attempts"
  ((S4_ERRORS++)) || true
fi

if [[ $S4_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 4 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 4 failed ($S4_ERRORS error(s))${NC}"
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 5: Additive --stacks go on existing install keeps customs
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 5] Additive --stacks go preserves customs${NC}"
((SCENARIOS_RUN++)) || true
S5_DIR="$WORK_DIR/scenario5"
mkdir -p "$S5_DIR"
S5_LOG="$WORK_DIR/s5.log"

# Install with python stack first
run_cli "$S5_DIR" "$VALID_TARBALL" --stacks python > /dev/null 2>&1

# Add customs
mkdir -p "$S5_DIR/.agents/skills/my-custom"
cat <<'EOF' > "$S5_DIR/.agents/skills/my-custom/SKILL.md"
---
name: my-custom
description: User custom skill
---
# Custom Skill
EOF

cat <<'EOF' > "$S5_DIR/.agents/rules/my-rule.md"
# My Custom Rule
EOF

cat <<'EOF' > "$S5_DIR/.agents/agents/my-agent.md"
# My Custom Agent
EOF

# Additive install: add go stack
set +e
run_cli "$S5_DIR" "$VALID_TARBALL" --stacks go > "$S5_LOG" 2>&1
S5_EXIT=$?
set -e

S5_ERRORS=0
if [[ $S5_EXIT -ne 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Additive --stacks go exited with code $S5_EXIT"
  ((S5_ERRORS++)) || true
fi

# Check customs preserved
if [[ -f "$S5_DIR/.agents/skills/my-custom/SKILL.md" && \
      -f "$S5_DIR/.agents/rules/my-rule.md" && \
      -f "$S5_DIR/.agents/agents/my-agent.md" ]]; then
  echo -e "  ${GREEN}✓${NC} All custom rules, skills, and agents preserved"
else
  echo -e "  ${RED}✗ FAIL${NC} One or more customs lost during additive install"
  ((S5_ERRORS++)) || true
fi

# Check initial python stack preserved (NIT-01)
if [[ -f "$S5_DIR/.agents/skills/python-idioms/SKILL.md" ]]; then
  echo -e "  ${GREEN}✓${NC} Initial Python stack (python-idioms) preserved"
else
  echo -e "  ${RED}✗ FAIL${NC} Python stack (python-idioms) lost after additive install"
  ((S5_ERRORS++)) || true
fi

# Check go stack installed
if [[ -f "$S5_DIR/.agents/skills/go-idioms/SKILL.md" ]]; then
  echo -e "  ${GREEN}✓${NC} Go stack (go-idioms) installed successfully"
else
  echo -e "  ${RED}✗ FAIL${NC} Go stack (go-idioms) missing after additive install"
  ((S5_ERRORS++)) || true
fi

if [[ $S5_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 5 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 5 failed ($S5_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 15 "$S5_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 6: Backup retention: after 7 reinstalls, at most 5 backups
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 6] Backup retention (7 reinstalls -> at most 5 backups)${NC}"
((SCENARIOS_RUN++)) || true
S6_DIR="$WORK_DIR/scenario6"
mkdir -p "$S6_DIR"

# Initial install
run_cli "$S6_DIR" "$VALID_TARBALL" --all > /dev/null 2>&1

S6_ERRORS=0
for i in {1..7}; do
  sleep 1 # Ensure timestamp increments
  set +e
  run_cli "$S6_DIR" "$VALID_TARBALL" --all > "$WORK_DIR/s6_run_$i.log" 2>&1
  run_exit=$?
  set -e
  if [[ $run_exit -ne 0 ]]; then
    echo -e "  ${RED}✗ FAIL${NC} Reinstall $i failed with code $run_exit"
    ((S6_ERRORS++)) || true
  fi
done

BACKUP_COUNT=$(find "$S6_DIR/.agv-backup" -mindepth 1 -maxdepth 1 -type d -name "agents-*" 2>/dev/null | wc -l)
if [[ "$BACKUP_COUNT" -gt 5 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Found $BACKUP_COUNT backups (must retain at most 5)"
  ((S6_ERRORS++)) || true
elif [[ "$BACKUP_COUNT" -eq 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} No backups created after reinstalls"
  ((S6_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Backup retention verified: $BACKUP_COUNT backups retained (<= 5)"
fi

if [[ $S6_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 6 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 6 failed ($S6_ERRORS error(s))${NC}"
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 7: .agv-backup is a symlink -> refuse and fail closed (SEC-04)
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 7] .agv-backup is a symlink (SEC-04)${NC}"
((SCENARIOS_RUN++)) || true
S7_DIR="$WORK_DIR/scenario7"
mkdir -p "$S7_DIR"
S7_LOG="$WORK_DIR/s7.log"

# Fresh install so .agents/ exists
run_cli "$S7_DIR" "$VALID_TARBALL" --all > /dev/null 2>&1

# Snapshot pre-existing .agents/
SNAPSHOT7="$WORK_DIR/snapshot7"
cp -r "$S7_DIR/.agents" "$SNAPSHOT7"

# Create a canary destination directory and symlink .agv-backup to it
S7_CANARY="$WORK_DIR/canary7"
mkdir -p "$S7_CANARY"
touch "$S7_CANARY/untouched.txt"
ln -s "$S7_CANARY" "$S7_DIR/.agv-backup"

set +e
run_cli "$S7_DIR" "$VALID_TARBALL" --all > "$S7_LOG" 2>&1
S7_EXIT=$?
set -e

S7_ERRORS=0
if [[ $S7_EXIT -eq 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI should exit non-zero when .agv-backup is a symlink"
  ((S7_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} CLI exited non-zero ($S7_EXIT) as expected"
fi

# Verify canary directory was not touched/written into
CANARY_FILES=$(find "$S7_CANARY" -mindepth 1 | wc -l)
if [[ "$CANARY_FILES" -ne 1 || ! -f "$S7_CANARY/untouched.txt" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Symlink destination was modified or written to"
  ((S7_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Symlink destination remained untouched"
fi

# Verify existing .agents/ remains unchanged
if diff -r "$S7_DIR/.agents" "$SNAPSHOT7" > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Existing .agents/ directory unchanged after refused install"
else
  echo -e "  ${RED}✗ FAIL${NC} Existing .agents/ was modified or deleted"
  ((S7_ERRORS++)) || true
fi

check_no_staging_leftovers "$S7_DIR" || ((S7_ERRORS++)) || true

if [[ $S7_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 7 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 7 failed ($S7_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 15 "$S7_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 8: .agents is a dangling symlink -> refuse and fail closed (SEC-03)
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 8] .agents is a dangling symlink (SEC-03)${NC}"
((SCENARIOS_RUN++)) || true
S8_DIR="$WORK_DIR/scenario8"
mkdir -p "$S8_DIR"
S8_LOG="$WORK_DIR/s8.log"

# Create a dangling symlink at .agents
ln -s "$WORK_DIR/nonexistent_target_dir" "$S8_DIR/.agents"

set +e
run_cli "$S8_DIR" "$VALID_TARBALL" --all > "$S8_LOG" 2>&1
S8_EXIT=$?
set -e

S8_ERRORS=0
if [[ $S8_EXIT -eq 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI should exit non-zero when .agents is a dangling symlink"
  ((S8_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} CLI exited non-zero ($S8_EXIT) as expected"
fi

if grep -qi "symbolic link" "$S8_LOG"; then
  echo -e "  ${GREEN}✓${NC} Clear error message mentioning symbolic link logged"
else
  echo -e "  ${RED}✗ FAIL${NC} Error message missing mention of symbolic link"
  ((S8_ERRORS++)) || true
fi

if [[ -L "$S8_DIR/.agents" ]]; then
  echo -e "  ${GREEN}✓${NC} Dangling symlink preserved (fail closed, nothing deleted)"
else
  echo -e "  ${RED}✗ FAIL${NC} Dangling symlink was deleted or overwritten"
  ((S8_ERRORS++)) || true
fi

# The refusal happens before the install try-block; it must still be a clean
# "Installation failed" message, not an unhandled-rejection stack trace.
if grep -q "Installation failed" "$S8_LOG" && ! grep -qE "^\s+at .+\(.+:[0-9]+:[0-9]+\)" "$S8_LOG"; then
  echo -e "  ${GREEN}✓${NC} Clean error reported (no stack trace)"
else
  echo -e "  ${RED}✗ FAIL${NC} Error surfaced as a raw stack trace instead of a clean message"
  ((S8_ERRORS++)) || true
fi

check_no_staging_leftovers "$S8_DIR" || ((S8_ERRORS++)) || true

if [[ $S8_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 8 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 8 failed ($S8_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 15 "$S8_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 9: AGV_LOCAL_TARBALL path with spaces and shell metacharacters (SEC-01)
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 9] Tarball path with spaces and metacharacters (SEC-01)${NC}"
((SCENARIOS_RUN++)) || true
S9_DIR="$WORK_DIR/scenario9"
mkdir -p "$S9_DIR"
S9_LOG="$WORK_DIR/s9.log"

META_DIR="$WORK_DIR/dir with space"
mkdir -p "$META_DIR"
META_TARBALL="$META_DIR/\$(touch PWNED);x.tar.gz"
cp "$VALID_TARBALL" "$META_TARBALL"

rm -f "$S9_DIR/PWNED" "$WORK_DIR/PWNED" PWNED

set +e
run_cli "$S9_DIR" "$META_TARBALL" --all > "$S9_LOG" 2>&1
S9_EXIT=$?
set -e

S9_ERRORS=0
if [[ $S9_EXIT -ne 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI failed to install from tarball with metacharacters (exit code $S9_EXIT)"
  ((S9_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} CLI succeeded installing from path with spaces/metacharacters"
fi

if [[ -f "$S9_DIR/PWNED" || -f "$WORK_DIR/PWNED" || -f "PWNED" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Shell injection occurred! PWNED file was created"
  rm -f "$S9_DIR/PWNED" "$WORK_DIR/PWNED" PWNED
  ((S9_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} No shell execution occurred (no PWNED file created)"
fi

if [[ -d "$S9_DIR/.agents" && -d "$S9_DIR/.agents/skills" ]]; then
  echo -e "  ${GREEN}✓${NC} Target .agents/ installed properly"
else
  echo -e "  ${RED}✗ FAIL${NC} Target .agents/ was not created"
  ((S9_ERRORS++)) || true
fi

if [[ $S9_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 9 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 9 failed ($S9_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 15 "$S9_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 10: Upgrade from v3 layout — only custom workflows are reported
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 10] v3 upgrade reports only custom workflows${NC}"
((SCENARIOS_RUN++)) || true
S10_DIR="$WORK_DIR/scenario10"
mkdir -p "$S10_DIR"
S10_LOG="$WORK_DIR/s10.log"

run_cli "$S10_DIR" "$VALID_TARBALL" --all > /dev/null 2>&1

# Simulate a v3 install: built-in workflows (now command skills) + one custom one
mkdir -p "$S10_DIR/.agents/work""flows"
echo "# built-in" > "$S10_DIR/.agents/work""flows/audit.md"
echo "# built-in" > "$S10_DIR/.agents/work""flows/workflow-solo.md"
echo "# custom" > "$S10_DIR/.agents/work""flows/my-flow.md"

set +e
run_cli "$S10_DIR" "$VALID_TARBALL" --all > "$S10_LOG" 2>&1
S10_EXIT=$?
set -e

S10_ERRORS=0
if [[ $S10_EXIT -ne 0 ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Upgrade exited with code $S10_EXIT"
  ((S10_ERRORS++)) || true
fi

if grep -q -- "- my-flow.md" "$S10_LOG"; then
  echo -e "  ${GREEN}✓${NC} Custom workflow my-flow.md reported"
else
  echo -e "  ${RED}✗ FAIL${NC} Custom workflow my-flow.md not reported"
  ((S10_ERRORS++)) || true
fi

if grep -qE -- "- (audit|workflow-solo)\.md" "$S10_LOG"; then
  echo -e "  ${RED}✗ FAIL${NC} Built-in workflows wrongly reported as custom"
  ((S10_ERRORS++)) || true
else
  echo -e "  ${GREEN}✓${NC} Built-in workflows not reported as custom"
fi

if grep -q "2 built-in workflow(s) replaced" "$S10_LOG"; then
  echo -e "  ${GREEN}✓${NC} Built-in workflow replacement summarised"
else
  echo -e "  ${RED}✗ FAIL${NC} Built-in workflow replacement summary missing"
  ((S10_ERRORS++)) || true
fi

if [[ $S10_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 10 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 10 failed ($S10_ERRORS error(s))${NC}"
  echo -e "  ${YELLOW}Log excerpt:${NC}"
  tail -n 25 "$S10_LOG" | sed 's/^/    /'
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Scenario 11: Malformed .agvrc is ignored with a warning, no crash
# =============================================================================
echo -e "\n${BLUE}▸ [Scenario 11] Malformed .agvrc handling${NC}"
((SCENARIOS_RUN++)) || true
S11_DIR="$WORK_DIR/scenario11"
mkdir -p "$S11_DIR"

run_cli "$S11_DIR" "$VALID_TARBALL" --stacks python > /dev/null 2>&1

S11_ERRORS=0
S11_CASE=0
for bad_rc in '{}' '{"mode":"curated","stacks":"python"}' '{"mode":"bogus","stacks":["python"]}' '[]'; do
  ((S11_CASE++)) || true
  printf '%s\n' "$bad_rc" > "$S11_DIR/.agents/.agvrc"
  set +e
  run_cli "$S11_DIR" "$VALID_TARBALL" --stacks go > "$WORK_DIR/s11_$S11_CASE.log" 2>&1
  case_exit=$?
  set -e
  if [[ $case_exit -ne 0 ]] || ! grep -q "Ignoring malformed .agvrc" "$WORK_DIR/s11_$S11_CASE.log"; then
    echo -e "  ${RED}✗ FAIL${NC} .agvrc '$bad_rc' not handled (exit $case_exit)"
    tail -n 10 "$WORK_DIR/s11_$S11_CASE.log" | sed 's/^/    /'
    ((S11_ERRORS++)) || true
  else
    echo -e "  ${GREEN}✓${NC} .agvrc '$bad_rc' ignored with warning, install succeeded"
  fi
done

if [[ -f "$S11_DIR/.agents/skills/go-idioms/SKILL.md" ]] && \
   node -e "const rc=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); process.exit(Array.isArray(rc.stacks) && rc.stacks.includes('go') ? 0 : 1)" \
     "$S11_DIR/.agents/.agvrc"; then
  echo -e "  ${GREEN}✓${NC} Valid .agvrc rewritten after recovery"
else
  echo -e "  ${RED}✗ FAIL${NC} .agvrc not rewritten correctly after malformed input"
  ((S11_ERRORS++)) || true
fi

if [[ $S11_ERRORS -eq 0 ]]; then
  echo -e "  ${GREEN}PASS: Scenario 11 passed${NC}"
else
  echo -e "  ${RED}FAIL: Scenario 11 failed ($S11_ERRORS error(s))${NC}"
  ((SCENARIOS_FAILED++)) || true
fi

# =============================================================================
# Suite Summary
# =============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Scenarios run    : $SCENARIOS_RUN"
echo "  Scenarios failed : $SCENARIOS_FAILED"

if [[ "$SCENARIOS_FAILED" -eq 0 ]]; then
  echo -e "  ${GREEN}✅ ALL CLI SMOKE TEST SCENARIOS PASSED${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}❌ CLI SMOKE TEST FAILED: $SCENARIOS_FAILED scenario(s) failed${NC}"
  echo ""
  exit 1
fi
