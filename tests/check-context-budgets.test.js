import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  CONTEXT_LIMITS,
  evaluateContextBudgets,
  measureContextBudgets,
} from '../scripts/check-context-budgets.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'check-context-budgets.js');
const extensionlessScript = script.replace(/\.js$/, '');

function makeFixture({ agents = 'rules\n', commands = { 'alpha.md': 'command\n' } } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'context-budgets-'));
  writeFileSync(join(root, 'AGENTS.md'), agents);
  if (commands !== null) {
    mkdirSync(join(root, '.cursor', 'commands'), { recursive: true });
    for (const [name, body] of Object.entries(commands)) {
      writeFileSync(join(root, '.cursor', 'commands', name), body);
    }
  }
  return root;
}

function run(root, args = []) {
  try {
    const out = execFileSync('node', [script, ...args], {
      env: { ...process.env, CONTEXT_BUDGET_ROOT: root },
      encoding: 'utf8',
    });
    return { code: 0, out };
  } catch (error) {
    return { code: error.status, out: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

test('passes ordinary input and reports the measured command set', () => {
  const root = makeFixture({ commands: { 'beta.md': '12345', 'alpha.md': '123' } });
  try {
    const measurement = measureContextBudgets(root);
    assert.deepEqual(measurement.commandFiles, [
      { path: '.cursor/commands/beta.md', bytes: 5 },
      { path: '.cursor/commands/alpha.md', bytes: 3 },
    ]);
    assert.equal(measurement.commandBytes, 8);
    assert.equal(measurement.commandCount, 2);
    assert.deepEqual(evaluateContextBudgets(measurement).violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the exact boundaries pass and one byte over fails with an exact overage', () => {
  const root = makeFixture({
    agents: 'a'.repeat(CONTEXT_LIMITS.agentsBytes),
    commands: { 'alpha.md': 'b'.repeat(CONTEXT_LIMITS.commandBytes) },
  });
  try {
    assert.equal(evaluateContextBudgets(measureContextBudgets(root)).ok, true);
    writeFileSync(
      join(root, '.cursor', 'commands', 'alpha.md'),
      'b'.repeat(CONTEXT_LIMITS.commandBytes + 1)
    );
    const evaluation = evaluateContextBudgets(measureContextBudgets(root));
    assert.deepEqual(evaluation.violations, [
      {
        name: 'source commands',
        actual: CONTEXT_LIMITS.commandBytes + 1,
        limit: CONTEXT_LIMITS.commandBytes,
      },
    ]);
    const checked = run(root, ['--check']);
    assert.equal(checked.code, 1);
    assert.ok(checked.out.includes('1 byte above'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('normalizes CRLF and lone CR before measuring', () => {
  const lf = makeFixture({ agents: 'one\ntwo\n', commands: { 'alpha.md': 'a\nb\n' } });
  const mixed = makeFixture({ agents: 'one\r\ntwo\r', commands: { 'alpha.md': 'a\r\nb\r' } });
  try {
    assert.deepEqual(measureContextBudgets(mixed), measureContextBudgets(lf));
  } finally {
    rmSync(lf, { recursive: true, force: true });
    rmSync(mixed, { recursive: true, force: true });
  }
});

test('refuses missing AGENTS.md, a missing command directory, and an empty command directory', () => {
  const missingAgents = makeFixture();
  const missingCommands = makeFixture({ commands: null });
  const emptyCommands = makeFixture({ commands: {} });
  rmSync(join(missingAgents, 'AGENTS.md'));
  try {
    assert.throws(() => measureContextBudgets(missingAgents), /AGENTS\.md could not be read/);
    assert.throws(() => measureContextBudgets(missingCommands), /source command directory could not be read/);
    assert.throws(() => measureContextBudgets(emptyCommands), /contains no markdown commands/);
  } finally {
    rmSync(missingAgents, { recursive: true, force: true });
    rmSync(missingCommands, { recursive: true, force: true });
    rmSync(emptyCommands, { recursive: true, force: true });
  }
});

test('refuses an unreadable command file', () => {
  const root = makeFixture();
  const file = join(root, '.cursor', 'commands', 'alpha.md');
  chmodSync(file, 0o000);
  try {
    assert.throws(() => measureContextBudgets(root), /alpha\.md could not be read/);
  } finally {
    chmodSync(file, 0o600);
    rmSync(root, { recursive: true, force: true });
  }
});

test('counts symlinked markdown commands instead of permitting a budget bypass', () => {
  const root = makeFixture({ commands: {} });
  const target = join(root, 'shared-command.md');
  writeFileSync(target, 'linked command\n');
  symlinkSync(target, join(root, '.cursor', 'commands', 'linked.md'));
  try {
    const measurement = measureContextBudgets(root);
    assert.equal(measurement.commandCount, 1);
    assert.equal(measurement.commandBytes, 15);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('report mode stays informational while check mode enforces the ceiling', () => {
  const root = makeFixture({
    agents: 'a'.repeat(CONTEXT_LIMITS.agentsBytes + 1),
    commands: { 'small.md': 'x', 'largest.md': 'xxx' },
  });
  try {
    const report = run(root);
    assert.equal(report.code, 0);
    assert.ok(report.out.includes('AGENTS.md'));
    assert.ok(report.out.indexOf('source commands') < report.out.indexOf('.cursor/commands/largest.md'));
    assert.ok(report.out.indexOf('.cursor/commands/largest.md') < report.out.indexOf('.cursor/commands/small.md'));

    const checked = run(root, ['--check']);
    assert.equal(checked.code, 1);
    assert.ok(checked.out.includes('OVER'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the extensionless CLI spelling still executes the checker', () => {
  const root = makeFixture();
  try {
    const out = execFileSync('node', [extensionlessScript, '--check'], {
      env: { ...process.env, CONTEXT_BUDGET_ROOT: root },
      encoding: 'utf8',
    });
    assert.ok(out.includes('[context-budgets] AGENTS.md'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('importing the checker never measures the checkout or exits', () => {
  const missingRoot = join(tmpdir(), 'context-budget-root-that-does-not-exist');
  const out = execFileSync(
    'node',
    ['--input-type=module', '--eval', `await import('${pathToFileURL(script).href}'); console.log('imported')`],
    { env: { ...process.env, CONTEXT_BUDGET_ROOT: missingRoot }, encoding: 'utf8' }
  );
  assert.equal(out, 'imported\n');
});
