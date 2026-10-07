#!/usr/bin/env node

// Keeps every Foundry command's tool copies in step with its one source.
//
//   node scripts/generate-command-shapes.js            write the shapes
//   node scripts/generate-command-shapes.js --confirm  verify, exit 1 on drift
//
// One source, two generated shapes:
//   .agents/skills/<name>/SKILL.md      the source. Cursor and Codex read it
//                                       directly. You edit the body; the
//                                       header (name, description, the
//                                       manual-only switch) is rebuilt here
//                                       from the folder name and the body's
//                                       first sentence.
//   .claude/skills/<name>/SKILL.md      byte-identical copy for Claude Code.
//   .agents/skills/<name>/agents/openai.yaml
//                                       the Codex policy that makes the skill
//                                       manual-only, so Codex behaves like a
//                                       deliberate checkpoint instead of
//                                       auto-firing. Codex ignores the
//                                       header's manual-only switch.
//   scripts/foundry-commands.json       the list of Foundry's command names.
//                                       A project that installs Foundry
//                                       keeps its own skills in the same
//                                       .agents/skills/ folder, so the
//                                       context-budget check counts only
//                                       the names on this list.
//
// This is Foundry's own tool: it treats every folder in .agents/skills/ as a
// Foundry command. The installer copies scripts/ into other projects but
// never package.json, so the script refuses to run unless package.json names
// the project "foundry"; otherwise a project's own skills would be rewritten
// as commands.
//
// Every skill is checked before any file is written, so one bad header
// can't leave the others half-rewritten. Confirm mode exists so a check can
// fail when someone edits a generated copy directly or lets a header go
// stale; the fix is always "edit the body in .agents/skills/, re-run the
// generator". File shape and header rules live in scripts/skill-file.js.

import { lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkill, skillProblems, splitSkill } from './skill-file.js';

// SHAPES_ROOT exists so tests can run the generator against a fixture tree
// instead of the real repo. Unset means the repo this script lives in.
// Resolved so a trailing slash can't stop the link walk below from matching.
const root = resolve(process.env.SHAPES_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
const skillsDir = join(root, '.agents', 'skills');
const claudeDir = join(root, '.claude', 'skills');

const POLICY_YAML = 'policy:\n  allow_implicit_invocation: false\n';

const rel = (path) => path.replace(root + '/', '');
// A Windows checkout turns \n into \r\n, which is not drift. A lone \r is
// not a line break any tool here reads, so it stays a difference.
const sameText = (a, b) => a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');

function packageName() {
  try {
    return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name;
  } catch {
    return undefined;
  }
}

// A linked skill folder would send the writes below out of the repo, or
// crash the scan when the link points at nothing; either way it's refused.
function listSkills() {
  const names = [];
  const problems = [];
  if (!existsSync(skillsDir)) return { names, problems };
  for (const name of readdirSync(skillsDir).sort()) {
    const path = join(skillsDir, name);
    const entry = lstatSync(path);
    if (entry.isSymbolicLink()) {
      problems.push(`${rel(path)}: is a link; the generator writes inside skill folders, so replace it with a real folder`);
    } else if (entry.isDirectory()) {
      names.push(name);
    }
  }
  return { names, problems };
}

// A link anywhere between the root and a file this script writes (a linked
// agents/ folder, a linked .claude/skills, a linked SKILL.md) would send the
// write elsewhere, so every write path is walked, not only the folder names.
function linkOnPath(path) {
  for (let p = path; p.startsWith(root + sep); p = dirname(p)) {
    let entry;
    try {
      entry = lstatSync(p);
    } catch {
      continue;
    }
    if (entry.isSymbolicLink()) return p;
  }
  return null;
}

function expected() {
  const files = new Map();
  const { names, problems } = listSkills();
  for (const name of names) {
    const source = join(skillsDir, name, 'SKILL.md');
    if (!existsSync(source)) {
      problems.push(`${rel(source)}: missing; every folder in .agents/skills/ needs a SKILL.md`);
      continue;
    }
    const text = readFileSync(source, 'utf8');
    const found = skillProblems(name, text);
    if (found.length > 0) {
      for (const p of found) problems.push(`${rel(source)}: ${p}`);
      continue;
    }
    const skill = buildSkill(name, splitSkill(text).body);
    files.set(source, skill);
    files.set(join(claudeDir, name, 'SKILL.md'), skill);
    files.set(join(skillsDir, name, 'agents', 'openai.yaml'), POLICY_YAML);
  }
  files.set(join(root, 'scripts', 'foundry-commands.json'), `${JSON.stringify(names, null, 2)}\n`);
  const links = new Set([...files.keys()].map(linkOnPath).filter(Boolean));
  for (const link of links) {
    problems.push(`${rel(link)}: is a link; the generator writes through it, so replace it with a real folder or file`);
  }
  return { files, problems, names };
}

// Orphan scan: confirm must also catch files sitting in the skill folders
// that no source produces (a hand-written stray passes a generated-files-only
// walk silently; a fresh-context review caught this).
function orphans(files) {
  const found = [];
  for (const dir of [skillsDir, claudeDir]) {
    if (!existsSync(dir)) continue;
    const stack = [dir];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (!files.has(full)) found.push(full);
      }
    }
  }
  return found;
}

const confirm = process.argv.includes('--confirm');

if (packageName() !== 'foundry') {
  console.error(
    `[shapes] REFUSED: ${root} is not Foundry's own checkout (its package.json doesn't name the project "foundry"). ` +
    'This script rewrites every folder in .agents/skills/ as a Foundry command, so here it would rewrite your own skills. ' +
    'Edit commands in a Foundry checkout, then re-run the installer.'
  );
  process.exit(1);
}

const { files, problems, names } = expected();

if (problems.length > 0) {
  for (const p of problems) console.error(`[shapes] INVALID: ${p}`);
  console.error(`[shapes] ${problems.length} problem(s); nothing written. Fix the skill file and re-run: npm run shapes`);
  process.exit(1);
}

let drift = 0;
for (const [path, content] of files) {
  const onDisk = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (onDisk !== null && sameText(onDisk, content)) continue;
  if (confirm) {
    drift += 1;
    console.error(`[shapes] DRIFT: ${rel(path)} ${onDisk === null ? '(missing)' : '(differs from source)'}`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

if (confirm) {
  for (const stray of orphans(files)) {
    drift += 1;
    console.error(`[shapes] DRIFT: ${rel(stray)} (no source produces this file)`);
  }
  if (drift > 0) {
    console.error(`[shapes] ${drift} file(s) out of sync. Edit the body in .agents/skills/<name>/SKILL.md and run: npm run shapes`);
    process.exit(1);
  }
  console.log(`[shapes] OK: ${names.length} commands, skills and Claude copies in sync.`);
} else {
  console.log(`[shapes] checked ${files.size} files from ${names.length} source skills.`);
}
