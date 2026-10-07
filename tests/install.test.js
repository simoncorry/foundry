import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
  assert.ok(existsSync(join(target, '.agents', 'skills', 'frame-it', 'SKILL.md')));
  assert.ok(existsSync(join(target, '.claude', 'skills', 'wrap-up', 'SKILL.md')));
  assert.ok(!existsSync(join(target, '.cursor')), 'Cursor reads the skills; a commands copy would duplicate them');
  assert.ok(!existsSync(join(target, '.claude', 'commands')), 'Cursor reads the skills; a commands copy would duplicate them');
  assert.ok(existsSync(join(target, 'AGENTS.md')));
  assert.equal(readFileSync(join(target, 'CLAUDE.md'), 'utf8'), readFileSync(join(repoRoot, 'CLAUDE.md'), 'utf8'));
  assert.ok(existsSync(join(target, 'scripts', 'phrase-list.json')));
  assert.ok(existsSync(join(target, 'scripts', 'check-context-budgets.js')));
  assert.ok(!existsSync(join(target, 'docs')), 'wiki must stay home without --wiki');
  assert.ok(!existsSync(join(target, 'README.md')), 'Foundry\'s own README must not ride along');
  assert.ok(!existsSync(join(target, 'tests')), 'Foundry\'s tests must not ride along');
  assert.ok(r.out.includes('0 updated, 0 removed, 0 unchanged'));
  assert.ok(r.out.includes('create CLAUDE.md'));
  assert.ok(!r.out.includes('note:'), 'a fresh target needs no CLAUDE.md notice');
  rmSync(target, { recursive: true, force: true });
});

test("re-install removes old Foundry command copies and keeps the project's own", () => {
  const target = mkdtempSync(join(tmpdir(), 'install-old-commands-'));
  for (const dir of [join(target, '.cursor', 'commands'), join(target, '.claude', 'commands')]) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'build-it.md'), 'an older Foundry copy\n');
    writeFileSync(join(dir, 'deploy.md'), 'the project\'s own command\n');
  }
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('remove .cursor/commands/build-it.md'));
  assert.ok(r.out.includes('remove .claude/commands/build-it.md'));
  assert.ok(r.out.includes('2 removed'));
  assert.ok(!existsSync(join(target, '.cursor', 'commands', 'build-it.md')));
  assert.ok(!existsSync(join(target, '.claude', 'commands', 'build-it.md')));
  assert.equal(readFileSync(join(target, '.cursor', 'commands', 'deploy.md'), 'utf8'), 'the project\'s own command\n');
  assert.equal(readFileSync(join(target, '.claude', 'commands', 'deploy.md'), 'utf8'), 'the project\'s own command\n');
  assert.ok(existsSync(join(target, '.agents', 'skills', 'build-it', 'SKILL.md')));
  rmSync(target, { recursive: true, force: true });
});

test('a commands folder that links outside the project is never cleaned', () => {
  const base = mkdtempSync(join(tmpdir(), 'install-linked-commands-'));
  const outside = join(base, 'outside');
  const target = join(base, 'project');
  mkdirSync(outside, { recursive: true });
  mkdirSync(join(target, '.cursor'), { recursive: true });
  writeFileSync(join(outside, 'start-up.md'), 'someone else\'s file\n');
  symlinkSync(outside, join(target, '.cursor', 'commands'));
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('skip .cursor/commands: it resolves outside the project'), r.out);
  assert.equal(readFileSync(join(outside, 'start-up.md'), 'utf8'), 'someone else\'s file\n');
  assert.ok(r.out.includes('0 removed'));
  rmSync(base, { recursive: true, force: true });
});

test('symlinks that would carry a write outside the project stop the run before anything is written', () => {
  const cases = {
    'a linked file': (project, elsewhere) => {
      mkdirSync(join(project, 'scripts'), { recursive: true });
      symlinkSync(join(elsewhere, 'victim.txt'), join(project, 'scripts', 'install.js'));
    },
    'a linked folder deep inside': (project, elsewhere) => {
      mkdirSync(join(project, '.agents', 'skills'), { recursive: true });
      symlinkSync(elsewhere, join(project, '.agents', 'skills', 'quiz'));
    },
    'a dangling CLAUDE.md link': (project, elsewhere) => {
      symlinkSync(join(elsewhere, 'made-by-installer.txt'), join(project, 'CLAUDE.md'));
    },
    'a linked top-level folder that stays inside': (project) => {
      mkdirSync(join(project, 'real-scripts'));
      symlinkSync(join(project, 'real-scripts'), join(project, 'scripts'));
    },
  };
  for (const [name, arrange] of Object.entries(cases)) {
    const base = mkdtempSync(join(tmpdir(), 'install-escape-'));
    const project = join(base, 'project');
    const elsewhere = join(base, 'elsewhere');
    mkdirSync(project);
    mkdirSync(elsewhere);
    writeFileSync(join(elsewhere, 'victim.txt'), 'someone else\'s file\n');
    arrange(project, elsewhere);
    const r = run([project]);
    assert.equal(r.code, 1, name);
    assert.ok(r.out.includes("can't safely write through"), `${name}: ${r.out}`);
    assert.ok(r.out.includes('nothing written'), name);
    assert.equal(readFileSync(join(elsewhere, 'victim.txt'), 'utf8'), 'someone else\'s file\n', name);
    assert.deepEqual(readdirSync(elsewhere), ['victim.txt'], name);
    assert.ok(!existsSync(join(project, 'AGENTS.md')), `${name}: nothing may be written`);
    rmSync(base, { recursive: true, force: true });
  }
});

