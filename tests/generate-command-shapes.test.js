import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'generate-command-shapes.js');

// Each test gets its own throwaway tree so nothing touches the real repo.
function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'foundry-shapes-'));
  mkdirSync(join(root, '.cursor', 'commands'), { recursive: true });
  return root;
}

function run(root, args = []) {
  try {
    const stdout = execFileSync('node', [script, ...args], {
      env: { ...process.env, SHAPES_ROOT: root },
      encoding: 'utf8',
    });
    return { code: 0, stdout };
  } catch (err) {
    return { code: err.status, stdout: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

test('generates a byte-identical Claude copy and a frontmattered Codex skill', () => {
  const root = makeFixture();
  try {
    const body = 'Run the alpha stage. It does one thing.\n\n## Steps\n\n1. Do the thing.\n';
    writeFileSync(join(root, '.cursor', 'commands', 'alpha.md'), body);

    const { code } = run(root);
    assert.equal(code, 0);

    assert.equal(readFileSync(join(root, '.claude', 'commands', 'alpha.md'), 'utf8'), body);

    const skill = readFileSync(join(root, '.agents', 'skills', 'alpha', 'SKILL.md'), 'utf8');
    assert.ok(skill.startsWith("---\nname: 'alpha'\ndescription: 'Run the alpha stage.'\n---\n"));
    assert.ok(skill.includes('Generated from .cursor/commands/alpha.md'));
    assert.ok(skill.endsWith(body));

    const policy = readFileSync(join(root, '.agents', 'skills', 'alpha', 'agents', 'openai.yaml'), 'utf8');
    assert.equal(policy, 'policy:\n  allow_implicit_invocation: false\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('description falls back to the whole first line when it has no sentence break, and survives hostile punctuation', () => {
  const root = makeFixture();
  try {
    writeFileSync(join(root, '.cursor', 'commands', 'beta.md'), "When the human says 'go', use \\$skill to start\nmore text\n");
    const { code } = run(root);
    assert.equal(code, 0);
    const skill = readFileSync(join(root, '.agents', 'skills', 'beta', 'SKILL.md'), 'utf8');
    // Single-quoted YAML: quotes double, backslashes stay literal and inert.
    assert.ok(skill.includes("description: 'When the human says ''go'', use \\$skill to start'"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('confirm mode passes on a freshly generated tree', () => {
  const root = makeFixture();
  try {
    writeFileSync(join(root, '.cursor', 'commands', 'alpha.md'), 'First sentence here. Second.\n');
    assert.equal(run(root).code, 0);
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 0);
    assert.ok(confirm.stdout.includes('all three shapes in sync'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('confirm mode fails when a generated copy is edited directly', () => {
  const root = makeFixture();
  try {
    writeFileSync(join(root, '.cursor', 'commands', 'alpha.md'), 'First sentence here. Second.\n');
    run(root);
    writeFileSync(join(root, '.claude', 'commands', 'alpha.md'), 'tampered\n');
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 1);
    assert.ok(confirm.stdout.includes('DRIFT'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('confirm mode fails when a shape is missing entirely', () => {
  const root = makeFixture();
  try {
    writeFileSync(join(root, '.cursor', 'commands', 'alpha.md'), 'First sentence here. Second.\n');
    run(root);
    rmSync(join(root, '.agents', 'skills', 'alpha'), { recursive: true, force: true });
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 1);
    assert.ok(confirm.stdout.includes('(missing)'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the real repo tree is in sync (confirm against the actual shapes)', () => {
  // Read-only against the repo itself: proves the committed shapes match
  // the committed sources, the same thing CI will assert at slice 5.
  const confirm = run(repoRoot, ['--confirm']);
  assert.equal(confirm.code, 0);
  assert.ok(existsSync(join(repoRoot, '.agents', 'skills', 'wrap-up', 'SKILL.md')));
});
