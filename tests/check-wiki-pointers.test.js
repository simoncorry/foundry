import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'check-wiki-pointers.js');

function run(args, env = {}) {
  try {
    const stdout = execFileSync('node', [script, ...args], {
      env: { ...process.env, ...env },
      encoding: 'utf8',
    });
    return { code: 0, out: stdout };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

// A consumer project pointing at a fake checkout, both under one temp root.
function makeFixture() {
  const base = mkdtempSync(join(tmpdir(), 'wiki-pointers-'));
  const checkout = join(base, 'upstream');
  const consumer = join(base, 'consumer');
  mkdirSync(join(checkout, 'docs', 'wiki', 'engineering'), { recursive: true });
  writeFileSync(join(checkout, 'docs', 'wiki', 'engineering', 'overview.md'), '# Overview\n');
  mkdirSync(join(consumer, '.cursor', 'skills', 'engineering'), { recursive: true });
  writeFileSync(
    join(consumer, '.cursor', 'skills', 'engineering', 'SKILL.md'),
    `Read ${checkout}/docs/wiki/engineering/overview.md for the theory.\n\nNo checkout? Browse raw.example.com/owner/repo instead.\n`
  );
  return { base, checkout, consumer };
}

const baseArgs = (f) => [
  '--checkout', f.checkout,
  '--raw-host', 'raw.example.com/owner/repo',
  '--surfaces', '.cursor/skills:SKILL.md',
  '--root', f.consumer,
];

test('healthy consumer passes', () => {
  const f = makeFixture();
  const r = run(baseArgs(f));
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('resolve'));
});

test('a pointer at a renamed page fails and names the token', () => {
  const f = makeFixture();
  writeFileSync(
    join(f.consumer, '.cursor', 'skills', 'engineering', 'SKILL.md'),
    `Read ${f.checkout}/docs/wiki/engineering/gone.md today.\n\nFallback: raw.example.com/owner/repo.\n`
  );
  const r = run(baseArgs(f));
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('gone.md'));
  assert.ok(r.out.includes('does not resolve'));
});

test('sentence-ending punctuation is stripped before resolving', () => {
  const f = makeFixture();
  writeFileSync(
    join(f.consumer, '.cursor', 'skills', 'engineering', 'SKILL.md'),
    `The theory lives at ${f.checkout}/docs/wiki/engineering/overview.md.\n\nFallback: raw.example.com/owner/repo.\n`
  );
  const r = run(baseArgs(f));
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('a carrier without the raw-URL fallback note fails', () => {
  const f = makeFixture();
  writeFileSync(
    join(f.consumer, '.cursor', 'skills', 'engineering', 'SKILL.md'),
    `Read ${f.checkout}/docs/wiki/engineering/overview.md for the theory.\n`
  );
  const r = run(baseArgs(f));
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('fallback note'));
});

test('a token that escapes the checkout after resolving fails', () => {
  const f = makeFixture();
  writeFileSync(
    join(f.consumer, '.cursor', 'skills', 'engineering', 'SKILL.md'),
    `Sneaky: ${f.checkout}/../outside.md here.\n\nFallback: raw.example.com/owner/repo.\n`
  );
  const r = run(baseArgs(f));
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('escapes the checkout'));
});

test('absent checkout skips with exit 0', () => {
  const f = makeFixture();
  const r = run([
    '--checkout', join(f.base, 'nowhere'),
    '--raw-host', 'raw.example.com/owner/repo',
    '--surfaces', '.cursor/skills:SKILL.md',
    '--root', f.consumer,
  ]);
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('skipping'));
});

test('tilde-form pointers resolve when the checkout sits under HOME', () => {
  const f = makeFixture();
  // Pretend HOME is the fixture base; the checkout is then ~/upstream.
  writeFileSync(
    join(f.consumer, '.cursor', 'skills', 'engineering', 'SKILL.md'),
    'Read ~/upstream/docs/wiki/engineering/overview.md for the theory.\n\nFallback: raw.example.com/owner/repo.\n'
  );
  const r = run(
    ['--checkout', '~/upstream', '--raw-host', 'raw.example.com/owner/repo', '--surfaces', '.cursor/skills:SKILL.md', '--root', f.consumer],
    { HOME: f.base }
  );
  rmSync(f.base, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('All 1 pointers'));
});

test('missing required arguments refuse loudly instead of guessing', () => {
  const r = run(['--checkout', '/tmp']);
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('refuses to guess'));
});
