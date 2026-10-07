import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkill, splitSkill } from '../scripts/skill-file.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'generate-command-shapes.js');

// Each test gets its own throwaway tree so nothing touches the real repo.
function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'foundry-shapes-'));
  mkdirSync(join(root, '.agents', 'skills'), { recursive: true });
  return root;
}

function sourcePath(root, name) {
  return join(root, '.agents', 'skills', name, 'SKILL.md');
}

function claudePath(root, name) {
  return join(root, '.claude', 'skills', name, 'SKILL.md');
}

function writeSource(root, name, text) {
  mkdirSync(join(root, '.agents', 'skills', name), { recursive: true });
  writeFileSync(sourcePath(root, name), text);
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

function snapshot(root) {
  const files = {};
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files[full.slice(root.length)] = readFileSync(full, 'utf8');
    }
  };
  walk(root);
  return files;
}

function withFixture(fn) {
  const root = makeFixture();
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('a header-less body gets a header, a byte-identical Claude copy, and the Codex policy', () => {
  withFixture((root) => {
    const body = 'Run the alpha stage. It does one thing.\n\n## Steps\n\n1. Do the thing.\n';
    writeSource(root, 'alpha', body);

    assert.equal(run(root).code, 0);

    const skill = readFileSync(sourcePath(root, 'alpha'), 'utf8');
    assert.equal(
      skill,
      "---\nname: 'alpha'\ndescription: 'Run the alpha stage.'\ndisable-model-invocation: true\n---\n\n" + body
    );
    assert.equal(readFileSync(claudePath(root, 'alpha'), 'utf8'), skill);
    const policy = readFileSync(join(root, '.agents', 'skills', 'alpha', 'agents', 'openai.yaml'), 'utf8');
    assert.equal(policy, 'policy:\n  allow_implicit_invocation: false\n');
  });
});

test('description falls back to the whole first line when it has no sentence break, and survives hostile punctuation', () => {
  withFixture((root) => {
    writeSource(root, 'beta', "When the human says 'go', use \\$skill to start\nmore text\n");
    assert.equal(run(root).code, 0);
    const skill = readFileSync(sourcePath(root, 'beta'), 'utf8');
    // Single-quoted YAML: quotes double, backslashes stay literal and inert.
    assert.ok(skill.includes("description: 'When the human says ''go'', use \\$skill to start'"));
  });
});

test("construct-the-plan's real body round-trips byte for byte despite its --- lines", () => {
  const real = splitSkill(readFileSync(join(repoRoot, '.agents', 'skills', 'construct-the-plan', 'SKILL.md'), 'utf8')).body;
  assert.ok(/^---$/m.test(real), 'the fixture only proves something if the body has --- lines');
  withFixture((root) => {
    writeSource(root, 'construct-the-plan', real);
    assert.equal(run(root).code, 0);
    assert.equal(splitSkill(readFileSync(sourcePath(root, 'construct-the-plan'), 'utf8')).body, real);
    assert.equal(run(root).code, 0);
    assert.equal(splitSkill(readFileSync(sourcePath(root, 'construct-the-plan'), 'utf8')).body, real);
  });
});

test('two runs in a row leave every file unchanged', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    writeSource(root, 'beta', buildSkill('beta', 'Already has a header. Fine.\n'));
    assert.equal(run(root).code, 0);
    const first = snapshot(root);
    assert.equal(run(root).code, 0);
    assert.deepEqual(snapshot(root), first);
  });
});

test('a byte-order mark is dropped without stacking a second header', () => {
  withFixture((root) => {
    const body = 'Marked file. Body.\n';
    writeSource(root, 'alpha', '\uFEFF' + buildSkill('alpha', body));
    assert.equal(run(root).code, 0);
    assert.equal(readFileSync(sourcePath(root, 'alpha'), 'utf8'), buildSkill('alpha', body));
    assert.equal(run(root, ['--confirm']).code, 0);
  });
});

test('a Windows checkout with \\r\\n line endings confirms clean without a rewrite', () => {
  withFixture((root) => {
    const crlf = (s) => s.replace(/\n/g, '\r\n');
    const body = 'Windows file. Body.\n\nMore.\n';
    writeSource(root, 'alpha', buildSkill('alpha', body));
    assert.equal(run(root).code, 0);
    for (const path of [sourcePath(root, 'alpha'), claudePath(root, 'alpha')]) {
      writeFileSync(path, crlf(readFileSync(path, 'utf8')));
    }
    const before = snapshot(root);
    assert.equal(run(root, ['--confirm']).code, 0);
    assert.equal(run(root).code, 0);
    assert.deepEqual(snapshot(root), before);
  });
});

