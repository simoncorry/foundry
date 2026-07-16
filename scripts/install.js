#!/usr/bin/env node

// Installer: copies Foundry's install set into another project.
//
// Automates the manual copy the README documents, and doubles as the update
// path: run it again after pulling Foundry and it overwrites the copies with
// the newer versions, reporting what changed.
//
// What it copies (the allowlist IS the copy set; nothing else is read):
//   .cursor/commands/   the source-of-truth commands
//   .claude/commands/   the generated Claude copies
//   .agents/            the generated Codex skills
//   AGENTS.md           the shared rules file
//   CLAUDE.md           the one-line Claude bridge
//   scripts/            the checkers, the phrase list, log rotation (and this file)
//   docs/wiki/          the reference library, only with --wiki
//
// Usage:
//   node scripts/install.js <target-dir> [--wiki] [--dry-run]
//
// --dry-run prints what would change and writes nothing.
// Re-runs overwrite on purpose; treat your copies as consumed, not forked.
// If you've deliberately diverged a file, don't re-run blind.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const foundryRoot = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));

const COPY_SET = ['.cursor/commands', '.claude/commands', '.agents', 'AGENTS.md', 'CLAUDE.md', 'scripts'];
const WIKI = 'docs/wiki';

function fail(message) {
  console.error(`[install] ${message}`);
  process.exit(1);
}

function expandTilde(p) {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return join(homedir(), p.slice(2));
  return p;
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));
for (const f of flags) {
  if (!['--wiki', '--dry-run'].includes(f)) fail(`unknown flag ${f}; expected --wiki and/or --dry-run`);
}
if (positional.length !== 1) fail('usage: node scripts/install.js <target-dir> [--wiki] [--dry-run]');

const dryRun = flags.has('--dry-run');
const target = resolve(expandTilde(positional[0]));

// Refusals run BEFORE anything is created, so a refused target leaves no
// freshly made directories behind.
if (existsSync(target) && statSync(target).isFile()) {
  fail(`target ${target} is a file; pass a directory`);
}

// Containment: resolve the deepest EXISTING ancestor (symlinks followed) and
// refuse when the real target sits inside Foundry itself. Without the
// ancestor walk, a not-yet-created target could hide behind a symlinked
// parent that points into this repo.
let probe = target;
const pending = [];
while (!existsSync(probe)) {
  pending.unshift(probe.slice(probe.lastIndexOf(sep) + 1));
  const parent = dirname(probe);
  if (parent === probe) break;
  probe = parent;
}
const realTarget = join(realpathSync(probe), ...pending);
if (realTarget === foundryRoot || realTarget.startsWith(foundryRoot + sep)) {
  fail(`target resolves to ${realTarget}, inside the Foundry repo itself; install into your own project instead`);
}

const wanted = flags.has('--wiki') ? [...COPY_SET, WIKI] : COPY_SET;

// Classify every file first (created / updated / unchanged) so the report is
// honest in both real and dry runs; the copy itself stays fs.cpSync.
function collectFiles(root, rel, found) {
  const abs = join(root, rel);
  if (statSync(abs).isDirectory()) {
    for (const entry of readdirSync(abs)) collectFiles(root, join(rel, entry), found);
  } else {
    found.push(rel);
  }
}

const created = [];
const updated = [];
let unchanged = 0;

for (const item of wanted) {
  if (!existsSync(join(foundryRoot, item))) fail(`source ${item} missing from the Foundry checkout; is it complete?`);
  const files = [];
  collectFiles(foundryRoot, item, files);
  for (const rel of files) {
    const destFile = join(target, rel);
    if (!existsSync(destFile)) {
      created.push(rel);
    } else if (readFileSync(join(foundryRoot, rel)).equals(readFileSync(destFile))) {
      unchanged++;
    } else {
      updated.push(rel);
    }
  }
}

const label = dryRun ? 'would ' : '';
for (const rel of created) console.log(`  ${label}create ${rel}`);
for (const rel of updated) console.log(`  ${label}update ${rel}`);

if (!dryRun) {
  mkdirSync(target, { recursive: true });
  for (const item of wanted) {
    cpSync(join(foundryRoot, item), join(target, item), { recursive: true });
  }
}

console.log(
  `[install] ${dryRun ? 'dry run against' : 'installed into'} ${target}: ` +
  `${created.length} created, ${updated.length} updated, ${unchanged} unchanged` +
  `${flags.has('--wiki') ? ' (wiki included)' : ''}${dryRun ? '; nothing written' : ''}`
);
