#!/usr/bin/env node

// Installer: copies Foundry's install set into another project.
//
// Automates the manual copy the README documents, and doubles as the update
// path: run it again after pulling Foundry and it refreshes the copies,
// reporting what changed.
//
// What it copies (the allowlist IS the copy set; nothing else is read):
//   .agents/            the skill files: Cursor and Codex read these directly
//   .claude/skills/     the generated Claude Code copies
//   AGENTS.md           the shared rules file, as a marked section
//   scripts/            the checkers, the phrase list, log rotation (and this file)
//   docs/wiki/          the reference library, only with --wiki
//
// A project's own work is never overwritten. A file is updated only when
// it is still an unedited copy of something Foundry shipped: the current
// version, or any version in this checkout's git history. Anything else is
// the project's, so it stays and the report says "keep". --overwrite
// replaces those on purpose. Skills are decided by name: if either tool's
// copy of a skill is the project's own, Foundry installs neither, and the
// installed scripts/foundry-commands.json leaves that name out so the
// project's budget check doesn't count the project's skill as Foundry's.
//
// Two files are shared rather than owned:
//   AGENTS.md           Foundry's rules live between two marker lines. The
//                       installer refreshes only that section, so the
//                       project's own rules around it survive. A project
//                       AGENTS.md with no markers gets the section added
//                       below its text.
//   phrase-list.json    the project's entries stay; Foundry's new ones are
//                       added after them.
//
// CLAUDE.md, the one-line @AGENTS.md import for Claude Code, is created only
// when the target has no CLAUDE.md of its own (at the root or inside
// .claude/). An existing one is never touched; when it doesn't import
// AGENTS.md, Claude Code won't load Foundry's rules, so the run says so.
//
// Older installs shipped command copies in .cursor/commands/ and
// .claude/commands/, which Cursor lists next to the skills as duplicates.
// After every copy succeeds, files there that match a copy those installs
// shipped are removed; anything else in those folders, including a
// project's own file under an old command's name, stays.
//
// Usage:
//   node scripts/install.js <target-dir> [--wiki] [--dry-run] [--overwrite]
//
// --dry-run prints what would change and writes or removes nothing.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { accessSync, constants, copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDRY_SECTION, foundrySection } from './check-context-budgets.js';
import { assertValidPhraseList } from './prose-matcher.js';

const foundryRoot = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));

const COPY_SET = ['.agents', '.claude/skills', 'AGENTS.md', 'scripts'];
const WIKI = 'docs/wiki';
const SKILL_TREES = ['.agents/skills', '.claude/skills'];
const AGENTS = 'AGENTS.md';
const PHRASES = join('scripts', 'phrase-list.json');
const COMMAND_LIST = join('scripts', 'foundry-commands.json');
const WIKI_INDEX = join(WIKI, 'INDEX.md');
const FOUNDRY_TITLE = '# Foundry: the working agreement';
// Codex's default project_doc_max_bytes: it reads this much of AGENTS.md
// and silently drops the rest.
const CODEX_AGENTS_LIMIT = 32 * 1024;
const CLAUDE_IMPORT = '@AGENTS.md';
const OLD_COMMAND_DIRS = ['.cursor/commands', '.claude/commands'];
// Frozen: the names the old command folders ever held. Commands added since
// (solo onward) never shipped there, so a file by that name is the project's.
const OLD_COMMAND_NAMES = new Set([
  'build-it', 'challenge-implementation-1', 'challenge-implementation-2', 'challenge-implementation-3',
  'challenge-implementation-4', 'challenge-implementation-5', 'challenge-plan-1', 'challenge-plan-2',
  'challenge-plan-3', 'challenge-plan-4', 'challenge-plan-5', 'construct-the-plan', 'frame-it', 'handoff',
  'quiz', 'security-scan', 'start-up', 'test-it', 'wrap-up',
]);

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
  if (!['--wiki', '--dry-run', '--overwrite'].includes(f)) fail(`unknown flag ${f}; expected --wiki, --dry-run, and/or --overwrite`);
}
if (positional.length !== 1) fail('usage: node scripts/install.js <target-dir> [--wiki] [--dry-run] [--overwrite]');

