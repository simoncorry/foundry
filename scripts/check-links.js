#!/usr/bin/env node

// Dead-reference checker. Fails the build when anything a file cites
// doesn't exist in the repo tree.
//
//   node scripts/check-links.js
//
// Foundry's files cite things four ways, and this checker understands
// all of them because a generic link checker sees only the first:
//
//   1. Markdown links: [text](target). Relative targets must resolve
//      from the containing file; #anchors on .md targets must match a
//      real heading. Web links (http, https, mailto) are NOT fetched:
//      no network in the check, so it can never flake. Their absence
//      from this check is a known, accepted limit.
//   2. Backticked tokens: `/command-name`, `node scripts/x.js`,
//      `npm run alias`, `docs/plans/`, `AGENTS.md § Heading`. Each
//      resolves against the tree (commands to .cursor/commands/,
//      aliases to package.json scripts, paths from the repo root).
//   3. Plain-prose section citations: "follow AGENTS.md § Voice." The
//      heading capture runs to the first . , ; : ) or end of line;
//      an ambiguous sentence fails loud and gets reworded, which is
//      the safe direction for a checker to fail.
//   4. Bare prose paths: "see docs/light-path.md." (trailing sentence
//      punctuation stripped before resolving).
//
// Placeholder segments (<slug>, {name}, *) in a path require only the
// static directory prefix to exist. Generated folders (.claude/,
// .agents/) are skipped; the shapes confirm already guards byte parity
// with the source, so checking the source checks them too.
//
// Fence handling is line-based: a line opening with ``` or ~~~ toggles
// code-block state. Four-backtick fences and indented code blocks are
// not recognized; add them if a file starts using them.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// CHECK_ROOT lets the tests point the checker at a fixture tree.
const root = process.env.CHECK_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');

// Slash commands owned by other tools. The README's comparison section
// (planned content) names these on purpose; they are not Foundry
// commands and never resolve. Anything else unresolvable still fails.
const EXTERNAL_COMMANDS = new Set(['/goal', '/init', '/compact', '/review', '/plan']);

const PATH_PREFIXES = /^(docs|scripts|tests|\.cursor|\.claude|\.agents|\.github)\//;

const failures = [];

function fail(file, line, token, reason) {
  failures.push(`${file}:${line}: ${token} (${reason})`);
}

function listMarkdownFiles() {
  const files = ['README.md', 'AGENTS.md', 'CLAUDE.md'];
  const walk = (dir) => {
    if (!existsSync(join(root, dir))) return;
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.md')) files.push(rel);
    }
  };
  walk('docs');
  walk('.cursor/commands');
  return files.filter((f) => existsSync(join(root, f)));
}

// Lines outside fenced code blocks, with their 1-based line numbers.
function proseLines(content) {
  const out = [];
  let inFence = false;
  content.split('\n').forEach((text, idx) => {
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      return;
    }
    if (!inFence) out.push({ line: idx + 1, text });
  });
  return out;
}

