#!/usr/bin/env node

// Blocking jargon gate. Scans the repo's committed prose (markdown
// outside code, plus JavaScript comments) against the phrase list and
// exits 1 on any hit. The advisory sibling, voice-gate.js, nudges
// drafts before they're sent; this one guards what actually lands.
//
//   node scripts/check-jargon.js
//
// Posture differences from the advisory gate, both deliberate:
//
//   - Fails LOUD on config damage. An unparseable phrase-list.json,
//     a non-array root, or a malformed entry exits 1 naming the
//     problem. The advisory gate degrades to silence (acceptable for
//     a draft nudge); a blocking gate degrading to silence would
//     disable enforcement with nobody told.
//   - No kill switch. Removing the check from package.json is the
//     off switch, and it's visible in a diff.
//
// What counts as prose: markdown text outside fenced blocks and inline
// code spans, in README.md, AGENTS.md, CLAUDE.md, docs/, and the
// command source folder; plus comment text (line and block) in
// scripts/ and tests/ JavaScript. String and template literals are
// code, not prose: test fixtures quote listed phrases on purpose.
// One markdown exception: a document wrapped whole in a single outer
// ```markdown fence is a copy wrapper (handoff blocks travel this way),
// so its contents are unwrapped and scanned as prose. The mechanics live
// in scripts/prose-matcher.js, shared with the advisory voice gate.
//
// Known limits, on purpose: this is a best-effort comment scanner, not
// a full JavaScript lexer. Two exotic constructs can fool it. First, a
// regex literal is not recognized, so a doubled slash inside one reads
// as a line comment and can trip on the rest of that line. Second, a
// backtick inside a template expression (the ${...} part) ends
// template-scanning early, so a comment later on the same physical line
// can be missed. Both need contortions that never appear in real code,
// both reset at the next newline, and Foundry's own scripts avoid them
// (string methods over URL regexes; no backtick-in-expression tricks).
// A style gate tolerates a best-effort lexer; a compiler would not. The
// honest fix here is this note, not a nested-template state stack for a
// construct nobody writes.
//
// Generated folders (.claude/, .agents/) are skipped: byte parity with
// the source is already guarded, so scanning the source covers them.
// scripts/phrase-list.json is data, not prose; it contains every bad
// phrase by definition.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPhraseList, compilePhrases, scanProse, matchLine } from './prose-matcher.js';

// CHECK_ROOT lets the tests point the gate at a fixture tree.
const root = process.env.CHECK_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');

// Matching semantics live in scripts/prose-matcher.js, shared with the
// advisory voice gate. This gate's posture: a broken list fails LOUD
// (exit 1) because a blocking gate degrading to silence would disable
// enforcement with nobody told.
let compiled;
try {
  compiled = compilePhrases(loadPhraseList(join(root, 'scripts', 'phrase-list.json')));
} catch (err) {
  console.error(`[jargon] BROKEN LIST: scripts/phrase-list.json — ${err.message} The gate refuses to pass with a damaged config.`);
  process.exit(1);
}

const hits = [];

function scanText(file, line, text) {
  for (const { bad, good } of matchLine(text, compiled)) {
    hits.push(`${file}:${line}: "${bad}" -> try: "${good}"`);
  }
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

function listJsFiles() {
  const files = [];
  const walk = (dir) => {
    if (!existsSync(join(root, dir))) return;
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.js')) files.push(rel);
    }
  };
  walk('scripts');
  walk('tests');
  return files;
}

// Markdown: prose is what's outside fenced blocks and inline spans; a
// whole-document ```markdown copy wrapper (a handoff block) is unwrapped
// and its contents scanned as prose. Both rules live in the shared
// matcher so the advisory gate agrees.
function scanMarkdown(file) {
  const content = readFileSync(join(root, file), 'utf8');
  for (const { line, bad, good } of scanProse(content, compiled)) {
    hits.push(`${file}:${line}: "${bad}" -> try: "${good}"`);
  }
}

// JavaScript: comment text only. States: code, line comment, block
// comment, single-quoted string, double-quoted string, template
// literal. Escapes respected inside strings and templates.
function extractComments(src) {
  const comments = [];
  let state = 'code';
  let buf = '';
  let bufLine = 1;
  let line = 1;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '\n') line += 1;
    switch (state) {
      case 'code':
        if (c === '/' && n === '/') { state = 'line'; buf = ''; bufLine = line; i += 2; continue; }
        if (c === '/' && n === '*') { state = 'block'; buf = ''; bufLine = line; i += 2; continue; }
        if (c === "'") state = 'single';
        else if (c === '"') state = 'double';
        else if (c === '`') state = 'template';
        break;
      case 'line':
        if (c === '\n') { comments.push({ line: bufLine, text: buf }); state = 'code'; }
        else buf += c;
        break;
      case 'block':
        if (c === '*' && n === '/') { comments.push({ line: bufLine, text: buf }); state = 'code'; i += 2; continue; }
        buf += c;
        break;
      case 'single':
        if (c === '\\') { if (n === '\n') line += 1; i += 2; continue; }
        if (c === "'" || c === '\n') state = 'code';
        break;
      case 'double':
        if (c === '\\') { if (n === '\n') line += 1; i += 2; continue; }
        if (c === '"' || c === '\n') state = 'code';
        break;
      case 'template':
        if (c === '\\') { if (n === '\n') line += 1; i += 2; continue; }
        if (c === '`') state = 'code';
        break;
    }
    i += 1;
  }
  if (state === 'line') comments.push({ line: bufLine, text: buf });
  return comments;
}

function scanJavaScript(file) {
  const src = readFileSync(join(root, file), 'utf8');
  for (const { line, text } of extractComments(src)) {
    text.split('\n').forEach((commentLine, idx) => {
      scanText(file, line + idx, commentLine);
    });
  }
}

for (const file of listMarkdownFiles()) scanMarkdown(file);
for (const file of listJsFiles()) scanJavaScript(file);

if (hits.length > 0) {
  for (const h of hits) console.error(`[jargon] HIT: ${h}`);
  console.error(`[jargon] ${hits.length} listed phrase(s) in committed prose. Rewrite the prose; never widen an exclusion to dodge the gate.`);
  process.exit(1);
}
console.log(`[jargon] OK: no listed phrases in committed prose (${compiled.length} phrases checked).`);
