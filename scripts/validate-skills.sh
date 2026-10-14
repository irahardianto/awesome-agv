#!/usr/bin/env bash
# =============================================================================
# validate-skills.sh
#
# Purpose:
#   Validates skills integrity, frontmatter schema, bidirectional parity with
#   agv.config.json, retirement status, command-skill execution flags, absence
#   of legacy workflows directory, and repo-wide absence of stale references.
#
# Usage:
#   bash scripts/validate-skills.sh
#   # Or from anywhere:
#   bash /path/to/awesome-agv/scripts/validate-skills.sh
#
# Exit codes:
#   0 — all validations passed
#   1 — one or more validation errors detected
#
# Checks performed:
#   a. Bidirectional parity: every dir in .agents/skills/ is in agv.config.json
#      (skills.core ∪ all skills.stacks.*.skills) and each listed skill has SKILL.md.
#   b. Each SKILL.md frontmatter has name matching dir name and non-empty description.
#   c. 11 command skills each have disable-model-invocation: true; warn if on others.
#   d. .agents/workflows/ does not exist.
#   e. No stale references repo-wide (excluding .git, .agentwork, node_modules,
#      .agv-backup, and docs/decisions/0001-*.md) to .agents/workflows/ or skills/code-audit.
#   f. agv.config.json and cli/agv.config.json are byte-identical; retired skills
#      do not exist as directories in .agents/skills/.
#   g. core.paths in agv.config.json does not contain workflows/.
# =============================================================================

set -euo pipefail

# ---- Configuration ----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SKILLS_DIR="$REPO_ROOT/.agents/skills"
CONFIG_FILE="$REPO_ROOT/agv.config.json"
CLI_CONFIG_FILE="$REPO_ROOT/cli/agv.config.json"
WORKFLOWS_DIR="$REPO_ROOT/.agents/workflows"

# ---- Colour helpers ---------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# ---- State ------------------------------------------------------------------
FAILURES=0
WARNINGS=0
CHECKS=0

echo ""
echo "🔍 Validating awesome-agv skills, configuration, and references"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# -----------------------------------------------------------------------------
# Check d: .agents/workflows/ directory does not exist
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}▸ Checking .agents/workflows/ directory absence...${NC}"
((CHECKS++)) || true
if [[ -e "$WORKFLOWS_DIR" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} .agents/workflows/ directory exists at $WORKFLOWS_DIR (must not exist)"
  ((FAILURES++)) || true
else
  echo -e "  ${GREEN}✓ PASS${NC} .agents/workflows/ directory does not exist"
fi

# -----------------------------------------------------------------------------
# Check f (part 1): agv.config.json and cli/agv.config.json byte-identical
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}▸ Checking configuration byte-identity (root vs cli)...${NC}"
((CHECKS++)) || true
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} Root config not found: $CONFIG_FILE"
  ((FAILURES++)) || true
elif [[ ! -f "$CLI_CONFIG_FILE" ]]; then
  echo -e "  ${RED}✗ FAIL${NC} CLI config not found: $CLI_CONFIG_FILE"
  ((FAILURES++)) || true
elif ! cmp -s "$CONFIG_FILE" "$CLI_CONFIG_FILE"; then
  echo -e "  ${RED}✗ FAIL${NC} agv.config.json and cli/agv.config.json are not byte-identical"
  ((FAILURES++)) || true
else
  echo -e "  ${GREEN}✓ PASS${NC} agv.config.json and cli/agv.config.json are byte-identical"
fi

# -----------------------------------------------------------------------------
# Checks a, b, c, f (part 2: retired skills), g: Node-based validations
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}▸ Validating skill definitions, frontmatter, and configuration parity...${NC}"

while IFS= read -r line; do
  if [[ "$line" =~ ^__RESULT__[[:space:]]+([0-9]+)[[:space:]]+([0-9]+)[[:space:]]+([0-9]+)$ ]]; then
    node_checks="${BASH_REMATCH[1]}"
    node_failures="${BASH_REMATCH[2]}"
    node_warnings="${BASH_REMATCH[3]}"
    ((CHECKS += node_checks)) || true
    ((FAILURES += node_failures)) || true
    ((WARNINGS += node_warnings)) || true
  else
    echo -e "$line"
  fi