const dryRun = flags.has('--dry-run');
const overwrite = flags.has('--overwrite');
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

function collectFiles(root, rel, found) {
  const abs = join(root, rel);
  if (statSync(abs).isDirectory()) {
    for (const entry of readdirSync(abs)) collectFiles(root, join(rel, entry), found);
  } else {
    found.push(rel);
  }
}

const portable = (rel) => rel.split(sep).join('/');

// Every blob each install-set path has held in Foundry's history, keyed by
// path. Null when this checkout has no usable history (a downloaded zip, or
// git missing); then only the current version counts as Foundry's. A
// shallow clone answers too, but with only the versions it fetched.
function git(args) {
  return execFileSync('git', ['-C', foundryRoot, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024,
  });
}

let shallow = false;
function foundryHistory() {
  let out;
  try {
    out = git(['log', '--root', '--format=', '--raw', '--no-abbrev', '--no-renames', '--relative', '--', ...wanted, ...OLD_COMMAND_DIRS]);
    shallow = git(['rev-parse', '--is-shallow-repository']).trim() === 'true';
  } catch {
    return null;
  }
  const history = new Map();
  for (const line of out.split('\n')) {
    const m = line.match(/^:\d+ \d+ ([0-9a-f]{40}) ([0-9a-f]{40}) [A-Z]\d*\t(.+)$/);
    if (!m) continue;
    const blobs = history.get(m[3]) ?? new Set();
    for (const id of [m[1], m[2]]) if (!/^0+$/.test(id)) blobs.add(id);
    history.set(m[3], blobs);
  }
  return history;
}

// git's object id for a file's bytes, so a project file can be matched
// against the history without reading every old version.
function blobId(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

const history = foundryHistory();

// Git stores Foundry's files with plain newlines; a Windows checkout may
// have turned an untouched copy's into carriage-return pairs.
function shippedAt(rel, bytes) {
  const blobs = history?.get(portable(rel));
  if (!blobs) return false;
  if (blobs.has(blobId(bytes))) return true;
  const lf = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
  return !lf.equals(bytes) && blobs.has(blobId(lf));
}

function isFoundryCopy(rel, bytes) {
  return bytes.equals(readFileSync(join(foundryRoot, rel))) || shippedAt(rel, bytes);
}

// The commit position where each phrase first appeared in Foundry's list,
// oldest first; null without history. Lets a merge tell a phrase Foundry
// added since the project last synced from one the project deleted.
function phraseFirstSeen() {
  if (history === null) return null;
  const firstSeen = new Map();
  let commits;
  try {
    commits = git(['log', '--format=%H', '--reverse', '--', PHRASES]).trim().split('\n').filter(Boolean);
  } catch {
    return null;
  }
  commits.forEach((commit, position) => {
    let list = [];
    try {
      list = JSON.parse(git(['show', `${commit}:./${portable(PHRASES)}`]));
    } catch {
      return;
    }
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      const key = typeof entry?.bad === 'string' ? entry.bad.toLowerCase() : null;
      if (key !== null && !firstSeen.has(key)) firstSeen.set(key, position);
    }
  });
  return { firstSeen, newest: commits.length };
}

// Every write must land inside the target. A symlink anywhere on the way
// (a linked folder, a linked file, a link to nothing) would otherwise let the
// copy overwrite or create files elsewhere on the machine. Checks the
// deepest part of the path that already exists; anything not yet created
// is made fresh under it.
function landsInside(path) {
  for (let probe = path; probe !== target; probe = dirname(probe)) {
    let exists = true;
    try {
      lstatSync(probe);
    } catch {
      exists = false;
    }
    if (!exists) continue;
    try {
      const real = realpathSync(probe);
      return real === realTarget || real.startsWith(realTarget + sep);
    } catch {
      return false;
    }
  }
  return true;
}

