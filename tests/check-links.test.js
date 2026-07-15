import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'check-links.js');

function run(rootOverride) {
  try {
    const stdout = execFileSync('node', [script], {
      env: { ...process.env, CHECK_ROOT: rootOverride ?? '' },
      encoding: 'utf8',
    });
    return { code: 0, out: stdout };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

// A minimal healthy tree the failure cases then poke holes in.
function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'links-fixture-'));
  mkdirSync(join(root, '.cursor', 'commands'), { recursive: true });
  mkdirSync(join(root, 'docs', 'plans'), { recursive: true });
  mkdirSync(join(root, 'scripts'), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { check: 'x' } }));
  writeFileSync(join(root, 'AGENTS.md'), '# Agreement\n\n## Voice\n\nWords.\n\n## Plans\n\nMore words.\n');
  writeFileSync(join(root, 'CLAUDE.md'), '@AGENTS.md\n');
  writeFileSync(join(root, 'README.md'), '# Fixture\n\nSee AGENTS.md § Voice.\n');
  writeFileSync(join(root, 'scripts', 'real.js'), '// present\n');
  writeFileSync(join(root, '.cursor', 'commands', 'frame-it.md'), 'The frame-it command.\n');
  writeFileSync(join(root, 'docs', 'plans', 'README.md'), '# Plans\n\nShape per AGENTS.md § Plans.\n');
  return root;
}

test('healthy fixture passes', () => {
  const root = makeFixture();
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('every reference resolves'));
});

test('backticked section reference with a dead heading fails with file and line', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'One.\n\nPer `AGENTS.md § Ghost Section` do things.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('docs/page.md:3'));
  assert.ok(r.out.includes('Ghost Section'));
});

test('plain-prose citation with a dead heading fails; punctuation bounds the capture', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'Follow AGENTS.md § Nonexistent Thing. Then stop.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('Nonexistent Thing'));
  assert.ok(!r.out.includes('Then stop'), 'capture must stop at the period');
});

test('prose citation of a real heading passes even mid-sentence', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'Do it (AGENTS.md § Voice) and also, per AGENTS.md § Plans, this.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('missing file reference fails', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'Run `node scripts/gone.js` today.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('scripts/gone.js'));
});

test('unresolvable slash command fails while the external allowlist passes', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'Compare `/goal` with `/made-up-command` here.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('made-up-command'));
  assert.ok(!r.out.includes('/goal'), 'allowlisted external command must not be flagged');
});

test('placeholder paths need only their static prefix; a missing prefix fails', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'Plans at `docs/plans/<slug>.md` and skills at `nowhere/<name>/SKILL.md`.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('nowhere/<name>/SKILL.md'));
  assert.ok(!r.out.includes('docs/plans/<slug>.md'), 'existing static prefix must pass');
});

test('relative markdown link to a missing target fails; web links are ignored', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), '[gone](missing.md) and [web](https://example.com/x).\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('missing.md'));
  assert.ok(!r.out.includes('example.com'));
});

test('references inside fenced code blocks are ignored', () => {
  const root = makeFixture();
  writeFileSync(
    join(root, 'docs', 'page.md'),
    'Fine text.\n\n```\nnode scripts/gone.js\nAGENTS.md § Ghost Section\n[x](missing.md)\n```\n\nMore fine text.\n'
  );
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('trailing sentence punctuation on a bare prose path is stripped', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'light.md'), 'x\n');
  writeFileSync(join(root, 'docs', 'page.md'), 'See docs/light.md. Also docs/absent.md.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('docs/absent.md'));
  assert.ok(!r.out.includes('docs/light.md'), 'existing path with trailing period must pass');
});

test('the real repo passes its own link check', () => {
  const r = run(repoRoot);
  assert.equal(r.code, 0, r.out);
});

// The four load-bearing AGENTS.md headings, pinned individually: a rename
// of any one breaks citations all over the command files, and this is the
// first place that break should show up.
for (const heading of ['Voice', 'The flow guarantee', 'The background-work barrier', 'Plans']) {
  test(`AGENTS.md still carries the "${heading}" heading`, () => {
    const content = readFileSync(join(repoRoot, 'AGENTS.md'), 'utf8');
    assert.ok(new RegExp(`^##\\s+${heading}\\s*$`, 'm').test(content));
  });
}
