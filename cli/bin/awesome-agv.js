#!/usr/bin/env node

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const { createInterface } = require('readline');
const { execFileSync } = require('child_process');
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
const BACKUP_DIR_NAME = '.agv-backup';
const BACKUP_PATTERN = /^agents-\d{8}-\d{6}(?:-\d+)?$/;
const GITIGNORE_ENTRIES = ['.agentwork/', '.agv-backup/'];

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
  -f, --force         Skip the overwrite prompt and ignore the saved .agvrc (fresh selection).
                      The existing .agents/ is still backed up and custom items carried over.
  -h, --help          Show this help message

${c.bold}ENVIRONMENT${c.reset}
  AGV_LOCAL_TARBALL   Install from a local .tar.gz instead of downloading from GitHub.
                      The archive must contain awesome-agv-main/.agents/ and agv.config.json.

${c.bold}UPGRADES${c.reset}
  Re-running the installer updates .agents/ in place. The previous copy is moved to
  .agv-backup/agents-<timestamp>/ (5 most recent kept), and your own skills, rules and
  agents (names not shipped upstream) are carried over. Edits to shipped files are not
  carried over — recover them from the backup.

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
        selected = (selected - 1 + options.length) % options.length;
        render();
      } else if (key === '\x1b[B') {
        selected = (selected + 1) % options.length;
        render();
      } else if (key === '\r' || key === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        console.log('');
        resolve(options[selected].value);
      } else if (key === '\x03') {
        process.stdin.setRawMode(false);
        process.exit(0);
      }
    };

    process.stdin.on('data', onData);
  });
}