// A folder where Foundry writes a file, or a file where it needs a folder,
// would make the copy throw partway; caught here so nothing is written.
function wrongType(rel) {
  const dest = join(target, rel);
  if (existsSync(dest) && statSync(dest).isDirectory()) return true;
  for (let dir = dirname(dest); dir !== target && dir.startsWith(target + sep); dir = dirname(dir)) {
    if (existsSync(dir) && !statSync(dir).isDirectory()) return true;
  }
  return false;
}

const plan = []; // { rel, action, from?, text? }  action: create | update | merge | unchanged
const kept = []; // { rel, why }: the project's files left alone
const notes = [];
const refusals = [];
const outside = [];
const blocked = [];

function existing(rel) {
  const dest = join(target, rel);
  return existsSync(dest) ? readFileSync(dest) : null;
}

function addCopy(rel) {
  const current = existing(rel);
  if (current === null) plan.push({ rel, action: 'create', from: rel });
  else if (current.equals(readFileSync(join(foundryRoot, rel)))) plan.push({ rel, action: 'unchanged' });
  else plan.push({ rel, action: 'update', from: rel });
}

function addRendered(rel, text, changedAction = 'update') {
  const current = existing(rel);
  if (current === null) plan.push({ rel, action: 'create', text });
  else if (current.toString('utf8') === text) plan.push({ rel, action: 'unchanged' });
  else plan.push({ rel, action: changedAction, text });
}

function planAgents() {
  const source = readFileSync(join(foundryRoot, AGENTS), 'utf8');
  const rendered = `${FOUNDRY_SECTION.start}\n${source}${source.endsWith('\n') ? '' : '\n'}${FOUNDRY_SECTION.end}\n`;
  const current = existing(AGENTS);
  if (current === null) {
    plan.push({ rel: AGENTS, action: 'create', text: rendered });
    return;
  }
  const text = current.toString('utf8');
  let section;
  try {
    section = foundrySection(text);
  } catch (error) {
    refusals.push(`${error.message}. Fix the marker lines by hand; the installer won't guess where Foundry's rules end.`);
    return;
  }
  if (section) {
    const inner = text.slice(section.innerStart, section.innerEnd);
    if (inner === source) {
      plan.push({ rel: AGENTS, action: 'unchanged' });
    } else if (overwrite || isFoundryCopy(AGENTS, Buffer.from(inner))) {
      plan.push({ rel: AGENTS, action: 'update', text: text.slice(0, section.innerStart) + source + text.slice(section.innerEnd) });
    } else {
      kept.push({ rel: AGENTS, why: "lines inside Foundry's section were edited, so the section was left alone; move your own lines above or below the marker lines, or re-run with --overwrite" });
    }
    return;
  }
  if (isFoundryCopy(AGENTS, current)) {
    plan.push({ rel: AGENTS, action: 'update', text: rendered });
  } else if (text.split('\n').some((line) => line.replace(/\r$/, '') === FOUNDRY_TITLE)) {
    if (overwrite) plan.push({ rel: AGENTS, action: 'update', text: rendered });
    else kept.push({ rel: AGENTS, why: 'an older Foundry copy with edits, so it was left alone; re-run with --overwrite to replace it with the marked section (your edits go)' });
  } else {
    plan.push({ rel: AGENTS, action: 'merge', text: `${text}${text.endsWith('\n') ? '' : '\n'}\n${rendered}`, note: "Foundry's section added below your rules" });
  }
}