test('confirm mode passes on a freshly generated tree', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    assert.equal(run(root).code, 0);
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 0);
    assert.ok(confirm.stdout.includes('skills and Claude copies in sync'));
  });
});

test('confirm mode fails when the Claude copy is edited directly', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    run(root);
    writeFileSync(claudePath(root, 'alpha'), 'tampered\n');
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 1);
    assert.ok(confirm.stdout.includes('DRIFT: .claude/skills/alpha/SKILL.md'));
  });
});

test('confirm mode fails when the source header goes stale', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    run(root);
    const path = sourcePath(root, 'alpha');
    writeFileSync(path, readFileSync(path, 'utf8').replace('First sentence here.', 'Edited by hand.'));
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 1);
    assert.ok(confirm.stdout.includes('DRIFT: .agents/skills/alpha/SKILL.md'));
  });
});

test('confirm mode fails on an orphan file no source produces', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    run(root);
    mkdirSync(join(root, '.claude', 'skills', 'stray'), { recursive: true });
    writeFileSync(claudePath(root, 'stray'), 'hand-written, no source\n');
    writeFileSync(join(root, '.agents', 'skills', 'alpha', 'notes.md'), 'stray beside a source\n');
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 1);
    assert.ok(confirm.stdout.includes('.claude/skills/stray/SKILL.md (no source produces this file)'));
    assert.ok(confirm.stdout.includes('.agents/skills/alpha/notes.md (no source produces this file)'));
  });
});

test('confirm mode fails when a Claude copy is missing entirely', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    run(root);
    rmSync(join(root, '.claude', 'skills', 'alpha'), { recursive: true, force: true });
    const confirm = run(root, ['--confirm']);
    assert.equal(confirm.code, 1);
    assert.ok(confirm.stdout.includes('(missing)'));
  });
});

test('an unknown header key fails and nothing is written', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', 'First sentence here. Second.\n');
    const handAdded = "---\nname: 'beta'\npaths: '**/*.md'\n---\n\nBeta body. More.\n";
    writeSource(root, 'beta', handAdded);
    const r = run(root);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes('header line "paths:'));
    assert.ok(r.stdout.includes('nothing written'));
    assert.equal(readFileSync(sourcePath(root, 'alpha'), 'utf8'), 'First sentence here. Second.\n');
    assert.equal(readFileSync(sourcePath(root, 'beta'), 'utf8'), handAdded);
    assert.ok(!existsSync(join(root, '.claude')), 'one bad skill must stop every write');
  });
});

test('a header left inside the body refuses instead of stacking', () => {
  withFixture((root) => {
    writeSource(root, 'alpha', '\n' + buildSkill('alpha', 'Body. More.\n'));
    const r = run(root);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes('still starts with a --- line'));
  });
});

test('an invalid folder name, an empty body, and a folder with no SKILL.md each fail', () => {
  for (const [name, text, expected] of [
    ['Ship-It', 'Body. More.\n', 'folder name "Ship-It"'],
    ['double--hyphen', 'Body. More.\n', 'folder name "double--hyphen"'],
    ['empty', '\n\n', 'the body is empty'],
    ['long', `${'word '.repeat(220)}end.\n`, 'the description limit is 1024'],
  ]) {
    withFixture((root) => {
      writeSource(root, name, text);
      const r = run(root);
      assert.equal(r.code, 1, name);
      assert.ok(r.stdout.includes(expected), `${name}: ${r.stdout}`);
    });
  }
  withFixture((root) => {
    mkdirSync(join(root, '.agents', 'skills', 'hollow'), { recursive: true });
    const r = run(root);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes('.agents/skills/hollow/SKILL.md: missing'));
  });
});

test('the real repo tree is in sync and the old command folders are gone', () => {
  // Read-only against the repo itself: proves the committed copies match
  // the committed skill files, the same thing CI asserts on every push.
  const confirm = run(repoRoot, ['--confirm']);
  assert.equal(confirm.code, 0, confirm.stdout);
  assert.ok(existsSync(join(repoRoot, '.agents', 'skills', 'wrap-up', 'SKILL.md')));
  assert.ok(!existsSync(join(repoRoot, '.cursor', 'commands')), 'Cursor would list these next to the skills');
  assert.ok(!existsSync(join(repoRoot, '.claude', 'commands')), 'Cursor would list these next to the skills');
});
