#!/usr/bin/env node

// Generates the Claude Code and Codex command shapes from the single
// source of truth in .cursor/commands/.
//
//   node scripts/generate-command-shapes.js            write the shapes
//   node scripts/generate-command-shapes.js --confirm  verify, exit 1 on drift
//
// Three shapes, one source:
//   .cursor/commands/<name>.md          the source (edit these)
//   .claude/commands/<name>.md          byte-identical copy
//   .agents/skills/<name>/SKILL.md      body plus the frontmatter Codex
//                                       requires (name, description), and
//   .agents/skills/<name>/agents/openai.yaml
//                                       the policy that makes the skill
//                                       manual-only, so Codex behaves like
//                                       a deliberate checkpoint instead of
//                                       auto-firing.
//
// Confirm mode exists so a check can fail when someone edits a generated
// copy directly; the fix is always "edit the source, re-run the generator".

import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// SHAPES_ROOT exists so tests can run the generator against a fixture tree
// instead of the real repo. Unset means the repo this script lives in.
const root = process.env.SHAPES_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, '.cursor', 'commands');
const claudeDir = join(root, '.claude', 'commands');
const skillsDir = join(root, '.agents', 'skills');

const POLICY_YAML = 'policy:\n  allow_implicit_invocation: false\n';

// The description is the command's first sentence; Codex shows it in the
// skill selector. Kept to one sentence so the selector stays readable.
function firstSentence(body) {
  const firstLine = body.split('\n').find((l) => l.trim().length > 0) ?? '';
  const match = firstLine.match(/^(.+?[.!?])(\s|$)/);
  const sentence = (match ? match[1] : firstLine).trim();
  return sentence.replace(/"/g, "'");
}

function skillFile(name, body) {
  return [
    '---',
    `name: ${name}`,
    `description: "${firstSentence(body)}"`,
    '---',
    '',
    `<!-- Generated from .cursor/commands/${name}.md. Edit there and run: npm run shapes -->`,
    '',
    body,
  ].join('\n');
}

function listSources() {
  return readdirSync(sourceDir)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function expected() {
  const files = new Map();
  for (const file of listSources()) {
    const name = file.replace(/\.md$/, '');
    const body = readFileSync(join(sourceDir, file), 'utf8');
    files.set(join(claudeDir, file), body);
    files.set(join(skillsDir, name, 'SKILL.md'), skillFile(name, body));
    files.set(join(skillsDir, name, 'agents', 'openai.yaml'), POLICY_YAML);
  }
  return files;
}

const confirm = process.argv.includes('--confirm');
const files = expected();
let drift = 0;

for (const [path, content] of files) {
  if (confirm) {
    const onDisk = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (onDisk !== content) {
      drift += 1;
      console.error(`[shapes] DRIFT: ${path.replace(root + '/', '')} ${onDisk === null ? '(missing)' : '(differs from source)'}`);
    }
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

if (confirm) {
  if (drift > 0) {
    console.error(`[shapes] ${drift} generated file(s) out of sync. Edit .cursor/commands/ and run: npm run shapes`);
    process.exit(1);
  }
  console.log(`[shapes] OK: ${listSources().length} commands, all three shapes in sync.`);
} else {
  console.log(`[shapes] wrote ${files.size} files from ${listSources().length} source commands.`);
}