function planPhrases() {
  const current = existing(PHRASES);
  if (current === null || overwrite || isFoundryCopy(PHRASES, current)) {
    addCopy(PHRASES);
    return;
  }
  const foundryList = JSON.parse(readFileSync(join(foundryRoot, PHRASES), 'utf8'));
  let projectList;
  try {
    projectList = assertValidPhraseList(JSON.parse(current.toString('utf8')));
  } catch (error) {
    refusals.push(`${portable(PHRASES)} in the project isn't a valid phrase list (${error.message.replace(/\.$/, '')}); fix it, or re-run with --overwrite to replace it with Foundry's`);
    return;
  }
  const seen = new Set(projectList.map((entry) => entry.bad.toLowerCase()));
  // A phrase older than the newest Foundry phrase the project already has
  // was offered before, so its absence is the project's own deletion.
  const order = phraseFirstSeen();
  const firstSeen = (entry) => order?.firstSeen.get(entry.bad.toLowerCase()) ?? order?.newest ?? 0;
  const syncedTo = Math.max(-1, ...projectList.filter((e) => order?.firstSeen.has(e.bad.toLowerCase())).map(firstSeen));
  const added = foundryList.filter((entry) => !seen.has(entry.bad.toLowerCase()) && (order === null || firstSeen(entry) > syncedTo));
  if (added.length === 0) {
    plan.push({ rel: PHRASES, action: 'unchanged' });
    return;
  }
  plan.push({
    rel: PHRASES,
    action: 'merge',
    text: `${JSON.stringify([...projectList, ...added], null, 1)}\n`,
    note: `${added.length} new phrase${added.length === 1 ? '' : 's'}; run node scripts/check-jargon.js`,
  });
}

// Classify every file before writing anything, so the report is honest in
// both real and dry runs and every refusal comes before the first write.
const files = [];
for (const item of wanted) {
  if (!existsSync(join(foundryRoot, item))) fail(`source ${item} missing from the Foundry checkout; is it complete?`);
  // A top-level folder that is itself a link is refused even when it stays
  // inside the project: Foundry's files would then also change at the
  // other path the project knows them by.
  let itemIsLink = false;
  try {
    itemIsLink = lstatSync(join(target, item)).isSymbolicLink() && statSync(join(foundryRoot, item)).isDirectory();
  } catch {
    itemIsLink = false;
  }
  if (itemIsLink) {
    outside.push(item);
    continue;
  }
  collectFiles(foundryRoot, item, files);
}
for (const rel of files) {
  if (!landsInside(join(target, rel))) outside.push(rel);
  else if (wrongType(rel)) blocked.push(rel);
}

const claudeFiles = ['CLAUDE.md', join('.claude', 'CLAUDE.md')]
  .filter((f) => existsSync(join(target, f)) && statSync(join(target, f)).isFile());
const createClaude = claudeFiles.length === 0;
if (createClaude && !landsInside(join(target, 'CLAUDE.md'))) outside.push('CLAUDE.md');
else if (createClaude && wrongType('CLAUDE.md')) blocked.push('CLAUDE.md');
if (outside.length > 0) {
  for (const rel of outside) console.error(`  outside: ${rel}`);
  fail(`${outside.length} path(s) in the target go through a symlink the installer can't safely write through (one that leads outside the target, or a linked folder); nothing written. Replace them with real files or folders and re-run.`);
}
if (blocked.length > 0) {
  for (const rel of blocked) console.error(`  in the way: ${rel}`);
  fail(`${blocked.length} path(s) in the target have a file where Foundry needs a folder, or a folder where it needs a file; nothing written. Move them aside and re-run.`);
}

// Skills, by name across both tool folders.
const skillFiles = new Map();
const plainFiles = [];
for (const rel of files) {
  const tree = SKILL_TREES.find((t) => portable(rel).startsWith(`${t}/`));
  if (!tree) {
    plainFiles.push(rel);
    continue;
  }
  const name = portable(rel).slice(tree.length + 1).split('/')[0];
  if (!skillFiles.has(name)) skillFiles.set(name, []);
  skillFiles.get(name).push(rel);
}
const keptSkills = new Set();
for (const [name, rels] of skillFiles) {
  const foreign = rels.some((rel) => {
    const current = existing(rel);
    return current !== null && !isFoundryCopy(rel, current);
  });
  if (foreign && !overwrite) {
    keptSkills.add(name);
    kept.push({ rel: `skill ${name}`, why: `the project's copy differs from every version Foundry shipped, so Foundry's ${name} was not installed in either tool folder` });
  } else {
    for (const rel of rels) addCopy(rel);
  }
}

