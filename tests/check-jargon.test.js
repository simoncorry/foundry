import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'check-jargon.js');

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

// Fixtures use an invented phrase so nothing depends on the real list.
function makeFixture(listContent) {
  const root = mkdtempSync(join(tmpdir(), 'jargon-fixture-'));
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, '.cursor', 'commands'), { recursive: true });
  mkdirSync(join(root, 'tests'), { recursive: true });
  writeFileSync(
    join(root, 'scripts', 'phrase-list.json'),
    listContent ?? JSON.stringify([{ bad: 'zorbly flux', good: 'plain thing' }])
  );
  writeFileSync(join(root, 'README.md'), '# Fixture\n\nClean prose.\n');
  writeFileSync(join(root, 'AGENTS.md'), '# Rules\n\nClean prose.\n');
  writeFileSync(join(root, 'CLAUDE.md'), '@AGENTS.md\n');
  return root;
}

test('a clean tree passes', () => {
  const root = makeFixture();
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('OK'));
});

test('a listed phrase in doc prose fails with file, line, and rewrite', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'One.\n\nThis has zorbly flux in it.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('docs/page.md:3'));
  assert.ok(r.out.includes('plain thing'));
});

test('a listed phrase in a command file fails', () => {
  const root = makeFixture();
  writeFileSync(join(root, '.cursor', 'commands', 'thing.md'), 'Step one: zorbly flux.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('.cursor/commands/thing.md:1'));
});

test('matching is case-insensitive', () => {
  const root = makeFixture();
  writeFileSync(join(root, 'docs', 'page.md'), 'A Zorbly FLUX indeed.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
});

test('fenced blocks and inline code spans do not trip the gate', () => {
  const root = makeFixture();
  writeFileSync(
    join(root, 'docs', 'page.md'),
    'Fine.\n\n```\nzorbly flux inside a fence\n```\n\nAnd `zorbly flux` inline. Both quoted, not prose.\n'
  );
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('a listed phrase in a JS line comment and a multi-line block comment fails', () => {
  const root = makeFixture();
  writeFileSync(
    join(root, 'scripts', 'a.js'),
    'const x = 1; // a zorbly flux note\n'
  );
  writeFileSync(
    join(root, 'tests', 'b.js'),
    '/*\n  spanning lines\n  with zorbly flux inside\n*/\nconst y = 2;\n'
  );
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('scripts/a.js:1'));
  assert.ok(r.out.includes('tests/b.js:3'), 'block comment hit must carry its real line');
});

test('string and template literals are code, not prose', () => {
  const root = makeFixture();
  writeFileSync(
    join(root, 'scripts', 'a.js'),
    "const a = 'zorbly flux in a string';\nconst b = \"zorbly flux again\";\nconst c = `zorbly flux in a template`;\n"
  );
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('a doubled slash inside a string literal is not a comment', () => {
  const root = makeFixture();
  writeFileSync(
    join(root, 'scripts', 'a.js'),
    "const url = 'http://example.com zorbly flux';\nconst ok = 1;\n"
  );
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('an unparseable list fails loud instead of passing silently', () => {
  const root = makeFixture('{ not valid json');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('BROKEN LIST'));
});

test('a malformed entry fails loud and names the entry', () => {
  const root = makeFixture(JSON.stringify([
    { bad: 'zorbly flux', good: 'plain thing' },
    { bad: 'half an entry' },
  ]));
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('BROKEN LIST'));
  assert.ok(r.out.includes('half an entry'));
});

test('the phrase list itself is not scanned', () => {
  // The fixture list contains its own bad phrases by definition; a clean
  // tree passing (the first test) already proves this, but pin it against
  // a list whose good text quotes the bad phrase of another entry style.
  const root = makeFixture(JSON.stringify([{ bad: 'zorbly flux', good: 'plain thing' }]));
  writeFileSync(join(root, 'docs', 'page.md'), 'Clean.\n');
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
});

test('the real repo passes its own jargon gate', () => {
  const r = run(repoRoot);
  assert.equal(r.code, 0, r.out);
});
