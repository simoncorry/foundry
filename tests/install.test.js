import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'install.js');

function run(args) {
  try {
    const stdout = execFileSync('node', [script, ...args], { encoding: 'utf8' });
    return { code: 0, out: stdout };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

test('fresh install populates the documented set and only that set', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-fresh-'));
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(existsSync(join(target, '.cursor', 'commands', 'build-it.md')));
  assert.ok(existsSync(join(target, '.claude', 'commands', 'wrap-up.md')));
  assert.ok(existsSync(join(target, '.agents', 'skills', 'frame-it', 'SKILL.md')));
  assert.ok(existsSync(join(target, 'AGENTS.md')));
  assert.ok(existsSync(join(target, 'CLAUDE.md')));
  assert.ok(existsSync(join(target, 'scripts', 'phrase-list.json')));
  assert.ok(!existsSync(join(target, 'docs')), 'wiki must stay home without --wiki');
  assert.ok(!existsSync(join(target, 'README.md')), 'Foundry\'s own README must not ride along');
  assert.ok(!existsSync(join(target, 'tests')), 'Foundry\'s tests must not ride along');
  assert.ok(r.out.includes('0 updated, 0 unchanged'));
  rmSync(target, { recursive: true, force: true });
});

test('--wiki includes the reference library', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-wiki-'));
  const r = run([target, '--wiki']);
  assert.equal(r.code, 0);
  assert.ok(existsSync(join(target, 'docs', 'wiki', 'INDEX.md')));
  assert.ok(r.out.includes('wiki included'));
  rmSync(target, { recursive: true, force: true });
});

test('re-run updates a changed copy and reports it', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-rerun-'));
  run([target]);
  writeFileSync(join(target, 'AGENTS.md'), 'locally diverged\n');
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('update AGENTS.md'));
  assert.ok(r.out.includes('1 updated'));
  const restored = readFileSync(join(target, 'AGENTS.md'), 'utf8');
  assert.ok(restored.includes('Foundry'), 'overwrite restores the upstream copy');
  rmSync(target, { recursive: true, force: true });
});

test('dry run reports without writing', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-dry-'));
  const r = run([join(target, 'fresh'), '--dry-run']);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('would create'));
  assert.ok(r.out.includes('nothing written'));
  assert.ok(!existsSync(join(target, 'fresh')), 'dry run must not create the target');
  rmSync(target, { recursive: true, force: true });
});

test('a target inside the Foundry repo refuses before creating anything', () => {
  const inRepo = join(repoRoot, 'tmp-install-refusal-probe');
  const r = run([inRepo]);
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('inside the Foundry repo'));
  assert.ok(!existsSync(inRepo), 'refusal must leave no directory behind');
});

test('a symlinked parent pointing into the repo cannot dodge the refusal', () => {
  const base = mkdtempSync(join(tmpdir(), 'install-symlink-'));
  const link = join(base, 'sneaky');
  symlinkSync(repoRoot, link);
  const r = run([join(link, 'sub')]);
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('inside the Foundry repo'));
  assert.ok(!existsSync(join(repoRoot, 'sub')), 'refusal must leave no directory behind');
  rmSync(base, { recursive: true, force: true });
});

test('a file as target refuses', () => {
  const base = mkdtempSync(join(tmpdir(), 'install-file-'));
  const file = join(base, 'plain.txt');
  writeFileSync(file, 'x\n');
  const r = run([file]);
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('is a file'));
  rmSync(base, { recursive: true, force: true });
});