for (const rel of plainFiles) {
  if (rel === AGENTS) planAgents();
  else if (rel === PHRASES) planPhrases();
  else if (rel === COMMAND_LIST) {
    const foundryNames = JSON.parse(readFileSync(join(foundryRoot, COMMAND_LIST), 'utf8'));
    // The installer writes a filtered copy, so no history matches it; a list
    // of Foundry's own command names is the installer's, anything else isn't.
    const current = existing(COMMAND_LIST);
    let ours = current === null || overwrite;
    if (!ours) {
      try {
        const listed = JSON.parse(current.toString('utf8'));
        ours = Array.isArray(listed) && listed.every((name) => foundryNames.includes(name) || OLD_COMMAND_NAMES.has(name));
      } catch {
        ours = false;
      }
    }
    if (ours) addRendered(COMMAND_LIST, `${JSON.stringify(foundryNames.filter((name) => !keptSkills.has(name)), null, 2)}\n`);
    else kept.push({ rel: portable(COMMAND_LIST), why: "yours: it lists names that aren't Foundry commands, so the budget check will count what it lists" });
  } else {
    const current = existing(rel);
    if (current === null || overwrite || isFoundryCopy(rel, current)) addCopy(rel);
    else kept.push({ rel: portable(rel), why: 'yours, and it differs from every version Foundry shipped' });
  }
}

if (createClaude) plan.push({ rel: 'CLAUDE.md', action: 'create', from: 'CLAUDE.md' });
const claudeMissesImport =
  !createClaude && !claudeFiles.some((f) => readFileSync(join(target, f), 'utf8').includes(CLAUDE_IMPORT));

// Old command copies go only when their bytes match a copy Foundry shipped
// at that path; a same-named file with other contents is the project's.
const removed = [];
for (const dir of OLD_COMMAND_DIRS) {
  if (!existsSync(join(target, dir)) || !statSync(join(target, dir)).isDirectory()) continue;
  // A commands folder that resolves outside the target (a symlink, or a
  // symlinked parent) holds someone else's files; never delete there.
  if (!landsInside(join(target, dir))) {
    console.log(`  skip ${dir}: it resolves outside the project, so nothing there is removed`);
    continue;
  }
  for (const entry of readdirSync(join(target, dir), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || !OLD_COMMAND_NAMES.has(entry.name.replace(/\.md$/, ''))) continue;
    const rel = join(dir, entry.name);
    if (shippedAt(rel, readFileSync(join(target, rel)))) removed.push(rel);
    else kept.push({ rel: portable(rel), why: "named like an old Foundry command but doesn't match one Foundry shipped, so it stays; delete it yourself if it's an old Foundry copy" });
  }
}