// ── Multi-Select Menu (arrow keys, space, enter) ───────────────────────────────
function promptMultiSelect(title, items, footerFn) {
  return new Promise((resolve) => {
    let cursor = 0;
    while (cursor < items.length && items[cursor].disabled) cursor++;

    function render() {
      const totalLines = items.length + 4;
      process.stdout.write(`\x1b[${totalLines}A\x1b[J`);
      console.log(`  ${c.bold}${title}${c.reset}\n`);
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

    console.log(`  ${c.bold}${title}${c.reset}\n`);
    for (const item of items) {
      console.log('');
    }
    console.log('\n');
    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (key) => {
      if (key === '\x1b[A') {
        let next = (cursor - 1 + items.length) % items.length;
        let attempts = 0;
        while ((items[next].separator || items[next].disabled) && attempts < items.length) {
          next = (next - 1 + items.length) % items.length;
          attempts++;
        }
        cursor = next;
        render();
      } else if (key === '\x1b[B') {
        let next = (cursor + 1) % items.length;
        let attempts = 0;
        while ((items[next].separator || items[next].disabled) && attempts < items.length) {
          next = (next + 1) % items.length;
          attempts++;
        }
        cursor = next;
        render();
      } else if (key === ' ') {
        const item = items[cursor];
        if (!item.separator && !item.disabled) {
          item.checked = !item.checked;
          if (item.checked && item.requires) {
            for (const reqKey of item.requires) {
              const parent = items.find((i) => i.key === reqKey);
              if (parent && !parent.checked) {
                parent.checked = true;
              }
            }
          }
          if (!item.checked) {
            let cascadeChanged = true;
            while (cascadeChanged) {
              cascadeChanged = false;
              for (const child of items) {
                if (child.checked && child.requires) {
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

  const detectionMap = {};
  for (const [key, stack] of Object.entries(stacks)) {
    if (!stack.detect || stack.detect.length === 0) continue;
    for (const pattern of stack.detect) {
      if (!pattern.includes('*')) {
        if (!detectionMap[pattern]) detectionMap[pattern] = [];
        detectionMap[pattern].push(key);
      }
    }
  }

  const scanDirs = [targetDir];
  const subDirs = ['apps', 'src', 'packages', 'services'];
  for (const sub of subDirs) {
    const subPath = path.join(targetDir, sub);
    if (fs.existsSync(subPath) && fs.statSync(subPath).isDirectory()) {
      scanDirs.push(subPath);
      try {
        for (const entry of fs.readdirSync(subPath, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            scanDirs.push(path.join(subPath, entry.name));
          }
        }
      } catch (err) {
        // Skip unreadable subdirectories
      }
    }
  }

  for (const dir of scanDirs) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch (err) {
      continue;
    }
    for (const entry of entries) {
      if (detectionMap[entry]) {
        for (const stackKey of detectionMap[entry]) {
          detected.add(stackKey);
        }
      }
      for (const [key, stack] of Object.entries(stacks)) {
        if (!stack.detect) continue;
        for (const pattern of stack.detect) {
          if (pattern.startsWith('*.')) {
            const ext = pattern.slice(1);
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

  const languages = {};
  const frameworks = {};

  for (const [key, stack] of Object.entries(stacks)) {
    if (stack.requires && stack.requires.length > 0) {
      frameworks[key] = stack;
    } else {
      languages[key] = stack;
    }
  }

  const coreLanguages = Object.entries(languages).filter(([, s]) => s.group === 'core');
  const communityLanguages = Object.entries(languages).filter(([, s]) => s.group === 'community');

  function getChildren(parentKey) {
    const children = [];
    for (const [key, fw] of Object.entries(frameworks)) {
      if (fw.requires.includes(parentKey)) {
        children.push([key, fw]);
      }
    }
    return children;
  }

  function addWithChildren(key, stack, indent) {
    tree.push({ key, indent, label: `${stack.label.padEnd(14)}— ${stack.description}`, requires: stack.requires || null });
    const children = getChildren(key);
    for (const [childKey, childStack] of children) {
      addWithChildren(childKey, childStack, indent + 1);
    }
  }

  tree.push({ separator: true, label: '── Core Stacks ──────────────────────────────────────' });
  for (const [key, stack] of coreLanguages) {
    addWithChildren(key, stack, 0);
  }

  if (communityLanguages.length > 0) {
    tree.push({ separator: true, label: '── Community Languages ──────────────────────────────' });
    for (const [key, stack] of communityLanguages) {
      addWithChildren(key, stack, 0);
    }
  }

  return tree;
}

// ── HTTP Download with Redirect Following & Timeout (SEC-02, SEC-05) ───────────
function downloadToFile(urlStr, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    let currentUrl;
    try {
      currentUrl = new URL(urlStr);
    } catch (urlErr) {
      return reject(new Error(`Invalid URL: ${urlStr} (${urlErr.message})`));
    }

    if (currentUrl.protocol !== 'https:') {
      return reject(
        new Error(`Insecure download protocol rejected: ${currentUrl.protocol} (only https: is permitted)`)
      );
    }

    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects while downloading archive'));
    }

    const cleanupDest = () => {
      try {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      } catch (err) {
        // Ignore unlink error on cleanup
      }
    };

    const req = https.get(currentUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        let redirectUrl;
        try {
          redirectUrl = new URL(res.headers.location, currentUrl).href;
        } catch (redirectErr) {
          cleanupDest();
          return reject(
            new Error(`Invalid redirect Location: ${res.headers.location} (${redirectErr.message})`)
          );
        }

        downloadToFile(redirectUrl, destPath, maxRedirects - 1)
          .then(resolve)
          .catch((err) => {
            cleanupDest();
            reject(err);
          });
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        cleanupDest();
        return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });

      fileStream.on('error', (err) => {
        cleanupDest();
        reject(err);
      });

      res.on('error', (err) => {
        cleanupDest();
        reject(err);
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      cleanupDest();
      reject(new Error('Download timed out after 30 seconds'));
    });

    req.on('error', (err) => {
      cleanupDest();
      reject(err);
    });
  });
}

// ── Tarball Resolution (C-CLI-ENV) ─────────────────────────────────────────────
function resolveTarballSource() {
  const envVal = process.env.AGV_LOCAL_TARBALL;
  if (envVal !== undefined && envVal !== '') {
    if (!envVal.endsWith('.tar.gz')) {
      throw new Error(`AGV_LOCAL_TARBALL must end with '.tar.gz': received '${envVal}'`);
    }
    let resolved;
    try {
      resolved = fs.realpathSync(envVal);
    } catch (err) {
      throw new Error(`AGV_LOCAL_TARBALL file does not exist or cannot be resolved: '${envVal}' (${err.message})`);
    }
    let stat;
    try {
      stat = fs.lstatSync(resolved);
    } catch (err) {
      throw new Error(`Cannot stat AGV_LOCAL_TARBALL: '${resolved}' (${err.message})`);
    }
    if (stat.isSymbolicLink()) {
      try {
        stat = fs.statSync(resolved);
      } catch (err) {
        throw new Error(`Cannot resolve symlink target for AGV_LOCAL_TARBALL: '${resolved}' (${err.message})`);
      }
    }
    if (!stat.isFile()) {
      throw new Error(`AGV_LOCAL_TARBALL is not a regular file: '${resolved}'`);
    }
    console.log(`  ${icon.arrow} Using local tarball (AGV_LOCAL_TARBALL): ${resolved}`);
    return { tarballPath: resolved, isLocal: true };
  }
  return { tarballPath: null, isLocal: false };
}

// ── Path & Entry Validation ────────────────────────────────────────────────────
function isValidEntryName(name) {
  if (typeof name !== 'string' || name.length === 0) return false;
  if (name.includes('/') || name.includes('\\')) return false;
  if (name === '.' || name === '..' || name.includes('..')) return false;
  return true;
}

// ── Safe Recursive Copy (Skips Symlinks) ────────────────────────────────────────
function copySafeNoSymlinks(src, dest) {
  let stat;
  try {
    stat = fs.lstatSync(src);
  } catch (err) {
    console.log(`  ${icon.warn}  ${c.yellow}Could not access path:${c.reset} ${src} (${err.message})`);
    return;
  }

  if (stat.isSymbolicLink()) {
    console.log(`  ${icon.warn}  ${c.yellow}Skipping symlink:${c.reset} ${src}`);
    return;
  }

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    let entries;
    try {
      entries = fs.readdirSync(src);
    } catch (err) {
      console.log(`  ${icon.warn}  ${c.yellow}Could not read directory:${c.reset} ${src} (${err.message})`);
      return;
    }
    for (const entry of entries) {
      if (!isValidEntryName(entry)) {
        console.log(`  ${icon.warn}  ${c.yellow}Skipping unsafe entry name:${c.reset} ${entry}`);
        continue;
      }
      copySafeNoSymlinks(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// ── Copy Directory with Exclusion Filter ───────────────────────────────────────
function copyDirFiltered(src, dest, excludeSet) {
  fs.mkdirSync(dest, { recursive: true });
  let entries;
  try {
    entries = fs.readdirSync(src);
  } catch (err) {
    console.log(`  ${icon.warn}  ${c.yellow}Could not read directory:${c.reset} ${src} (${err.message})`);
    return;
  }
  for (const entry of entries) {
    if (!isValidEntryName(entry)) continue;
    const baseName = entry.replace(/\.md$/, '');
    if (excludeSet && excludeSet.has(baseName)) continue;

    copySafeNoSymlinks(path.join(src, entry), path.join(dest, entry));
  }
}

// ── Count Files Recursively ────────────────────────────────────────────────────
function countFiles(dirPath) {
  let count = 0;
  if (!fs.existsSync(dirPath)) return count;
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return count;
  }
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

// ── Custom Carry-Over from Existing Installation ──────────────────────────────
function carryOverCustomEntries({ targetAgentDir, stagingDir, extractedAgents, manifest }) {
  const carriedOver = [];
  const legacyWorkflows = [];

  if (!fs.existsSync(targetAgentDir)) {
    return { carriedOver, legacyWorkflows, migratedWorkflowCount: 0 };
  }

  // (i) Skill directories under skills/ whose names are NOT in upstream universe
  const tarballSkillsDir = path.join(extractedAgents, 'skills');
  const upstreamSkillNames = new Set();
  if (fs.existsSync(tarballSkillsDir)) {
    for (const ent of fs.readdirSync(tarballSkillsDir, { withFileTypes: true })) {
      if (ent.isDirectory()) upstreamSkillNames.add(ent.name);
    }
  }
  if (Array.isArray(manifest.skills?.retired)) {
    for (const r of manifest.skills.retired) upstreamSkillNames.add(r);
  }

  const existingSkillsDir = path.join(targetAgentDir, 'skills');
  if (fs.existsSync(existingSkillsDir)) {
    for (const ent of fs.readdirSync(existingSkillsDir, { withFileTypes: true })) {
      if (!isValidEntryName(ent.name)) {
        console.log(`  ${icon.warn}  ${c.yellow}Skipping invalid skill directory name:${c.reset} ${ent.name}`);
        continue;
      }
      const existingSkillPath = path.join(existingSkillsDir, ent.name);
      let stat;
      try {
        stat = fs.lstatSync(existingSkillPath);
      } catch (err) {
        console.log(`  ${icon.warn}  ${c.yellow}Could not access ${existingSkillPath}:${c.reset} ${err.message}`);
        continue;
      }
      if (stat.isSymbolicLink()) {
        console.log(`  ${icon.warn}  ${c.yellow}Skipping symlink in custom skills:${c.reset} ${existingSkillPath}`);
        continue;
      }
      if (stat.isDirectory() && !upstreamSkillNames.has(ent.name)) {
        const stagingSkillPath = path.join(stagingDir, 'skills', ent.name);
        copySafeNoSymlinks(existingSkillPath, stagingSkillPath);
        carriedOver.push(`skills/${ent.name}`);
      }
    }
  }

  // (ii) Files/dirs under rules/ and agents/ whose names do not exist in tarball's corresponding dirs
  for (const sub of ['rules', 'agents']) {
    const tarballSubDir = path.join(extractedAgents, sub);
    const upstreamNames = new Set();
    if (fs.existsSync(tarballSubDir)) {
      for (const ent of fs.readdirSync(tarballSubDir, { withFileTypes: true })) {
        upstreamNames.add(ent.name);
      }
    }

    const existingSubDir = path.join(targetAgentDir, sub);
    if (fs.existsSync(existingSubDir)) {
      for (const ent of fs.readdirSync(existingSubDir, { withFileTypes: true })) {
        if (!isValidEntryName(ent.name)) {
          console.log(`  ${icon.warn}  ${c.yellow}Skipping invalid entry name in ${sub}:${c.reset} ${ent.name}`);
          continue;
        }
        const existingEntryPath = path.join(existingSubDir, ent.name);
        let stat;
        try {
          stat = fs.lstatSync(existingEntryPath);
        } catch (err) {
          console.log(`  ${icon.warn}  ${c.yellow}Could not access ${existingEntryPath}:${c.reset} ${err.message}`);
          continue;
        }
        if (stat.isSymbolicLink()) {
          console.log(`  ${icon.warn}  ${c.yellow}Skipping symlink in ${sub}:${c.reset} ${existingEntryPath}`);
          continue;
        }
        if (!upstreamNames.has(ent.name)) {
          const stagingEntryPath = path.join(stagingDir, sub, ent.name);
          copySafeNoSymlinks(existingEntryPath, stagingEntryPath);
          carriedOver.push(`${sub}/${ent.name}`);
        }
      }
    }
  }

  // (iii) Legacy workflows/ dir is NOT carried into .agents/ (it stays in the backup).
  // Workflows shipped upstream now exist as same-named command skills, so only
  // custom workflows are reported — those are the ones the user must convert.
  let migratedWorkflowCount = 0;
  const existingWorkflowsDir = path.join(targetAgentDir, 'workflows');
  if (fs.existsSync(existingWorkflowsDir)) {
    try {
      for (const ent of fs.readdirSync(existingWorkflowsDir, { withFileTypes: true })) {
        if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
        if (upstreamSkillNames.has(ent.name.slice(0, -'.md'.length))) {
          migratedWorkflowCount++;
        } else {
          legacyWorkflows.push(ent.name);
        }
      }
    } catch (err) {
      console.log(`  ${icon.warn}  ${c.yellow}Could not read existing workflows directory:${c.reset} ${err.message}`);
    }
  }

  return { carriedOver, legacyWorkflows, migratedWorkflowCount };
}

// ── Extract into Staging Directory with Carry-Over (SEC-01, SEC-06) ───────────
function extractToStaging(tarballPath, stagingDir, targetAgentDir, selectedSkills, config) {
  const tmpExtractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'awesome-agv-extract-'));
  fs.chmodSync(tmpExtractDir, 0o700);
  let skillsCopied = 0;

  try {
    execFileSync('tar', ['-xzf', tarballPath, '-C', tmpExtractDir], { stdio: 'pipe' });

    const extractedAgents = path.join(tmpExtractDir, `${REPO_NAME}-${BRANCH}`, AGENT_DIR);
    if (!fs.existsSync(extractedAgents)) {
      throw new Error(`Could not find ${REPO_NAME}-${BRANCH}/${AGENT_DIR} in archive`);
    }

    fs.mkdirSync(stagingDir, { mode: 0o700, recursive: true });
    fs.chmodSync(stagingDir, 0o700);

    // Copy core paths (rules/, agents/)
    for (const corePath of config.core.paths) {
      const src = path.join(extractedAgents, corePath);
      const dest = path.join(stagingDir, corePath);
      if (fs.existsSync(src)) {
        if (config._deselectedRules && corePath === 'rules/') {
          copyDirFiltered(src, dest, config._deselectedRules);
        } else if (config._deselectedAgents && corePath === 'agents/') {
          copyDirFiltered(src, dest, config._deselectedAgents);
        } else {
          copyDirFiltered(src, dest, null);
        }
      }
    }

    // Copy selected skills only
    const skillsSrc = path.join(extractedAgents, 'skills');
    const skillsDest = path.join(stagingDir, 'skills');
    fs.mkdirSync(skillsDest, { recursive: true });

    if (fs.existsSync(skillsSrc)) {
      const allSkillDirs = fs.readdirSync(skillsSrc, { withFileTypes: true });
      for (const entry of allSkillDirs) {
        if (entry.isDirectory() && selectedSkills.has(entry.name)) {
          copySafeNoSymlinks(
            path.join(skillsSrc, entry.name),
            path.join(skillsDest, entry.name)
          );
          skillsCopied++;
        }
      }
    }

    // Carry over custom entries from existing .agents/ into staging
    const { carriedOver, legacyWorkflows, migratedWorkflowCount } = carryOverCustomEntries({
      targetAgentDir,
      stagingDir,
      extractedAgents,
      manifest: config,
    });

    return { skillsCopied, carriedOver, legacyWorkflows, migratedWorkflowCount };
  } finally {
    try {
      fs.rmSync(tmpExtractDir, { recursive: true, force: true });
    } catch (err) {
      console.log(`  ${icon.warn}  ${c.yellow}Failed to remove temp extract directory:${c.reset} ${err.message}`);
    }
  }
}

// ── Agent Directory Safety Inspection (SEC-03) ─────────────────────────────────
function inspectAgentDir(targetAgentDir) {
  try {
    const stat = fs.lstatSync(targetAgentDir);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Target directory '${targetAgentDir}' is a symbolic link. ` +
        `Refusing to proceed to prevent unsafe file operations. ` +
        `Please remove or resolve the symlink manually before installing.`
      );
    }
    if (!stat.isDirectory()) {
      throw new Error(
        `Target '${targetAgentDir}' exists but is not a directory. ` +
        `Please remove or resolve it manually before installing.`
      );
    }
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

// ── Backup Directory Safety Inspection (SEC-04) ────────────────────────────────
function inspectBackupDir(backupDir) {
  try {
    const stat = fs.lstatSync(backupDir);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Backup directory '${backupDir}' is a symbolic link. ` +
        `Refusing to proceed to prevent unsafe file operations. ` +
        `Please remove or resolve the symlink manually before installing.`
      );
    }
    if (!stat.isDirectory()) {
      throw new Error(
        `Backup path '${backupDir}' exists but is not a directory. ` +
        `Please remove or resolve it manually before installing.`
      );
    }
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

// ── Backup Timestamp & Management (C-CLI-BACKUP, SEC-04) ───────────────────────
function formatBackupTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${YYYY}${MM}${DD}-${HH}${mm}${ss}`;
}

function pruneBackups(backupDir, keepCount = 5) {
  const exists = inspectBackupDir(backupDir);
  if (!exists) return;

  let entries;
  try {
    entries = fs.readdirSync(backupDir);
  } catch (err) {
    console.log(`  ${icon.warn}  ${c.yellow}Could not read backup directory for cleanup:${c.reset} ${err.message}`);
    return;
  }

  const matchingDirs = [];
  for (const name of entries) {
    if (!BACKUP_PATTERN.test(name)) continue;
    const entryPath = path.join(backupDir, name);
    try {
      const stat = fs.lstatSync(entryPath);
      if (!stat.isSymbolicLink() && stat.isDirectory()) {
        matchingDirs.push(name);
      }
    } catch (err) {
      // Ignore unreadable entries
    }
  }

  matchingDirs.sort().reverse();

  if (matchingDirs.length > keepCount) {
    const toDelete = matchingDirs.slice(keepCount);
    for (const dirName of toDelete) {
      const fullPath = path.join(backupDir, dirName);
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } catch (err) {
        console.log(`  ${icon.warn}  ${c.yellow}Failed to prune old backup ${dirName}:${c.reset} ${err.message}`);
      }
    }
  }
}

// ── Safe Swap with Rollback (SEC-03, SEC-04, SEC-06) ───────────────────────────
function performSafeSwap(stagingDir, targetAgentDir, targetDir) {
  let backupPath = null;
  const existingExists = inspectAgentDir(targetAgentDir);

  if (existingExists) {
    const backupDir = path.join(targetDir, BACKUP_DIR_NAME);
    const backupDirExists = inspectBackupDir(backupDir);
    if (!backupDirExists) {
      fs.mkdirSync(backupDir, { mode: 0o700, recursive: true });
      fs.chmodSync(backupDir, 0o700);
    }

    const ts = formatBackupTimestamp();
    let backupName = `agents-${ts}`;
    backupPath = path.join(backupDir, backupName);
    let counter = 1;
    while (fs.existsSync(backupPath)) {
      backupName = `agents-${ts}-${counter++}`;
      backupPath = path.join(backupDir, backupName);
    }

    fs.renameSync(targetAgentDir, backupPath);

    try {
      fs.renameSync(stagingDir, targetAgentDir);
    } catch (swapErr) {
      try {
        fs.renameSync(backupPath, targetAgentDir);
      } catch (rollbackErr) {
        console.error(
          `  ${icon.error} ${c.red}CRITICAL: Swap failed and automatic rollback failed: ${rollbackErr.message}\n` +
          `  Your original configuration is preserved at:\n    ${backupPath}\n` +
          `  Please restore it manually by moving it back to:\n    ${targetAgentDir}${c.reset}`
        );
      }
      throw swapErr;
    }

    pruneBackups(backupDir, 5);
  } else {
    fs.renameSync(stagingDir, targetAgentDir);
  }

  return backupPath;
}

// ── Write .agvrc ───────────────────────────────────────────────────────────────
function writeAgvrc(stagingDir, mode, selectedStacks, deselected) {
  const rcPath = path.join(stagingDir, CONFIG_FILE);
  const config = {
    version: require('../package.json').version,
    mode,
    stacks: [...selectedStacks].sort(),
    deselected_rules: deselected.rules ? [...deselected.rules].sort() : [],
    deselected_core_skills: deselected.coreSkills ? [...deselected.coreSkills].sort() : [],
    deselected_agents: deselected.agents ? [...deselected.agents].sort() : [],
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(rcPath, JSON.stringify(config, null, 2) + '\n');
}

// ── Read existing .agvrc ───────────────────────────────────────────────────────
const VALID_MODES = new Set(['default', 'curated', 'advanced']);

/**
 * Returns true when a parsed .agvrc has the fields the installer relies on.
 * The file is user-editable, so its shape is untrusted input.
 */
function isValidAgvrc(rc) {
  return (
    rc !== null &&
    typeof rc === 'object' &&
    !Array.isArray(rc) &&
    VALID_MODES.has(rc.mode) &&
    Array.isArray(rc.stacks) &&
    rc.stacks.every((s) => typeof s === 'string')
  );
}

/**
 * Reads .agents/.agvrc. Returns null when absent, unreadable, a symlink,
 * or malformed — callers then fall back to a fresh install selection.
 */
function readAgvrc(targetDir) {
  const rcPath = path.join(targetDir, AGENT_DIR, CONFIG_FILE);
  let parsed;
  try {
    const stat = fs.lstatSync(rcPath);
    if (stat.isSymbolicLink() || !stat.isFile()) return null;
    parsed = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`  ${icon.warn}  ${c.yellow}Could not parse ${CONFIG_FILE}:${c.reset} ${err.message}`);
    }
    return null;
  }
  if (!isValidAgvrc(parsed)) {
    console.error(
      `  ${icon.warn}  ${c.yellow}Ignoring malformed ${CONFIG_FILE}${c.reset} ${c.dim}(expected "mode" and a "stacks" string array)${c.reset}`
    );
    return null;
  }
  return parsed;
}

// ── Patch .gitignore ───────────────────────────────────────────────────────────
/**
 * Ensures .agentwork/ and .agv-backup/ are listed in .gitignore.
 * Creates .gitignore if it doesn't exist.
 * Returns: 'created' | 'patched' | 'already_present'
 */
function patchGitignore(targetDir) {
  const gitignorePath = path.join(targetDir, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, GITIGNORE_ENTRIES.join('\n') + '\n', 'utf8');
    return 'created';
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n').map((l) => l.trim());

  const missing = GITIGNORE_ENTRIES.filter((entry) => !lines.includes(entry));
  if (missing.length === 0) {
    return 'already_present';
  }

  const separator = content.endsWith('\n') ? '' : '\n';
  fs.appendFileSync(gitignorePath, `${separator}${missing.join('\n')}\n`, 'utf8');
  return 'patched';
}

// ── Read Manifest from Archive or Bundle (SEC-01, SEC-06) ──────────────────────
function readManifest(tarballPath) {
  const tmpExtractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'awesome-agv-manifest-'));
  fs.chmodSync(tmpExtractDir, 0o700);

  try {
    // Extract only the manifest file
    try {
      execFileSync(
        'tar',
        ['-xzf', tarballPath, '--strip-components=1', '-C', tmpExtractDir, `${REPO_NAME}-${BRANCH}/agv.config.json`],
        { stdio: 'pipe' }
      );
    } catch (err) {
      // Fallback: extract everything and find it
      try {
        execFileSync('tar', ['-xzf', tarballPath, '-C', tmpExtractDir], { stdio: 'pipe' });
      } catch (innerErr) {
        // Fall back to bundled manifest if extraction fails
      }
    }

    // Try both locations in the extracted archive
    let manifestPath = path.join(tmpExtractDir, 'agv.config.json');
    if (!fs.existsSync(manifestPath)) {
      manifestPath = path.join(tmpExtractDir, `${REPO_NAME}-${BRANCH}`, 'agv.config.json');
    }

    // Fallback: bundled copy shipped with the CLI package
    // When installed via npm, layout is: cli/bin/awesome-agv.js + cli/agv.config.json
    if (!fs.existsSync(manifestPath)) {
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
    try {
      fs.rmSync(tmpExtractDir, { recursive: true, force: true });
    } catch (err) {
      console.log(`  ${icon.warn}  ${c.yellow}Failed to remove temp manifest directory:${c.reset} ${err.message}`);
    }
  }
}

// ── Print Success Summary ──────────────────────────────────────────────────────
function printSuccess(targetDir, mode, selectedStacks, gitignoreResult) {
  const agentDir = path.join(targetDir, AGENT_DIR);
  const rulesDir = path.join(agentDir, 'rules');
  const skillsDir = path.join(agentDir, 'skills');
  const agentsDir = path.join(agentDir, 'agents');

  const rulesCount = fs.existsSync(rulesDir)
    ? fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md')).length
    : 0;
  const skillsCount = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
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

  let gitignoreMsg;
  if (gitignoreResult === 'created') {
    gitignoreMsg = `${icon.check} ${c.bold}.gitignore${c.reset} created with ${c.cyan}.agentwork/${c.reset} and ${c.cyan}.agv-backup/${c.reset}`;
  } else if (gitignoreResult === 'patched') {
    gitignoreMsg = `${icon.check} ${c.bold}.gitignore${c.reset} patched — added ${c.cyan}.agentwork/${c.reset} and ${c.cyan}.agv-backup/${c.reset}`;
  } else {
    gitignoreMsg = `${icon.check} ${c.bold}.gitignore${c.reset} already contains required entries`;
  }

  console.log(`
${c.green}${c.bold}  Installation complete! ${icon.rocket}${c.reset}

  ${icon.check} ${c.bold}${totalFiles} files${c.reset} installed to ${c.cyan}${path.relative(process.cwd(), agentDir) || AGENT_DIR}/${c.reset}
  ${c.dim}Mode: ${modeLabel}${c.reset}

  ${icon.book}  ${c.bold}${rulesCount}${c.reset} Rules      ${c.dim}Security, architecture, testing standards${c.reset}
  ${icon.tool}  ${c.bold}${skillsCount}${c.reset} Skills     ${c.dim}Debugging, design, code review, language idioms${c.reset}
  🤖  ${c.bold}${agentsCount}${c.reset} Agents     ${c.dim}Specialized multi-agent personas${c.reset}

  ${gitignoreMsg}
`);

  if (selectedStacks && selectedStacks.size > 0) {
    const stackLabels = [...selectedStacks].sort().join(', ');
    console.log(`  ${icon.arrow} ${c.dim}Stacks: ${stackLabels}${c.reset}`);
  }

  console.log(`
  ${icon.arrow} ${c.dim}Your AI agent will automatically pick up the${c.reset}
    ${c.dim}${AGENT_DIR}/ directory. No additional configuration needed.${c.reset}

  💡 ${c.bold}Quick start${c.reset} — open a chat with your agent and try these command skills:
     ${c.cyan}/workflow-solo${c.reset}  ${c.dim}Build a feature end-to-end (single agent)${c.reset}
     ${c.cyan}/workflow-team${c.reset}  ${c.dim}Build with multi-agent orchestration${c.reset}
     ${c.cyan}/audit${c.reset}          ${c.dim}Review code quality${c.reset}


  ${icon.shield}  ${c.dim}Learn more: ${c.cyan}https://github.com/${REPO_OWNER}/${REPO_NAME}${c.reset}
`);
}

// ── Open URL in default browser (SEC-07) ───────────────────────────────────────
function openUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    return false;
  }
  const platform = os.platform();
  try {
    if (platform === 'darwin') {
      execFileSync('open', [url], { stdio: 'ignore' });
    } else if (platform === 'win32') {
      // Empty string is quoted by Node as "" — the window-title arg `start` expects.
      execFileSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    } else {
      execFileSync('xdg-open', [url], { stdio: 'ignore' });
    }
    return true;
  } catch (err) {
    return false;
  }
}

// ── Offer to Star Repository (SEC-07) ──────────────────────────────────────────
async function offerStarRepo() {
  // Only offer in interactive TTY sessions
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  const repoUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
  const repoSlug = `${REPO_OWNER}/${REPO_NAME}`;

  const answer = await promptUser(
    `  ⭐  ${c.bold}Would you like to star our repository on GitHub?${c.reset} ${c.dim}(Y/n)${c.reset} `
  );

  if (answer === '' || answer === 'y' || answer === 'yes') {
    let starredViaGh = false;
    try {
      execFileSync('gh', ['repo', 'star', repoSlug], { stdio: 'pipe' });
      starredViaGh = true;
    } catch (err) {
      // gh CLI not present, not logged in, or failed
    }

    if (starredViaGh) {
      console.log(`\n  ${icon.check} ${c.green}${c.bold}Thank you for starring ${repoSlug}! ⭐${c.reset}\n`);
    } else {
      console.log(`\n  ${icon.rocket} ${c.cyan}Opening ${repoUrl} in your browser...${c.reset}`);
      const opened = openUrl(repoUrl);
      if (opened) {
        console.log(`  ${icon.check} ${c.green}${c.bold}Thank you for your support! ⭐${c.reset}\n`);
      } else {
        console.log(`  ${icon.arrow} ${c.dim}Please visit: ${c.cyan}${repoUrl}${c.reset} ${c.dim}to star! ⭐${c.reset}\n`);
      }
    }
  } else {
    console.log(`  ${c.dim}No problem! Enjoy using Awesome AGV. 🚀${c.reset}\n`);
  }
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

  // ── Handle overwrite confirmation for existing .agents directory (SEC-03) ──
  const existingAgentsExists = inspectAgentDir(targetAgentDir);
  if (existingAgentsExists) {
    if (!options.force && !options._additive) {
      if (!process.stdin.isTTY) {
        // Non-TTY environments can't prompt — auto-update (the old .agents/ is backed up first)
        console.log(`  ${icon.arrow} ${c.dim}Existing ${AGENT_DIR}/ found — will safely update with backup (non-interactive mode).${c.reset}`);
      } else if (existingRc && !options.stacks && !options.all) {
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
  }

  // ── Resolve Tarball (download or C-CLI-ENV local override) ──
  const tmpDir = os.tmpdir();
  let tarballSource = null;
  let tarballPath = null;
  let stagingDir = null;

  try {
    tarballSource = resolveTarballSource();
    tarballPath = tarballSource.tarballPath;

    if (!tarballSource.isLocal) {
      tarballPath = path.join(tmpDir, `awesome-agv-${Date.now()}.tar.gz`);
      console.log(`  ${icon.arrow} Fetching latest configuration from GitHub...`);
      await downloadToFile(TARBALL_URL, tarballPath);
    }

    // ── Read manifest ──
    console.log(`  ${icon.arrow} Reading manifest...`);
    const manifest = readManifest(tarballPath);

    // ── Determine what to install ──
    let mode = options._mode || 'default';
    let selectedStackKeys;
    let deselected = { rules: null, coreSkills: null, agents: null };
    let extractConfig = { ...manifest, _deselectedRules: null, _deselectedAgents: null };

    if (options.all) {
      mode = 'default';
      selectedStackKeys = new Set(Object.keys(manifest.skills.stacks));
    } else if (options.stacks) {
      mode = options._mode || 'curated';
      const validStackKeys = new Set(Object.keys(manifest.skills.stacks));
      const unknownStacks = options.stacks.filter((s) => !validStackKeys.has(s));
      if (unknownStacks.length > 0) {
        console.log(`  ${icon.warn}  ${c.yellow}Unknown stack(s): ${unknownStacks.join(', ')}${c.reset}`);
        console.log(`  ${c.dim}  Available: ${[...validStackKeys].sort().join(', ')}${c.reset}`);
        console.log('');
      }
      const validStacks = options.stacks.filter((s) => validStackKeys.has(s));
      selectedStackKeys = resolveRequires(new Set(validStacks), manifest);
    } else {
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
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

          if (mode === 'advanced') {
            console.log(`  ${c.dim}Advanced mode: all rules and agents are included.${c.reset}`);
            console.log(`  ${c.dim}To customize further, edit ${AGENT_DIR}/ after installation.${c.reset}`);
            console.log('');
          }
        }
      }
    }

    // ── Build final skill set ──
    const selectedSkills = buildSkillsSet(selectedStackKeys, manifest);

    if (deselected.coreSkills && deselected.coreSkills.size > 0) {
      for (const skill of deselected.coreSkills) {
        selectedSkills.delete(skill);
      }
    }

    // ── Create Staging Directory (same filesystem, SEC-06) ──
    const stagingDirName = `.agents.staging-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    stagingDir = path.join(options.targetDir, stagingDirName);

    // ── Extract into Staging Directory & Carry Over ──
    console.log(`  ${icon.arrow} Extracting configuration into staging area...`);
    const { skillsCopied, carriedOver, legacyWorkflows, migratedWorkflowCount } = extractToStaging(
      tarballPath,
      stagingDir,
      targetAgentDir,
      selectedSkills,
      extractConfig
    );
    console.log(`  ${c.dim}  ${skillsCopied} skills staged${c.reset}`);

    // ── Write .agvrc inside Staging Directory ──
    writeAgvrc(stagingDir, mode, selectedStackKeys, deselected);

    // ── Perform Safe Swap ──
    console.log(`  ${icon.arrow} Applying configuration to ${AGENT_DIR}/...`);
    const backupPath = performSafeSwap(stagingDir, targetAgentDir, options.targetDir);
    stagingDir = null;

    // ── Patch .gitignore ──
    const gitignoreResult = patchGitignore(options.targetDir);

    // ── User Notices for Carried Over & Legacy Items ──
    if (migratedWorkflowCount > 0) {
      console.log(
        `\n  ${icon.check} ${c.dim}${migratedWorkflowCount} built-in workflow(s) replaced by same-named command skills (v4.0.0) — slash commands unchanged.${c.reset}`
      );
    }

    if (legacyWorkflows.length > 0) {
      console.log(`\n  ${icon.warn}  ${c.yellow}Custom legacy workflows found (not carried over — kept in backup):${c.reset}`);
      for (const wf of legacyWorkflows) {
        console.log(`     - ${wf}`);
      }
      console.log(`     ${c.dim}Workflows were replaced by command skills in v4.0.0.${c.reset}`);
      console.log(`     ${c.dim}To restore them, convert each into ${AGENT_DIR}/skills/<name>/SKILL.md${c.reset}`);
    }

    if (carriedOver.length > 0) {
      console.log(`\n  ${icon.check} ${c.bold}Preserved ${carriedOver.length} custom item(s) from previous installation:${c.reset}`);
      for (const item of carriedOver) {
        console.log(`     ${icon.arrow} ${c.cyan}${item}${c.reset}`);
      }
    }

    if (backupPath) {
      const relBackup = path.relative(process.cwd(), backupPath) || backupPath;
      console.log(`\n  ${icon.arrow} Previous ${AGENT_DIR}/ backed up to: ${c.cyan}${relBackup}/${c.reset}`);
      console.log(`  ${c.dim}  (Note: Modified upstream files are not carried over, but are preserved in the backup)${c.reset}`);
    }

    // ── Success Summary ──
    printSuccess(options.targetDir, mode, selectedStackKeys, gitignoreResult);

    // ── Optional Star Repository Prompt ──
    await offerStarRepo();
  } catch (err) {
    console.error(`\n  ${icon.error} ${c.red}Installation failed:${c.reset} ${err.message}\n`);
    // Set exitCode rather than calling process.exit(): exit() terminates
    // synchronously and would skip the finally-block cleanup below.
    process.exitCode = 1;
  } finally {
    if (stagingDir && fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error(`  ${icon.warn}  ${c.yellow}Failed to remove staging directory:${c.reset} ${cleanupErr.message}`);
      }
    }
    if (tarballSource && !tarballSource.isLocal && tarballPath && fs.existsSync(tarballPath)) {
      try {
        fs.unlinkSync(tarballPath);
      } catch (cleanupErr) {
        console.error(`  ${icon.warn}  ${c.yellow}Failed to remove downloaded tarball:${c.reset} ${cleanupErr.message}`);
      }
    }
  }
}

// Errors thrown before the install try-block (e.g. refusing a symlinked .agents/)
// land here, so they are reported cleanly instead of as an unhandled rejection.
main().catch((err) => {
  console.error(`\n  ${icon.error} ${c.red}Installation failed:${c.reset} ${err.message}\n`);
  process.exitCode = 1;
});
