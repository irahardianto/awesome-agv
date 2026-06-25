#!/usr/bin/env node

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createInterface } = require('readline');
const { execSync } = require('child_process');
const os = require('os');

// ── ANSI Colors (zero-dependency) ──────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
};

const icon = {
  check: `${c.green}✓${c.reset}`,
  warn: `${c.yellow}⚠${c.reset}`,
  error: `${c.red}✗${c.reset}`,
  arrow: `${c.cyan}→${c.reset}`,
  rocket: '🚀',
  shield: '🛡️',
  gear: '⚙️',
  book: '📏',
  tool: '🛠️',
  cycle: '🔄',
  target: '🎯',
  bolt: '⚡',
};

// ── Constants ──────────────────────────────────────────────────────────────────
const REPO_OWNER = 'irahardianto';
const REPO_NAME = 'awesome-agv';
const BRANCH = 'main';
const TARBALL_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${BRANCH}.tar.gz`;
const AGENT_DIR = '.agents';
const CONFIG_FILE = '.agvrc';

// ── CLI Argument Parsing ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    force: false,
    targetDir: process.cwd(),
    help: false,
    all: false,
    stacks: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--stacks') {
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        options.stacks = next.split(',').map((s) => s.trim().toLowerCase());
        i++;
      }
    } else if (arg.startsWith('--stacks=')) {
      options.stacks = arg
        .slice('--stacks='.length)
        .split(',')
        .map((s) => s.trim().toLowerCase());
    } else if (!arg.startsWith('-')) {
      options.targetDir = path.resolve(arg);
    }
  }

  return options;
}

// ── Banner ─────────────────────────────────────────────────────────────────────
function printBanner() {
  const { version } = require('../package.json');

  // Gradient: magenta → cyan → white
  const m = c.magenta + c.bold;
  const cy = c.cyan + c.bold;
  const w = c.white + c.bold;

  console.log(`
${m}     █████╗  ██╗    ██╗███████╗███████╗ ██████╗ ███╗   ███╗███████╗${c.reset}
${m}    ██╔══██╗ ██║    ██║██╔════╝██╔════╝██╔═══██╗████╗ ████║██╔════╝${c.reset}
${cy}    ███████║ ██║ █╗ ██║█████╗  ███████╗██║   ██║██╔████╔██║█████╗${c.reset}
${cy}    ██╔══██║ ██║███╗██║██╔══╝  ╚════██║██║   ██║██║╚██╔╝██║██╔══╝${c.reset}
${w}    ██║  ██║ ╚███╔███╔╝███████╗███████║╚██████╔╝██║ ╚═╝ ██║███████╗${c.reset}
${w}    ╚═╝  ╚═╝  ╚══╝╚══╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝${c.reset}
${cy}                     █████╗  ██████╗ ██╗   ██╗${c.reset}
${w}                    ██╔══██╗██╔════╝ ██║   ██║${c.reset}
${w}                    ███████║██║  ███╗██║   ██║${c.reset}
${cy}                    ██╔══██║██║   ██║╚██╗ ██╔╝${c.reset}
${m}                    ██║  ██║╚██████╔╝ ╚████╔╝${c.reset}
${m}                    ╚═╝  ╚═╝ ╚═════╝   ╚═══╝${c.reset}    ${c.dim}v${version}${c.reset}

    ${icon.bolt} ${c.bold}Rugged AI Agent Configuration Suite${c.reset}
    ${c.dim}─────────────────────────────────────────────────────${c.reset}
`);
}

// ── Help Text ──────────────────────────────────────────────────────────────────
function printHelp() {
  const { version } = require('../package.json');
  console.log(`
${c.bold}awesome-agv${c.reset} ${c.dim}v${version}${c.reset} — Install the Awesome AGV AI Agent configuration suite

${c.bold}USAGE${c.reset}
  npx awesome-agv [target-dir] [options]

${c.bold}ARGUMENTS${c.reset}
  target-dir          Directory to install into (default: current directory)

${c.bold}OPTIONS${c.reset}
  --stacks <list>     Comma-separated stacks to include (additive with existing .agvrc)
  --all               Install everything (all stacks, same as Default mode)
  -f, --force         Replace existing .agents/ — re-prompts from scratch
  -h, --help          Show this help message

