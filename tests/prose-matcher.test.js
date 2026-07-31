import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  assertValidPhraseList,
  loadPhraseList,
  compilePhrases,
  unwrapOuterMarkdownFence,
  extractProseLines,
  matchLine,
  scanProse,
} from '../scripts/prose-matcher.js';

// Expected values are hardcoded from the intended behavior (the voice
// overhaul plan's matcher contract), not recomputed with the matcher's
// own logic.

const PHRASES = compilePhrases([
  { bad: 'zorbly flux', good: 'plain thing' },
  { bad: 'moreover,', good: 'also,' },
  { bad: '\u2014', good: 'a period or comma' },
]);

// ─── boundaries and case ─────────────────────────────────────────────────

test('matches at sentence start and mid-sentence, any capitalization', () => {
  assert.equal(matchLine('Zorbly flux happened.', PHRASES).length, 1);
  assert.equal(matchLine('We saw the ZORBLY FLUX again.', PHRASES).length, 1);
});

test('the same letters inside a larger word do not match', () => {
  assert.equal(matchLine('The mezorbly fluxative case.', PHRASES).length, 0);
  assert.equal(matchLine('rezorbly fluxes', PHRASES).length, 0);
});

test('punctuation right after a word-edged phrase still matches', () => {
  assert.equal(matchLine('It was zorbly flux, honestly.', PHRASES).length, 1);
});

test('a punctuation-edged phrase keeps substring semantics', () => {
  // The em dash legitimately sits between letters.
  assert.equal(matchLine('word\u2014word', PHRASES).length, 1);
  // A phrase ending in a comma matches when the comma is present.
  assert.equal(matchLine('Moreover, it works.', PHRASES).length, 1);
});

test('unicode neighbours count as word characters', () => {
  // An accented letter touching the phrase edge is inside a larger word.
  assert.equal(matchLine('ézorbly flux', PHRASES).length, 0);
});

test('phrases containing regex special characters are matched literally', () => {
  const compiled = compilePhrases([{ bad: 'state (machine)', good: 'flow' }]);
  assert.equal(matchLine('a state (machine) here', compiled).length, 1);
  assert.equal(matchLine('a state machine here', compiled).length, 0);
});

// ─── markdown extraction ─────────────────────────────────────────────────

test('fenced blocks are skipped and line numbers survive', () => {
  const text = 'clean one\n```\nzorbly flux hidden\n```\nzorbly flux visible\n';
  const hits = scanProse(text, PHRASES);
  assert.deepEqual(hits.map((h) => h.line), [5]);
});

test('inline code spans are blanked', () => {
  const hits = scanProse('the `zorbly flux` token, in code\n', PHRASES);
  assert.equal(hits.length, 0);
});

test('a tilde fence works like a backtick fence', () => {
  const text = '~~~\nzorbly flux\n~~~\n';
  assert.equal(scanProse(text, PHRASES).length, 0);
});

test('a longer closing run still closes the fence', () => {
  const text = '```\nzorbly flux\n````\nzorbly flux out here\n';
  const hits = scanProse(text, PHRASES);
  assert.deepEqual(hits.map((h) => h.line), [4]);
});

// ─── the outer markdown copy wrapper ─────────────────────────────────────

test('a whole-document markdown fence is unwrapped and scanned', () => {
  const text = '```markdown\nHandoff prose with zorbly flux.\n```\n';
  const hits = scanProse(text, PHRASES);
  assert.equal(hits.length, 1);
  // Line 2 in the ORIGINAL document, inside the wrapper.
  assert.equal(hits[0].line, 2);
});

test('fences inside the unwrapped wrapper are code again', () => {
  const text = '```markdown\nprose line\n```\nzorbly flux in inner code\n```\nprose zorbly flux\n```\n';
  const hits = scanProse(text, PHRASES);
  assert.deepEqual(hits.map((h) => h.line), [6]);
});

test('a markdown fence that is not the whole document stays code', () => {
  const text = 'intro prose\n```markdown\nzorbly flux quoted as a sample\n```\n';
  assert.equal(scanProse(text, PHRASES).length, 0);
});

test('unwrap detection tolerates surrounding blank lines', () => {
  const { unwrapped } = unwrapOuterMarkdownFence('\n\n```md\nbody\n```\n\n');
  assert.equal(unwrapped, true);
});

test('a plain code fence spanning the whole document is NOT unwrapped', () => {
  const { unwrapped } = unwrapOuterMarkdownFence('```\nbody\n```\n');
  assert.equal(unwrapped, false);
});

test('extractProseLines reports 1-based original line numbers', () => {
  const lines = extractProseLines('a\nb');
  assert.deepEqual(lines.map((l) => l.line), [1, 2]);
});

// ─── strict list loading ─────────────────────────────────────────────────

test('a non-array root throws', () => {
  assert.throws(() => assertValidPhraseList({}), /flat array/);
});

test('a malformed entry throws and names the entry', () => {
  assert.throws(
    () => assertValidPhraseList([{ bad: 'half an entry' }]),
    /half an entry/
  );
});

test('an extra key on an entry is malformed', () => {
  assert.throws(
    () => assertValidPhraseList([{ bad: 'x', good: 'y', note: 'z' }]),
    /not shaped/
  );
});

test('loadPhraseList throws on unreadable or invalid JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'matcher-fixture-'));
  const p = join(dir, 'list.json');
  writeFileSync(p, '{ not valid json');
  assert.throws(() => loadPhraseList(p), /not valid JSON/);
  rmSync(dir, { recursive: true, force: true });
  assert.throws(() => loadPhraseList(join(dir, 'missing.json')), /unreadable|not valid JSON/);
});

test('a valid list loads and compiles', () => {
  const dir = mkdtempSync(join(tmpdir(), 'matcher-fixture-'));
  const p = join(dir, 'list.json');
  writeFileSync(p, JSON.stringify([{ bad: 'zorbly flux', good: 'plain thing' }]));
  const compiled = compilePhrases(loadPhraseList(p));
  rmSync(dir, { recursive: true, force: true });
  assert.equal(compiled.length, 1);
  assert.equal(matchLine('zorbly flux', compiled).length, 1);
});
