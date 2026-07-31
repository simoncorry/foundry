import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'voice-gate.js');

function run(draft, env = {}) {
  return execFileSync('node', [script], {
    input: draft,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

test('flags a listed phrase with its rewrite', () => {
  const out = run('We should leverage the new module here.');
  assert.ok(out.includes('1 phrase(s) found'));
  assert.ok(out.includes('"leverage the" -> try: "use the"'));
});

test('matching is case-insensitive', () => {
  const out = run('Moreover, this is a Paradigm Shift.');
  assert.ok(out.includes('paradigm shift'));
  assert.ok(out.includes('moreover,'));
});

test('a clean draft passes', () => {
  const out = run('Short plain sentence about the change.');
  assert.ok(out.includes('OK, no listed phrases found'));
});

test('kill switch silences the gate entirely', () => {
  const out = run('leverage the synergy between things', { VOICE_GATE_DISABLED: '1' });
  assert.equal(out, '');
});

test('empty stdin reports itself instead of passing', () => {
  const out = run('   ');
  assert.ok(out.includes('no draft provided'));
});

test('hits report their line number', () => {
  const out = run('clean line\nwe leverage the cache\n');
  assert.ok(out.includes('line 2:'));
});

test('the listed phrase inside a larger word does not match', () => {
  const out = run('The releverage theory holds.');
  assert.ok(out.includes('OK, no listed phrases found'));
});

test('code blocks in a draft are not flagged', () => {
  const out = run('Prose.\n\n```\nleverage the cache here\n```\n');
  assert.ok(out.includes('OK, no listed phrases found'));
});

test('a whole-draft markdown copy wrapper is still scanned', () => {
  const out = run('```markdown\nWe leverage the cache.\n```\n');
  assert.ok(out.includes('"leverage the" -> try: "use the"'));
});