done < <(node - "$CONFIG_FILE" "$SKILLS_DIR" << 'NODE_EOF'
'use strict';

const fs = require('fs');
const path = require('path');

const configPath = process.argv[2];
const skillsDir = process.argv[3];

const c = {
  reset: '\x1b[0m',
  green: '\x1b[0;32m',
  red: '\x1b[0;31m',
  yellow: '\x1b[1;33m',
};

const COMMAND_SKILLS = new Set([
  'audit',
  'bugfix',
  'perf-optimize',
  'refactor',
  'security-audit',
  'test-e2e',
  'test-integration',
  'test-scenarios',
  'test-unit',
  'workflow-solo',
  'workflow-team'
]);

let failures = 0;
let warnings = 0;
let checks = 0;

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const yamlText = match[1];
  const lines = yamlText.split(/\r?\n/);
  const data = {};
  let currentKey = null;
  let multilineVal = [];

  function commitCurrent() {
    if (currentKey) {
      if (multilineVal.length > 0) {
        data[currentKey] = multilineVal.join(' ').trim();
      }
      currentKey = null;
      multilineVal = [];
    }
  }

  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      commitCurrent();
      const key = keyMatch[1];
      let val = keyMatch[2].trim();
      if (val === '>-' || val === '>' || val === '|' || val === '|-') {
        currentKey = key;
        multilineVal = [];
      } else {
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        data[key] = val;
      }
    } else if (currentKey && /^\s+/.test(line)) {
      multilineVal.push(line.trim());
    } else {
      commitCurrent();
    }
  }
  commitCurrent();
  return data;
}

let cfg = null;
try {
  cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  failures++;
  checks++;
  console.log(`  ${c.red}✗ FAIL${c.reset} Cannot parse ${configPath}: ${err.message}`);
}

if (cfg) {
  // Check g: core.paths does not contain workflows/
  checks++;
  const corePaths = (cfg.core && cfg.core.paths) || [];
  const hasWorkflows = corePaths.some(p => p === 'workflows/' || p === 'workflows');
  if (hasWorkflows) {
    failures++;
    console.log(`  ${c.red}✗ FAIL${c.reset} core.paths in agv.config.json contains workflows/: [${corePaths.join(', ')}]`);
  } else {
    console.log(`  ${c.green}✓ PASS${c.reset} core.paths does not contain workflows/`);
  }

  // Check f (part 2): skills.retired entries do not exist as dirs
  checks++;
  if (!cfg.skills || !Array.isArray(cfg.skills.retired)) {
    failures++;
    console.log(`  ${c.red}✗ FAIL${c.reset} skills.retired is missing or not an array in agv.config.json`);
  } else {
    let retiredViolations = 0;
    for (const retiredSkill of cfg.skills.retired) {
      const retiredDir = path.join(skillsDir, retiredSkill);
      if (fs.existsSync(retiredDir)) {
        retiredViolations++;
        failures++;
        console.log(`  ${c.red}✗ FAIL${c.reset} Retired skill "${retiredSkill}" still exists as a directory: ${retiredDir}`);
      }
    }
    if (retiredViolations === 0) {
      console.log(`  ${c.green}✓ PASS${c.reset} skills.retired (${cfg.skills.retired.join(', ')}) do not exist as directories`);
    }
  }

  // Check a: Bidirectional parity
  // Configured set = skills.core ∪ all skills.stacks.*.skills
  checks++;
  const configuredSkills = new Set(cfg.skills && Array.isArray(cfg.skills.core) ? cfg.skills.core : []);
  if (cfg.skills && cfg.skills.stacks && typeof cfg.skills.stacks === 'object') {
    for (const stack of Object.values(cfg.skills.stacks)) {
      if (Array.isArray(stack.skills)) {
        for (const s of stack.skills) {
          configuredSkills.add(s);
        }
      }
    }
  }

  let actualDirs = [];
  try {
    actualDirs = fs.readdirSync(skillsDir)
      .filter(item => {
        const full = path.join(skillsDir, item);
        return fs.statSync(full).isDirectory();
      })
      .sort();
  } catch (err) {
    failures++;
    console.log(`  ${c.red}✗ FAIL${c.reset} Cannot read skills directory: ${skillsDir}`);
  }

  const actualDirSet = new Set(actualDirs);

  // Parity 1: Every actual directory is listed in config
  let unlistedSkills = 0;
  for (const dir of actualDirs) {
    if (!configuredSkills.has(dir)) {
      unlistedSkills++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} Skill directory "${dir}" exists in .agents/skills/ but is NOT listed in agv.config.json`);
    }
  }

  // Parity 2: Every configured skill exists with SKILL.md
  let missingSkills = 0;
  for (const skill of configuredSkills) {
    const skillPath = path.join(skillsDir, skill);
    const skillMd = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      missingSkills++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} Configured skill "${skill}" has no directory in .agents/skills/`);
    } else if (!fs.existsSync(skillMd)) {
      missingSkills++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} Skill directory .agents/skills/${skill} is missing SKILL.md`);
    }
  }

  if (unlistedSkills === 0 && missingSkills === 0) {
    console.log(`  ${c.green}✓ PASS${c.reset} Bidirectional parity: all ${actualDirs.length} skill dirs match agv.config.json entries`);
  }

  // Check b & c: SKILL.md frontmatter validation and command skills flags
  checks++;
  let fmErrors = 0;
  let cmdErrors = 0;

  for (const dir of actualDirs) {
    const skillMd = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue; // already reported above

    let content = '';
    try {
      content = fs.readFileSync(skillMd, 'utf8');
    } catch (e) {
      fmErrors++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} Cannot read ${skillMd}: ${e.message}`);
      continue;
    }

    const fm = parseFrontmatter(content);
    if (!fm) {
      fmErrors++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} .agents/skills/${dir}/SKILL.md: missing frontmatter block (must begin with ---)`);
      continue;
    }

    // Check b: name equal to dir name
    if (fm.name !== dir) {
      fmErrors++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} .agents/skills/${dir}/SKILL.md: frontmatter name "${fm.name || ''}" does not match dir "${dir}"`);
    }

    // Check b: non-empty description
    if (!fm.description || fm.description.trim().length === 0) {
      fmErrors++;
      failures++;
      console.log(`  ${c.red}✗ FAIL${c.reset} .agents/skills/${dir}/SKILL.md: description is missing or empty`);
    }

    // Check c: command skills flags
    const isCommand = COMMAND_SKILLS.has(dir);
    const rawDisable = fm['disable-model-invocation'];
    const hasDisable = (rawDisable === true || rawDisable === 'true');

    if (isCommand) {
      if (!hasDisable) {
        cmdErrors++;
        failures++;
        console.log(`  ${c.red}✗ FAIL${c.reset} Command skill .agents/skills/${dir}/SKILL.md missing "disable-model-invocation: true"`);
      }
    } else {
      if (hasDisable) {
        warnings++;
        console.log(`  ${c.yellow}⚠ WARN${c.reset} Non-command skill .agents/skills/${dir}/SKILL.md has "disable-model-invocation: true"`);
      }
    }
  }

  if (fmErrors === 0) {
    console.log(`  ${c.green}✓ PASS${c.reset} All SKILL.md files have valid name and non-empty description`);
  }
  if (cmdErrors === 0) {
    console.log(`  ${c.green}✓ PASS${c.reset} All 11 command skills have disable-model-invocation: true`);
  }
}