test('a copy that fails partway leaves the old command copies in place', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-partial-'));
  mkdirSync(join(target, '.cursor', 'commands'), { recursive: true });
  writeFileSync(join(target, '.cursor', 'commands', 'build-it.md'), 'an older Foundry copy\n');
  // A file where the skills folder should go makes the copy fail.
  writeFileSync(join(target, '.agents'), 'not a folder\n');
  const r = run([target]);
  assert.notEqual(r.code, 0);
  assert.equal(readFileSync(join(target, '.cursor', 'commands', 'build-it.md'), 'utf8'), 'an older Foundry copy\n');
  rmSync(target, { recursive: true, force: true });
});

test('the CLAUDE.md notice names both files when neither imports AGENTS.md', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-two-claude-'));
  mkdirSync(join(target, '.claude'), { recursive: true });
  writeFileSync(join(target, 'CLAUDE.md'), 'root notes\n');
  writeFileSync(join(target, '.claude', 'CLAUDE.md'), 'nested notes\n');
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes("note: CLAUDE.md and .claude/CLAUDE.md don't import AGENTS.md"), r.out);
  assert.ok(r.out.includes('Add a line reading @AGENTS.md to one of them.'), r.out);
  rmSync(target, { recursive: true, force: true });
});

test('dry run reports old command copies without removing them', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-old-dry-'));
  mkdirSync(join(target, '.cursor', 'commands'), { recursive: true });
  writeFileSync(join(target, '.cursor', 'commands', 'handoff.md'), 'an older Foundry copy\n');
  const r = run([target, '--dry-run']);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('would remove .cursor/commands/handoff.md'));
  assert.ok(existsSync(join(target, '.cursor', 'commands', 'handoff.md')), 'dry run must not remove anything');
  assert.ok(!existsSync(join(target, '.agents')), 'dry run must not write anything');
  rmSync(target, { recursive: true, force: true });
});

test("a project's own CLAUDE.md survives install and re-install, with a notice when it skips AGENTS.md", () => {
  const target = mkdtempSync(join(tmpdir(), 'install-own-claude-'));
  const own = '# Our Claude notes\n\nUse tabs.\n';
  writeFileSync(join(target, 'CLAUDE.md'), own);
  for (let pass = 0; pass < 2; pass += 1) {
    const r = run([target]);
    assert.equal(r.code, 0);
    assert.equal(readFileSync(join(target, 'CLAUDE.md'), 'utf8'), own);
    assert.ok(!r.out.includes('create CLAUDE.md'));
    assert.ok(r.out.includes("note: CLAUDE.md doesn't import AGENTS.md, so Claude Code won't load Foundry's rules. Add a line reading @AGENTS.md to it."), r.out);
  }
  rmSync(target, { recursive: true, force: true });
});

test('no notice when the project\'s CLAUDE.md, at the root or inside .claude, already imports AGENTS.md', () => {
  for (const file of ['CLAUDE.md', join('.claude', 'CLAUDE.md')]) {
    const target = mkdtempSync(join(tmpdir(), 'install-imported-claude-'));
    mkdirSync(join(target, '.claude'), { recursive: true });
    const own = '@AGENTS.md\n\nAnd our own notes.\n';
    writeFileSync(join(target, file), own);
    const r = run([target]);
    assert.equal(r.code, 0);
    assert.ok(!r.out.includes('note:'), file);
    assert.equal(readFileSync(join(target, file), 'utf8'), own);
    if (file !== 'CLAUDE.md') assert.ok(!existsSync(join(target, 'CLAUDE.md')), 'an existing .claude/CLAUDE.md counts');
    rmSync(target, { recursive: true, force: true });
  }
});

test('install copies the budget checker without rewriting consumer package scripts', () => {
  const target = mkdtempSync(join(tmpdir(), 'install-package-boundary-'));
  const packageFile = join(target, 'package.json');
  const original = JSON.stringify({ scripts: { check: 'consumer-owned-check' } }, null, 2) + '\n';
  writeFileSync(packageFile, original);
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(existsSync(join(target, 'scripts', 'check-context-budgets.js')));
  assert.equal(readFileSync(packageFile, 'utf8'), original);
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