${c.bold}INSTALL MODES${c.reset}
  ${icon.rocket}  ${c.bold}Default${c.reset}    Install everything. The full arsenal.
  ${icon.target}  ${c.bold}Curated${c.reset}    Pick languages & frameworks. Core always included.
  ${icon.gear}  ${c.bold}Advanced${c.reset}   Full control. Pick rules, skills, agents, everything.

${c.bold}EXAMPLES${c.reset}
  ${c.dim}# Interactive — choose your mode${c.reset}
  npx awesome-agv

  ${c.dim}# Non-interactive: specific stacks, core always included${c.reset}
  npx awesome-agv --stacks go,python

  ${c.dim}# Add React to existing installation (additive)${c.reset}
  npx awesome-agv --stacks react

  ${c.dim}# Full install, no prompts${c.reset}
  npx awesome-agv --all --force

  ${c.dim}# CI/CD: specific stacks, no prompts${c.reset}
  npx awesome-agv --stacks typescript,vue --force

${c.dim}https://github.com/${REPO_OWNER}/${REPO_NAME}${c.reset}
`);
}

// ── User Prompt (single-line question) ─────────────────────────────────────────
function promptUser(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ── Single-Select Menu (arrow keys + enter) ────────────────────────────────────
function promptSelect(title, options) {
  return new Promise((resolve) => {
    let selected = 0;

    function render() {
      // Move cursor up to clear previous render (except first render)
      const totalLines = options.length + 2;
      process.stdout.write(`\x1b[${totalLines}A\x1b[J`);
      console.log(`  ${c.bold}${title}${c.reset}\n`);
      for (let i = 0; i < options.length; i++) {
        const pointer = i === selected ? `${c.cyan}❯${c.reset}` : ' ';
        const label =
          i === selected
            ? `${c.bold}${options[i].label}${c.reset}`
            : `${c.dim}${options[i].label}${c.reset}`;
        console.log(`  ${pointer} ${label}`);
      }
    }

    // Print initial blank lines so the first render can overwrite
    console.log(`  ${c.bold}${title}${c.reset}\n`);
    for (const opt of options) {
      console.log(`    ${c.dim}${opt.label}${c.reset}`);
    }
    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (key) => {
      if (key === '\x1b[A') {
        // Up arrow
        selected = (selected - 1 + options.length) % options.length;
        render();
      } else if (key === '\x1b[B') {
        // Down arrow
        selected = (selected + 1) % options.length;
        render();
      } else if (key === '\r' || key === '\n') {
        // Enter
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        console.log('');
        resolve(options[selected].value);
      } else if (key === '\x03') {
        // Ctrl+C
        process.stdin.setRawMode(false);
        process.exit(0);
      }
    };

    process.stdin.on('data', onData);
  });
}

// ── Multi-Select Menu (arrow keys, space, enter) ───────────────────────────────
function promptMultiSelect(title, items, footerFn) {
  // items: [{ key, label, indent, checked, disabled, warning }]
  return new Promise((resolve) => {
    let cursor = 0;
    // Skip to first non-disabled item
    while (cursor < items.length && items[cursor].disabled) cursor++;

    function render() {
      const totalLines = items.length + 4; // title + blank + items + footer + blank
      process.stdout.write(`\x1b[${totalLines}A\x1b[J`);
      console.log(`  ${c.bold}${title}${c.reset}`);
      console.log('');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const pointer = i === cursor ? `${c.cyan}❯${c.reset}` : ' ';
        const indent = '  '.repeat(item.indent || 0);
        let checkbox;
        if (item.separator) {
          console.log(`  ${c.dim}${item.label}${c.reset}`);
          continue;
        }
        if (item.disabled) {
          checkbox = `${c.dim}◉${c.reset}`;
        } else {
          checkbox = item.checked
            ? `${c.green}◉${c.reset}`
            : `${c.dim}◯${c.reset}`;
        }
        const label =
          i === cursor
            ? `${c.bold}${item.label}${c.reset}`
            : item.checked
              ? `${item.label}`
              : `${c.dim}${item.label}${c.reset}`;

        console.log(`  ${pointer} ${indent}${checkbox} ${label}`);
      }
      console.log('');
      if (footerFn) {
        console.log(`  ${footerFn(items)}`);
      } else {
        console.log(`  ${c.dim}(space to toggle, enter to confirm)${c.reset}`);
      }
    }

    // Initial blank lines
    console.log(`  ${c.bold}${title}${c.reset}`);
    console.log('');
    for (const item of items) {
      console.log('');
    }
    console.log('');
    console.log('');
    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (key) => {
      if (key === '\x1b[A') {
        // Up — skip separators and disabled
        let next = (cursor - 1 + items.length) % items.length;
        let attempts = 0;
        while ((items[next].separator || items[next].disabled) && attempts < items.length) {
          next = (next - 1 + items.length) % items.length;
          attempts++;
        }
        cursor = next;
        render();
      } else if (key === '\x1b[B') {
        // Down — skip separators and disabled
        let next = (cursor + 1) % items.length;
        let attempts = 0;
        while ((items[next].separator || items[next].disabled) && attempts < items.length) {
          next = (next + 1) % items.length;
          attempts++;
        }
        cursor = next;
        render();
      } else if (key === ' ') {
        // Space — toggle
        const item = items[cursor];
        if (!item.separator && !item.disabled) {
          item.checked = !item.checked;
          // Handle requires: selecting a child auto-selects parent
          if (item.checked && item.requires) {
            for (const reqKey of item.requires) {
              const parent = items.find((i) => i.key === reqKey);
              if (parent && !parent.checked) {
                parent.checked = true;
              }
            }
          }
          // Handle requires: deselecting a parent auto-deselects all transitive children
          if (!item.checked) {
            let cascadeChanged = true;
            while (cascadeChanged) {
              cascadeChanged = false;
              for (const child of items) {
                if (child.checked && child.requires) {
                  // If any required parent is unchecked, deselect this child
                  const allReqsMet = child.requires.every((reqKey) => {
                    const parent = items.find((i) => i.key === reqKey);
                    return parent && parent.checked;
                  });
                  if (!allReqsMet) {
                    child.checked = false;
                    cascadeChanged = true;
                  }
                }
              }
            }
          }
          render();
        }
      } else if (key === '\r' || key === '\n') {
        // Enter — confirm
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        console.log('');
        resolve(items.filter((i) => i.checked && !i.separator));
      } else if (key === '\x03') {
        process.stdin.setRawMode(false);
        process.exit(0);
      }
    };

    process.stdin.on('data', onData);
  });
}

// ── Auto-Detection ─────────────────────────────────────────────────────────────
function detectStacks(targetDir, manifest) {
  const detected = new Set();
  const stacks = manifest.skills.stacks;

  // Gather all detection patterns
  const detectionMap = {};
  for (const [key, stack] of Object.entries(stacks)) {
    if (!stack.detect || stack.detect.length === 0) continue;
    for (const pattern of stack.detect) {
      if (!pattern.includes('*')) {
        // Exact filename match
        if (!detectionMap[pattern]) detectionMap[pattern] = [];
        detectionMap[pattern].push(key);
      }
    }
  }

  // Scan root directory
  const scanDirs = [targetDir];
  const subDirs = ['apps', 'src', 'packages', 'services'];
  for (const sub of subDirs) {
    const subPath = path.join(targetDir, sub);
    if (fs.existsSync(subPath) && fs.statSync(subPath).isDirectory()) {
      scanDirs.push(subPath);
      // One more level for monorepo detection
      try {
        for (const entry of fs.readdirSync(subPath, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            scanDirs.push(path.join(subPath, entry.name));
          }
        }
      } catch {
        // Permission error, skip
      }
    }
  }

  for (const dir of scanDirs) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      // Check exact filename match
      if (detectionMap[entry]) {
        for (const stackKey of detectionMap[entry]) {
          detected.add(stackKey);
        }
      }
      // Check glob patterns (*.ext)
      for (const [key, stack] of Object.entries(stacks)) {
        if (!stack.detect) continue;
        for (const pattern of stack.detect) {
          if (pattern.startsWith('*.')) {
            const ext = pattern.slice(1); // e.g. ".vue"
            if (entry.endsWith(ext)) {
              detected.add(key);
            }
          }
        }
      }
    }
  }

  return detected;
}

// ── Dependency Resolution ──────────────────────────────────────────────────────
function resolveRequires(selectedKeys, manifest) {
  const stacks = manifest.skills.stacks;
  const resolved = new Set(selectedKeys);
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...resolved]) {
      const stack = stacks[key];
      if (stack && stack.requires) {
        for (const req of stack.requires) {
          if (!resolved.has(req)) {
            resolved.add(req);
            changed = true;
          }
        }
      }
    }
  }
  return resolved;
}

// ── Build Skills Set ───────────────────────────────────────────────────────────
function buildSkillsSet(selectedStackKeys, manifest) {
  const skills = new Set(manifest.skills.core);
  const stacks = manifest.skills.stacks;
  for (const key of selectedStackKeys) {
    const stack = stacks[key];
    if (stack && stack.skills) {
      for (const skill of stack.skills) {
        skills.add(skill);
      }
    }
  }
  return skills;
}

// ── Build Stack Tree for Display ───────────────────────────────────────────────
function buildStackTree(manifest) {
  const stacks = manifest.skills.stacks;
  const tree = [];

  // Separate languages (no requires) from frameworks (has requires)
  const languages = {};
  const frameworks = {};

  for (const [key, stack] of Object.entries(stacks)) {
    if (stack.requires && stack.requires.length > 0) {
      frameworks[key] = stack;
    } else {
      languages[key] = stack;
    }
  }

  // Group: core languages first, then community
  const coreLanguages = Object.entries(languages).filter(([, s]) => s.group === 'core');
  const communityLanguages = Object.entries(languages).filter(([, s]) => s.group === 'community');

  // Find direct children of a language
  function getChildren(parentKey) {
    const children = [];
    for (const [key, fw] of Object.entries(frameworks)) {
      if (fw.requires.includes(parentKey)) {
        children.push([key, fw]);
      }
    }
    return children;
  }


  // Add a language and its framework children recursively
  function addWithChildren(key, stack, indent) {
    tree.push({ key, indent, label: `${stack.label.padEnd(14)}— ${stack.description}`, requires: stack.requires || null });
    const children = getChildren(key);
    for (const [childKey, childStack] of children) {
      addWithChildren(childKey, childStack, indent + 1);
    }
  }

  // Core stacks section
  tree.push({ separator: true, label: '── Core Stacks ──────────────────────────────────────' });
  for (const [key, stack] of coreLanguages) {
    addWithChildren(key, stack, 0);
  }

  // Community languages section
  if (communityLanguages.length > 0) {
    tree.push({ separator: true, label: '── Community Languages ──────────────────────────────' });
    for (const [key, stack] of communityLanguages) {
      addWithChildren(key, stack, 0);
    }
  }

  return tree;
}

// ── HTTP Download with Redirect Following ──────────────────────────────────────
function downloadToFile(url, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          downloadToFile(res.headers.location, destPath, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(resolve);
        });
        fileStream.on('error', (err) => {
          fs.unlinkSync(destPath);
          reject(err);
        });
      })
      .on('error', reject);
  });
}

// ── Recursive directory copy ───────────────────────────────────────────────────
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Count files recursively ────────────────────────────────────────────────────
function countFiles(dirPath) {
  let count = 0;
  if (!fs.existsSync(dirPath)) return count;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

// ── Extract with filtering ─────────────────────────────────────────────────────
// Returns the number of skill directories actually copied from the archive.
function extractFiltered(tarballPath, targetDir, selectedSkills, config) {
  const tmpExtractDir = path.join(os.tmpdir(), `awesome-agv-extract-${Date.now()}`);
  fs.mkdirSync(tmpExtractDir, { recursive: true });
  let skillsCopied = 0;

  try {
    // Extract full tarball to temp
    try {
      execSync(`tar -xzf "${tarballPath}" -C "${tmpExtractDir}"`, { stdio: 'pipe' });
    } catch {
      const { execFileSync } = require('child_process');
      execFileSync('tar', ['-xzf', tarballPath, '-C', tmpExtractDir], { stdio: 'pipe' });
    }

    const extractedAgents = path.join(tmpExtractDir, `${REPO_NAME}-${BRANCH}`, AGENT_DIR);
    if (!fs.existsSync(extractedAgents)) {
      throw new Error(`Could not find ${AGENT_DIR} in downloaded archive`);
    }

    const destAgents = path.join(targetDir, AGENT_DIR);
    fs.mkdirSync(destAgents, { recursive: true });

    // Copy core paths (rules/, workflows/, agents/)
    for (const corePath of config.core.paths) {
      const src = path.join(extractedAgents, corePath);
      const dest = path.join(destAgents, corePath);
      if (fs.existsSync(src)) {
        // If advanced mode deselected items, filter them
        if (config._deselectedRules && corePath === 'rules/') {
          copyDirFiltered(src, dest, config._deselectedRules);
        } else if (config._deselectedAgents && corePath === 'agents/') {
          copyDirFiltered(src, dest, config._deselectedAgents);
        } else if (config._deselectedWorkflows && corePath === 'workflows/') {
          copyDirFiltered(src, dest, config._deselectedWorkflows);
        } else {
          copyDirRecursive(src, dest);
        }
      }
    }

    // Copy selected skills only
    const skillsSrc = path.join(extractedAgents, 'skills');
    const skillsDest = path.join(destAgents, 'skills');
    fs.mkdirSync(skillsDest, { recursive: true });

    if (fs.existsSync(skillsSrc)) {
      const allSkillDirs = fs.readdirSync(skillsSrc, { withFileTypes: true });
      for (const entry of allSkillDirs) {
        if (entry.isDirectory() && selectedSkills.has(entry.name)) {
          copyDirRecursive(
            path.join(skillsSrc, entry.name),
            path.join(skillsDest, entry.name)
          );
          skillsCopied++;
        }
      }
    }
  } finally {
    fs.rmSync(tmpExtractDir, { recursive: true, force: true });
  }

  return skillsCopied;
}

// ── Copy directory with exclusion filter ───────────────────────────────────────
function copyDirFiltered(src, dest, excludeSet) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const baseName = entry.name.replace(/\.md$/, '');
    if (excludeSet.has(baseName)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Write .agvrc ───────────────────────────────────────────────────────────────
function writeAgvrc(targetDir, mode, selectedStacks, deselected) {
  const rcPath = path.join(targetDir, AGENT_DIR, CONFIG_FILE);
  const config = {
    version: require('../package.json').version,
    mode,
    stacks: [...selectedStacks].sort(),
    deselected_rules: deselected.rules ? [...deselected.rules].sort() : [],
    deselected_core_skills: deselected.coreSkills ? [...deselected.coreSkills].sort() : [],
    deselected_agents: deselected.agents ? [...deselected.agents].sort() : [],
    deselected_workflows: deselected.workflows ? [...deselected.workflows].sort() : [],
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(rcPath, JSON.stringify(config, null, 2) + '\n');
}

// ── Read existing .agvrc ───────────────────────────────────────────────────────
function readAgvrc(targetDir) {
  const rcPath = path.join(targetDir, AGENT_DIR, CONFIG_FILE);
  if (!fs.existsSync(rcPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(rcPath, 'utf8'));
  } catch {
    return null;
  }
}

// ── Read manifest from extracted archive ───────────────────────────────────────
function readManifest(tarballPath) {
  const tmpExtractDir = path.join(os.tmpdir(), `awesome-agv-manifest-${Date.now()}`);
  fs.mkdirSync(tmpExtractDir, { recursive: true });

  try {
    // Extract only the manifest file
    try {
      execSync(
        `tar -xzf "${tarballPath}" --strip-components=1 -C "${tmpExtractDir}" "${REPO_NAME}-${BRANCH}/agv.config.json"`,
        { stdio: 'pipe' }
      );
    } catch {
      // Fallback: extract everything and find it
      try {
        execSync(`tar -xzf "${tarballPath}" -C "${tmpExtractDir}"`, { stdio: 'pipe' });
      } catch {
        // Ignore extraction failures — we'll fall back to bundled
      }
    }

    // Try both locations in the extracted archive
    let manifestPath = path.join(tmpExtractDir, 'agv.config.json');
    if (!fs.existsSync(manifestPath)) {
      manifestPath = path.join(tmpExtractDir, `${REPO_NAME}-${BRANCH}`, 'agv.config.json');
    }

    // Fallback: bundled copy shipped with the CLI package
    if (!fs.existsSync(manifestPath)) {
      // When installed via npm, layout is: cli/bin/awesome-agv.js + cli/agv.config.json
      const bundledPath = path.resolve(__dirname, '..', 'agv.config.json');
      if (fs.existsSync(bundledPath)) {
        manifestPath = bundledPath;
      }
    }

    // Fallback: repo root (when running from source checkout)
    if (!fs.existsSync(manifestPath)) {
      const repoRootPath = path.resolve(__dirname, '..', '..', 'agv.config.json');
      if (fs.existsSync(repoRootPath)) {
        manifestPath = repoRootPath;
      }
    }

    if (!fs.existsSync(manifestPath)) {
      throw new Error('agv.config.json not found in archive or CLI bundle');
    }

    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } finally {
    fs.rmSync(tmpExtractDir, { recursive: true, force: true });
  }
}

// ── Print Success Summary ──────────────────────────────────────────────────────
function printSuccess(targetDir, mode, selectedStacks) {
  const agentDir = path.join(targetDir, AGENT_DIR);
  const rulesDir = path.join(agentDir, 'rules');
  const skillsDir = path.join(agentDir, 'skills');
  const workflowsDir = path.join(agentDir, 'workflows');
  const agentsDir = path.join(agentDir, 'agents');

  const rulesCount = fs.existsSync(rulesDir)
    ? fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md')).length
    : 0;
  const skillsCount = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
    : 0;
  const workflowsCount = fs.existsSync(workflowsDir)
    ? fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.md')).length
    : 0;
  const agentsCount = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md')).length
    : 0;
  const totalFiles = countFiles(agentDir);

  const modeLabel =
    mode === 'default'
      ? `${icon.rocket} Default`
      : mode === 'curated'
        ? `${icon.target} Curated`
        : `${icon.gear} Advanced`;

  console.log(`
${c.green}${c.bold}  Installation complete! ${icon.rocket}${c.reset}

  ${icon.check} ${c.bold}${totalFiles} files${c.reset} installed to ${c.cyan}${path.relative(process.cwd(), agentDir) || AGENT_DIR}/${c.reset}
  ${c.dim}Mode: ${modeLabel}${c.reset}

  ${icon.book}  ${c.bold}${rulesCount}${c.reset} Rules      ${c.dim}Security, architecture, testing standards${c.reset}
  ${icon.tool}  ${c.bold}${skillsCount}${c.reset} Skills     ${c.dim}Debugging, design, code review, language idioms${c.reset}
  ${icon.cycle}  ${c.bold}${workflowsCount}${c.reset} Workflows  ${c.dim}End-to-end dev processes${c.reset}
  🤖  ${c.bold}${agentsCount}${c.reset} Agents     ${c.dim}Specialized multi-agent personas${c.reset}
`);

  if (selectedStacks && selectedStacks.size > 0) {
    const stackLabels = [...selectedStacks].sort().join(', ');
    console.log(`  ${icon.arrow} ${c.dim}Stacks: ${stackLabels}${c.reset}`);
  }

  console.log(`
  ${icon.arrow} ${c.dim}Your AI agent will automatically pick up the${c.reset}
    ${c.dim}${AGENT_DIR}/ directory. No additional configuration needed.${c.reset}

  💡 ${c.bold}Quick start${c.reset} — open a chat with your agent and try:
     ${c.cyan}/workflow-solo${c.reset}  ${c.dim}Build a feature end-to-end (single agent)${c.reset}
     ${c.cyan}/workflow-team${c.reset}  ${c.dim}Build with multi-agent orchestration${c.reset}
     ${c.cyan}/audit${c.reset}          ${c.dim}Review code quality${c.reset}

  ${icon.shield}  ${c.dim}Learn more: ${c.cyan}https://github.com/${REPO_OWNER}/${REPO_NAME}${c.reset}
`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  printBanner();

  const targetAgentDir = path.join(options.targetDir, AGENT_DIR);

  // ── Check existing .agvrc for additive stacks ──
  const existingRc = readAgvrc(options.targetDir);

  // ── Handle additive --stacks with existing config ──
  if (options.stacks && existingRc && !options.force) {
    console.log(`  ${icon.arrow} Found existing config (${existingRc.mode}: ${existingRc.stacks.join(', ')})`);
    console.log(`  ${icon.arrow} Adding stacks: ${options.stacks.join(', ')}`);
    const mergedStacks = new Set([...existingRc.stacks, ...options.stacks]);
    options.stacks = [...mergedStacks];
    options._additive = true;
  }

  // ── Handle existing .agents directory ──
  if (fs.existsSync(targetAgentDir)) {
    if (!options.force && !options._additive) {
      // Non-TTY environments can't prompt — auto-overwrite
      if (!process.stdin.isTTY) {
        console.log(`  ${icon.arrow} ${c.dim}Existing ${AGENT_DIR}/ found — overwriting (non-interactive mode).${c.reset}`);
      } else if (existingRc && !options.stacks && !options.all) {
        // Offer to re-use existing config
        const stackList = existingRc.stacks.join(', ');
        console.log(
          `  ${icon.arrow} ${c.dim}Found existing config${c.reset} ${c.bold}(${existingRc.mode}: ${stackList})${c.reset}`
        );
        const answer = await promptUser(
          `  ${c.bold}Re-install with same config?${c.reset} ${c.dim}(Y/n)${c.reset} `
        );

        if (answer === '' || answer === 'y' || answer === 'yes') {
          options.stacks = existingRc.stacks;
          options._mode = existingRc.mode;
        }
      }

      if (process.stdin.isTTY && !options.stacks && !options.all) {
        console.log(
          `  ${icon.warn}  ${c.yellow}An existing ${AGENT_DIR}/ directory was found at:${c.reset}`
        );
        console.log(`     ${c.dim}${targetAgentDir}${c.reset}\n`);
        const answer = await promptUser(
          `  ${c.bold}Overwrite? ${c.reset}${c.dim}(y/N)${c.reset} `
        );
        if (answer !== 'y' && answer !== 'yes') {
          console.log(`\n  ${icon.arrow} ${c.dim}Installation cancelled.${c.reset}\n`);
          process.exit(0);
        }
      }
    }

    console.log(`  ${icon.arrow} Removing existing ${AGENT_DIR}/ directory...`);
    fs.rmSync(targetAgentDir, { recursive: true, force: true });
  }

  // ── Download ──
  const tmpDir = os.tmpdir();
  const tarballPath = path.join(tmpDir, `awesome-agv-${Date.now()}.tar.gz`);

  try {
    console.log(`  ${icon.arrow} Fetching latest configuration from GitHub...`);
    await downloadToFile(TARBALL_URL, tarballPath);

    // ── Read manifest ──
    console.log(`  ${icon.arrow} Reading manifest...`);
    const manifest = readManifest(tarballPath);

    // ── Determine what to install ──
    let mode = options._mode || 'default';
    let selectedStackKeys;
    let deselected = { rules: null, coreSkills: null, agents: null, workflows: null };
    let extractConfig = { ...manifest, _deselectedRules: null, _deselectedAgents: null, _deselectedWorkflows: null };

    if (options.all) {
      // ── Default: install everything ──
      mode = 'default';
      selectedStackKeys = new Set(Object.keys(manifest.skills.stacks));
    } else if (options.stacks) {
      // ── Non-interactive stacks ──
      mode = options._mode || 'curated';
      // Validate stack names against manifest
      const validStackKeys = new Set(Object.keys(manifest.skills.stacks));
      const unknownStacks = options.stacks.filter((s) => !validStackKeys.has(s));
      if (unknownStacks.length > 0) {
        console.log(`  ${icon.warn}  ${c.yellow}Unknown stack(s): ${unknownStacks.join(', ')}${c.reset}`);
        console.log(`  ${c.dim}  Available: ${[...validStackKeys].sort().join(', ')}${c.reset}`);
        console.log('');
      }
      const validStacks = options.stacks.filter((s) => validStackKeys.has(s));
      const resolvedStacks = resolveRequires(new Set(validStacks), manifest);
      selectedStackKeys = resolvedStacks;
    } else {
      // ── Interactive mode selection (requires TTY) ──
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        // Non-interactive environment (CI, piped input) — default to full install
        console.log(`  ${icon.arrow} ${c.dim}Non-interactive environment detected — defaulting to full install.${c.reset}`);
        console.log(`  ${c.dim}  Use --stacks <list> or --all to control installation non-interactively.${c.reset}`);
        console.log('');
        mode = 'default';
        selectedStackKeys = new Set(Object.keys(manifest.skills.stacks));
      } else {
        mode = await promptSelect('How would you like to install?', [
          { value: 'default', label: `${icon.rocket}  ${c.bold}Default${c.reset}       — Install everything. The full arsenal. ${c.dim}(recommended)${c.reset}` },
          { value: 'curated', label: `${icon.target}  ${c.bold}Curated${c.reset}       — Pick your languages & frameworks. Core always included.` },
          { value: 'advanced', label: `${icon.gear}  ${c.bold}Advanced${c.reset}      — Full control. Pick rules, skills, agents, everything.` },
        ]);

        if (mode === 'default') {
          selectedStackKeys = new Set(Object.keys(manifest.skills.stacks));
        } else {
          // ── Auto-detect stacks ──
          const detected = detectStacks(options.targetDir, manifest);
          if (detected.size > 0) {
            console.log(`  ${c.dim}Auto-detected from project files:${c.reset}`);
            for (const key of detected) {
              const stack = manifest.skills.stacks[key];
              const detectedFile = stack.detect?.[0] || '';
              console.log(`    ${icon.check} ${c.bold}${stack.label}${c.reset}  ${c.dim}(found ${detectedFile})${c.reset}`);
            }
            console.log('');
          }

          // ── Build stack selection tree ──
          const treeItems = buildStackTree(manifest);
          const selectItems = treeItems.map((item) => {
            if (item.separator) return item;
            return {
              ...item,
              checked: detected.has(item.key),
              disabled: false,
            };
          });

          const selectedItems = await promptMultiSelect(
            mode === 'curated'
              ? `${icon.target} Curated — Pick your stacks. Core is always included.`
              : `${icon.gear} Advanced — Select stacks:`,
            selectItems,
            (items) => {
              const count = items.filter((i) => i.checked && !i.separator).length;
              return `${c.dim}${count} stack(s) selected · (space to toggle, enter to confirm)${c.reset}`;
            }
          );

          const rawKeys = new Set(selectedItems.map((i) => i.key));
          selectedStackKeys = resolveRequires(rawKeys, manifest);

          // ── Advanced mode: granular selection (future) ──
          if (mode === 'advanced') {
            console.log(`  ${c.dim}Advanced mode: all rules, agents, and workflows are included.${c.reset}`);
            console.log(`  ${c.dim}To customize further, edit ${AGENT_DIR}/ after installation.${c.reset}`);
            console.log('');
          }
        }
      } // end TTY block
    }


    // ── Build final skill set ──
    const selectedSkills = buildSkillsSet(selectedStackKeys, manifest);

    // Handle advanced mode deselected core skills
    if (deselected.coreSkills && deselected.coreSkills.size > 0) {
      for (const skill of deselected.coreSkills) {
        selectedSkills.delete(skill);
      }
    }

    // ── Extract ──
    console.log(`  ${icon.arrow} Extracting ${AGENT_DIR}/ directory...`);
    const actualSkillsCopied = extractFiltered(tarballPath, options.targetDir, selectedSkills, extractConfig);
    console.log(`  ${c.dim}  ${actualSkillsCopied} skills installed${c.reset}`);

    // ── Write .agvrc ──
    writeAgvrc(options.targetDir, mode, selectedStackKeys, deselected);

    // ── Success ──
    printSuccess(options.targetDir, mode, selectedStackKeys);
  } catch (err) {
    console.error(`\n  ${icon.error} ${c.red}Installation failed:${c.reset} ${err.message}\n`);

    if (fs.existsSync(targetAgentDir)) {
      fs.rmSync(targetAgentDir, { recursive: true, force: true });
    }

    process.exit(1);
  } finally {
    if (fs.existsSync(tarballPath)) {
      fs.unlinkSync(tarballPath);
    }
  }
}

main();