console.log(`__RESULT__ ${checks} ${failures} ${warnings}`);
NODE_EOF
)

# -----------------------------------------------------------------------------
# Check e: No stale references repo-wide
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}▸ Checking for stale references repo-wide...${NC}"
((CHECKS++)) || true

# Construct search patterns dynamically to avoid self-matching
PAT_WORKFLOWS='\.agents/'"workflows/"
PAT_CODE_AUDIT='skills/'"code-audit"
STALE_FOUND=0

while IFS= read -r match; do
  [[ -z "$match" ]] && continue
  ((STALE_FOUND++)) || true
  # Report relative to REPO_ROOT for readability
  rel_match="${match#$REPO_ROOT/}"
  echo -e "  ${RED}✗ STALE REF${NC}  $rel_match"
done < <(grep -rn \
  --exclude-dir=".git" \
  --exclude-dir=".agentwork" \
  --exclude-dir="node_modules" \
  --exclude-dir=".agv-backup" \
  --exclude="0001-*.md" \
  --exclude="validate-skills.sh" \
  --exclude="smoke-test-cli.sh" \
  -E "(${PAT_WORKFLOWS}|${PAT_CODE_AUDIT})" \
  "$REPO_ROOT" 2>/dev/null || true)

if [[ "$STALE_FOUND" -eq 0 ]]; then
  echo -e "  ${GREEN}✓ PASS${NC} No stale references found (.agents/workflows/ or skills/code-audit)"
else
  echo -e "  ${RED}✗ FAIL${NC} Found $STALE_FOUND stale reference(s) above"
  ((FAILURES += STALE_FOUND)) || true
fi

# -----------------------------------------------------------------------------
# Summary and exit code
# -----------------------------------------------------------------------------
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checks run : $CHECKS"
echo "  Failures   : $FAILURES"
echo "  Warnings   : $WARNINGS"

if [[ "$FAILURES" -eq 0 ]]; then
  echo -e "  ${GREEN}✅ ALL SKILL VALIDATION CHECKS PASSED${NC}"
  echo ""
  exit 0
else
  echo -e "  ${RED}❌ SKILL VALIDATION FAILED: $FAILURES error(s) found${NC}"
  echo ""
  exit 1
fi