function headingsOf(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return null;
  const headings = new Set();
  for (const { text } of proseLines(readFileSync(abs, 'utf8'))) {
    const m = text.match(/^#{1,6}\s+(.+?)\s*$/);
    if (m) headings.add(m[1].trim().toLowerCase());
  }
  return headings;
}

// GitHub-style anchor slug, for [text](file.md#anchor) targets.
function slugify(heading) {
  return heading.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

function headingExists(relPath, heading) {
  const headings = headingsOf(relPath);
  if (!headings) return false;
  return headings.has(heading.trim().toLowerCase());
}

function anchorExists(relPath, anchor) {
  const headings = headingsOf(relPath);
  if (!headings) return false;
  return [...headings].some((h) => slugify(h) === anchor.toLowerCase());
}

// Every reference must land INSIDE the repo. A token that climbs out
// with .. can still exist on disk, but existing elsewhere is not
// resolving here, and the checker's contract is "the repo tree".
function insideRoot(absPath) {
  const resolved = resolve(absPath);
  return resolved === resolve(root) || resolved.startsWith(resolve(root) + sep);
}

// A repo-root-relative path token, possibly with placeholders or a glob.
// Returns true when the concrete file/dir (or the static prefix before
// the first placeholder) exists.
function pathResolves(token) {
  const wantsDir = token.endsWith('/');
  const segments = token.replace(/\/$/, '').split('/');
  const staticSegments = [];
  let sawPlaceholder = false;
  for (const seg of segments) {
    if (/[<{*]/.test(seg)) {
      sawPlaceholder = true;
      break;
    }
    staticSegments.push(seg);
  }
  if (sawPlaceholder) {
    if (staticSegments.length === 0) return false;
    const prefix = join(root, ...staticSegments);
    return insideRoot(prefix) && existsSync(prefix) && statSync(prefix).isDirectory();
  }
  const abs = join(root, ...staticSegments);
  if (!insideRoot(abs) || !existsSync(abs)) return false;
  if (wantsDir) return statSync(abs).isDirectory();
  return true;
}

function checkBacktickToken(file, line, raw) {
  let token = raw.trim();

  // Slash command: `/frame-it`, `/quiz 42`.
  if (/^\/[a-z0-9][a-z0-9-]*(\s|$)/.test(token)) {
    const name = token.split(/\s+/)[0];
    if (EXTERNAL_COMMANDS.has(name)) return;
    if (!existsSync(join(root, '.cursor', 'commands', `${name.slice(1)}.md`))) {
      fail(file, line, `\`${raw}\``, `no command file .cursor/commands/${name.slice(1)}.md`);
    }
    return;
  }

  // Script invocation: `node scripts/x.js`.
  if (token.startsWith('node ')) {
    const scriptPath = token.split(/\s+/)[1] ?? '';
    if (!existsSync(join(root, scriptPath))) {
      fail(file, line, `\`${raw}\``, `script ${scriptPath} not found`);
    }
    return;
  }

  // npm alias: `npm run shapes`.
  if (token.startsWith('npm run ')) {
    const alias = token.split(/\s+/)[2] ?? '';
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    if (!pkg.scripts || !(alias in pkg.scripts)) {
      fail(file, line, `\`${raw}\``, `no "${alias}" script in package.json`);
    }
    return;
  }

  // `FILE.md § Heading` carries a heading requirement.
  let heading = null;
  const sectionMatch = token.match(/^(.+?)\s+§\s+(.+)$/);
  if (sectionMatch) {
    token = sectionMatch[1].trim();
    heading = sectionMatch[2].trim();
  }

  // `@AGENTS.md` is Claude's import syntax for the same file.
  token = token.replace(/^@/, '');

  // Only path-shaped tokens from here; everything else is ignored.
  const pathLike = token.includes('/') || /\.(md|js|json|yaml)$/.test(token);
  if (!pathLike || /\s/.test(token) || !/^[A-Za-z0-9._/<>{}*-]+$/.test(token)) return;

  if (!pathResolves(token)) {
    fail(file, line, `\`${raw}\``, 'path does not resolve');
    return;
  }
  if (heading !== null) {
    const target = token.replace(/\/$/, '');
    if (!target.endsWith('.md') || !headingExists(target, heading)) {
      fail(file, line, `\`${raw}\``, `no heading "${heading}" in ${target}`);
    }
  }
}

function checkMarkdownLink(file, line, target) {
  if (/^(https?|mailto):/.test(target)) return;
  if (target.startsWith('#')) {
    if (!anchorExists(file, target.slice(1))) {
      fail(file, line, `](${target})`, 'anchor not found in this file');
    }
    return;
  }
  const [pathPart, anchor] = target.split('#');
  const resolved = join(dirname(file), pathPart);
  if (!insideRoot(join(root, resolved)) || !existsSync(join(root, resolved))) {
    fail(file, line, `](${target})`, `target ${resolved} not found in the repo`);
    return;
  }
  if (anchor && pathPart.endsWith('.md') && !anchorExists(resolved, anchor)) {
    fail(file, line, `](${target})`, `anchor #${anchor} not found in ${resolved}`);
  }
}

function checkProse(file, line, text) {
  // Plain-prose section citation: "follow AGENTS.md § Voice." The file
  // part resolves from the repo root whether bare (AGENTS.md) or
  // pathed (docs/light-path.md).
  const citation = /([A-Za-z0-9._/-]+\.md)\s+§\s+([^.,;:)]*)/g;
  for (const m of matchAll(citation, text)) {
    const target = m[1];
    const heading = m[2].trim();
    if (!existsSync(join(root, target))) {
      fail(file, line, `${target} § ${heading}`, `file ${target} not found`);
      continue;
    }
    if (heading.length === 0) {
      fail(file, line, `${target} §`, 'empty heading in citation');
      continue;
    }
    if (!headingExists(target, heading)) {
      fail(file, line, `${target} § ${heading}`, `no such heading in ${target}`);
    }
  }

  // Bare prose path: "see docs/light-path.md."
  const barePath = /(?:^|[\s("'])((?:docs|scripts|tests|\.cursor|\.claude|\.agents|\.github)\/[A-Za-z0-9._/<>{}*-]+)/g;
  for (const m of matchAll(barePath, text)) {
    const token = m[1].replace(/[.,;:)]+$/, '');
    if (!PATH_PREFIXES.test(token)) continue;
    if (!pathResolves(token)) {
      fail(file, line, token, 'prose path does not resolve');
    }
  }
}

function* matchAll(regex, text) {
  regex.lastIndex = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    yield m;
    if (m.index === regex.lastIndex) regex.lastIndex++;
  }
}

for (const file of listMarkdownFiles()) {
  const content = readFileSync(join(root, file), 'utf8');
  for (const { line, text } of proseLines(content)) {
    // Inline code spans come out first; what's left is prose.
    const spans = [];
    const prose = text.replace(/`([^`]*)`/g, (whole, inner) => {
      spans.push(inner);
      return ' '.repeat(whole.length);
    });
    for (const span of spans) checkBacktickToken(file, line, span);
    for (const m of matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g, prose)) {
      checkMarkdownLink(file, line, m[1]);
    }
    checkProse(file, line, prose);
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(`[links] DEAD: ${f}`);
  console.error(`[links] ${failures.length} dead reference(s). Fix the reference or the file it points at.`);
  process.exit(1);
}
console.log('[links] OK: every reference resolves.');
