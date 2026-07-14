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