// Permissions, checked before the first write so a locked file can't stop
// the run halfway: each file to replace, or the nearest folder that exists
// above each file to create.
function writable(rel) {
  let probe = join(target, rel);
  while (!existsSync(probe)) probe = dirname(probe);
  try {
    accessSync(probe, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
for (const p of plan) if (p.action !== 'unchanged' && !writable(p.rel)) refusals.push(`${portable(p.rel)} can't be written (check its permissions)`);
for (const rel of removed) if (!writable(dirname(rel))) refusals.push(`${portable(rel)} can't be removed (check its folder's permissions)`);

if (refusals.length > 0) {
  for (const message of refusals) console.error(`  refused: ${message}`);
  fail(`${refusals.length} file(s) in the target can't be updated safely; nothing written.`);
}

// Checked on every run, not only when Foundry writes the file: a project's
// own rules can grow past the limit between installs.
const agentsPlan = plan.find((p) => p.rel === AGENTS && p.text !== undefined);
const agentsBytes = agentsPlan ? Buffer.byteLength(agentsPlan.text, 'utf8') : (existing(AGENTS)?.length ?? 0);
if (agentsBytes > CODEX_AGENTS_LIMIT) {
  notes.push(`AGENTS.md is ${agentsBytes} bytes. Codex reads only the first ${CODEX_AGENTS_LIMIT} by default and drops the rest without a warning, which can cut Foundry's section; shorten your own rules or raise project_doc_max_bytes in Codex's config.`);
}
if (kept.some((k) => k.rel === portable(WIKI_INDEX))) {
  const index = existing(WIKI_INDEX).toString('utf8');
  const unlisted = plan
    .filter((p) => p.action === 'create' && portable(p.rel).startsWith(`${WIKI}/`))
    .map((p) => portable(p.rel).slice(WIKI.length + 1))
    .filter((page) => !index.includes(page));
  if (unlisted.length > 0) {
    notes.push(`docs/wiki/INDEX.md is yours, so these new Foundry pages aren't listed in it yet: ${unlisted.join(', ')}. Add a line for each.`);
  }
}
try {
  if (JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')).type === 'commonjs') {
    notes.push('package.json sets "type": "commonjs", so Node reads the scripts/ copies as CommonJS and they fail to load (they are ES modules); the commands still work, but the voice gate, the jargon gate, and the other checks won\'t run until that setting changes.');
  }
} catch {
  // No package.json, or one Node itself would reject: nothing to say here.
}
if (kept.length > 0 && (history === null || shallow)) {
  notes.push(
    `this Foundry checkout has ${history === null ? 'no git history' : 'only part of its git history (a shallow clone)'}, ` +
    "so an older untouched Foundry copy can't be told from your own edits and shows as kept. " +
    `${history === null ? 'Re-run' : 'Run git fetch --unshallow in the Foundry checkout and re-run, or re-run'} with --overwrite if those files are untouched.`
  );
}

if (!dryRun) {
  const writes = plan.filter((p) => p.action !== 'unchanged');
  let done = 0;
  try {
    mkdirSync(target, { recursive: true });
    for (const p of writes) {
      const dest = join(target, p.rel);
      mkdirSync(dirname(dest), { recursive: true });
      if (p.text !== undefined) writeFileSync(dest, p.text);
      else copyFileSync(join(foundryRoot, p.from), dest);
      done += 1;
    }
  } catch (error) {
    fail(`stopped partway (${error.message}): ${done} of ${writes.length} files were written and nothing was removed. Fix the cause and re-run; a re-run finishes the job.`);
  }
  // Removal runs last: a copy that fails partway leaves the old commands in
  // place instead of a project with neither the old commands nor the skills.
  for (const rel of removed) rmSync(join(target, rel));
}

// The report comes after the writes, so it never claims work that failed.
const label = dryRun ? 'would ' : '';
const count = (action) => plan.filter((p) => p.action === action).length;
for (const action of ['create', 'update', 'merge']) {
  for (const p of plan.filter((q) => q.action === action)) {
    console.log(`  ${label}${action} ${portable(p.rel)}${p.note ? ` (${p.note})` : ''}`);
  }
}
for (const k of kept) console.log(`  ${label}keep ${k.rel}: ${k.why}`);
for (const rel of removed) console.log(`  ${label}remove ${portable(rel)}`);

for (const message of notes) console.log(`  note: ${message}`);
if (claudeMissesImport) {
  console.log(
    `  note: ${claudeFiles.join(' and ')} ${claudeFiles.length > 1 ? "don't" : "doesn't"} import AGENTS.md, ` +
    `so Claude Code won't load Foundry's rules. Add a line reading ${CLAUDE_IMPORT} to ${claudeFiles.length > 1 ? 'one of them' : 'it'}.`
  );
}

console.log(
  `[install] ${dryRun ? 'dry run against' : 'installed into'} ${target}: ` +
  `${count('create')} created, ${count('update')} updated, ${count('merge')} merged, ${kept.length} kept, ` +
  `${removed.length} removed, ${count('unchanged')} unchanged` +
  `${flags.has('--wiki') ? ' (wiki included)' : ''}${dryRun ? '; nothing written' : ''}`
);
