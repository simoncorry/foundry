// What the installer may overwrite in a project: only unedited copies of
// something Foundry shipped. Everything the project wrote or edited stays,
// AGENTS.md shares a marked section, and the phrase list merges.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDRY_SECTION } from '../scripts/check-context-budgets.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const installer = join(repoRoot, 'scripts', 'install.js');
const foundryAgents = readFileSync(join(repoRoot, 'AGENTS.md'), 'utf8');
const rendered = `${FOUNDRY_SECTION.start}\n${foundryAgents}${FOUNDRY_SECTION.end}\n`;
const foundryPhrases = JSON.parse(readFileSync(join(repoRoot, 'scripts', 'phrase-list.json'), 'utf8'));

function run(args, script = installer) {
  try {
    return { code: 0, out: execFileSync('node', [script, ...args], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

function project(prefix) {
  return mkdtempSync(join(tmpdir(), `install-own-${prefix}-`));
}

function put(root, rel, content) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
}

const read = (root, rel) => readFileSync(join(root, rel), 'utf8');

// The first version of a file Foundry ever committed: an untouched copy an
// older install would have left behind.
function oldestVersion(rel) {
  const first = execFileSync('git', ['-C', repoRoot, 'log', '--format=%H', '--reverse', '--', rel], { encoding: 'utf8' })
    .trim().split('\n')[0];
  return execFileSync('git', ['-C', repoRoot, 'show', `${first}:${rel}`]);
}

test('an untouched older install is updated and nothing is kept', () => {
  const target = project('older');
  assert.equal(run([target]).code, 0);
  const olds = ['AGENTS.md', '.agents/skills/build-it/SKILL.md', '.claude/skills/build-it/SKILL.md', 'scripts/phrase-list.json'];
  for (const rel of olds) put(target, rel, oldestVersion(rel));
  const r = run([target]);
  assert.equal(r.code, 0, r.out);
  for (const rel of olds) assert.ok(r.out.includes(`  update ${rel}\n`), `${rel}: ${r.out}`);
  assert.ok(r.out.includes('4 updated, 0 merged, 0 kept'), r.out);
  assert.equal(read(target, 'AGENTS.md'), rendered, 'an old unmarked copy becomes the marked section');
  assert.equal(read(target, 'scripts/phrase-list.json'), read(repoRoot, 'scripts/phrase-list.json'), 'an old list is replaced, not merged');
  rmSync(target, { recursive: true, force: true });
});

test('a second run over a fresh install changes nothing', () => {
  const target = project('twice');
  run([target]);
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('0 created, 0 updated, 0 merged, 0 kept, 0 removed'), r.out);
  rmSync(target, { recursive: true, force: true });
});

test("a project's own skill named like a Foundry command is kept in both tool folders and left out of the budget", () => {
  const target = project('skill');
  const own = 'Our own solo skill.\n';
  put(target, '.agents/skills/solo/SKILL.md', own);
  for (let pass = 0; pass < 2; pass += 1) {
    const r = run([target]);
    assert.equal(r.code, 0, r.out);
    assert.ok(r.out.includes("keep skill solo: the project's copy differs from every version Foundry shipped"), r.out);
    assert.ok(r.out.includes('1 kept'), r.out);
  }
  assert.equal(read(target, '.agents/skills/solo/SKILL.md'), own);
  assert.ok(!existsSync(join(target, '.agents/skills/solo/agents')), "Foundry's solo policy file is not installed either");
  assert.ok(!existsSync(join(target, '.claude/skills/solo')), "Claude Code doesn't get Foundry's solo either");
  const names = JSON.parse(read(target, 'scripts/foundry-commands.json'));
  assert.equal(names.length, 19);
  assert.ok(!names.includes('solo'));
  const budget = execFileSync('node', [join(target, 'scripts', 'check-context-budgets.js')], { encoding: 'utf8' });
  assert.ok(budget.includes('across 19 files'), budget);
  rmSync(target, { recursive: true, force: true });
});

test("a project's own AGENTS.md keeps its lines above and below Foundry's section through refreshes", () => {
  const target = project('agents');
  const own = '# Our rules\n\nUse tabs.\n';
  put(target, 'AGENTS.md', own);
  const first = run([target]);
  assert.ok(first.out.includes("  merge AGENTS.md (Foundry's section added below your rules)\n"), first.out);
  assert.equal(read(target, 'AGENTS.md'), `${own}\n${rendered}`);

  const second = run([target]);
  assert.ok(!/ (create|update|merge) AGENTS\.md/.test(second.out), second.out);
  assert.ok(second.out.includes('0 merged, 0 kept'), second.out);

  // An older Foundry section, with a closing rule the project wrote after it.
  const older = oldestVersion('AGENTS.md').toString('utf8');
  put(target, 'AGENTS.md', `${own}\n${FOUNDRY_SECTION.start}\n${older}${FOUNDRY_SECTION.end}\n\nOur closing rule.\n`);
  const third = run([target]);
  assert.ok(third.out.includes('  update AGENTS.md\n'), third.out);
  assert.equal(read(target, 'AGENTS.md'), `${own}\n${rendered}\nOur closing rule.\n`);
  rmSync(target, { recursive: true, force: true });
});

test('an edited, unmarked older Foundry AGENTS.md is kept byte for byte until --overwrite', () => {
  const target = project('edited-old');
  const edited = `${foundryAgents}\nOur local rule.\n`;
  put(target, 'AGENTS.md', edited);
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('keep AGENTS.md: an older Foundry copy with edits'), r.out);
  assert.ok(r.out.includes('1 kept'), r.out);
  assert.equal(read(target, 'AGENTS.md'), edited);
  assert.equal(run([target, '--overwrite']).code, 0);
  assert.equal(read(target, 'AGENTS.md'), rendered);
  rmSync(target, { recursive: true, force: true });
});

test("a line written inside Foundry's section survives a re-run with a note, and --overwrite refreshes it", () => {
  const target = project('inside');
  run([target]);
  const edited = rendered.replace(`${FOUNDRY_SECTION.start}\n`, `${FOUNDRY_SECTION.start}\nOur rule, put in the wrong place.\n`);
  put(target, 'AGENTS.md', edited);
  const r = run([target]);
  assert.ok(r.out.includes("keep AGENTS.md: lines inside Foundry's section were edited"), r.out);
  assert.equal(read(target, 'AGENTS.md'), edited);
  run([target, '--overwrite']);
  assert.equal(read(target, 'AGENTS.md'), rendered);
  rmSync(target, { recursive: true, force: true });
});

test('damaged section markers stop the run before anything is written', () => {
  const cases = {
    'a start line alone': `Ours.\n${FOUNDRY_SECTION.start}\nFoundry text\n`,
    'two pairs': `${rendered}${rendered}`,
    'end before start': `${FOUNDRY_SECTION.end}\nFoundry text\n${FOUNDRY_SECTION.start}\n`,
  };
  for (const [name, text] of Object.entries(cases)) {
    const target = project('damaged');
    put(target, 'AGENTS.md', text);
    const r = run([target]);
    assert.equal(r.code, 1, name);
    assert.ok(r.out.includes("refused: AGENTS.md has"), `${name}: ${r.out}`);
    assert.ok(r.out.includes('nothing written'), name);
    assert.deepEqual(readdirSync(target), ['AGENTS.md'], `${name}: nothing else may be created`);
    assert.equal(read(target, 'AGENTS.md'), text, name);
    rmSync(target, { recursive: true, force: true });
  }
});

test('a marker mentioned in prose, or ending in a carriage return, is read correctly', () => {
  const target = project('marker-shape');
  const own = `We keep Foundry's rules after the line ${FOUNDRY_SECTION.start} below.\r\n`;
  put(target, 'AGENTS.md', own);
  assert.equal(run([target]).code, 0, 'a mention inside a sentence is not a marker');
  const merged = read(target, 'AGENTS.md');
  assert.ok(merged.startsWith(own));
  put(target, 'AGENTS.md', merged.replace(`${FOUNDRY_SECTION.end}\n`, `${FOUNDRY_SECTION.end}\r\n`));
  const r = run([target]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes('0 merged, 0 kept'), 'an end line with a carriage return still counts');
  rmSync(target, { recursive: true, force: true });
});

test("a grown phrase list keeps the project's entries and gains Foundry's new ones", () => {
  const target = project('phrases');
  run([target]);
  const ours = { bad: 'zorbly flux', good: 'plain thing' };
  const grown = [...foundryPhrases.slice(0, -2), ours];
  put(target, 'scripts/phrase-list.json', `${JSON.stringify(grown, null, 2)}\n`);
  const r = run([target]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes('  merge scripts/phrase-list.json (2 new phrases; run node scripts/check-jargon.js)\n'), r.out);
  const merged = JSON.parse(read(target, 'scripts/phrase-list.json'));
  assert.deepEqual(merged, [...grown, ...foundryPhrases.slice(-2)]);

  // Every Foundry entry already there (one in different case): nothing to add,
  // so the project's own formatting is left exactly as it was.
  const complete = [...foundryPhrases.map((e, i) => (i === 0 ? { ...e, bad: e.bad.toUpperCase() } : e)), ours];
  const text = `${JSON.stringify(complete, null, 4)}\n`;
  put(target, 'scripts/phrase-list.json', text);
  const again = run([target]);
  assert.ok(again.out.includes('0 merged'), again.out);
  assert.equal(read(target, 'scripts/phrase-list.json'), text);
  rmSync(target, { recursive: true, force: true });
});

test('a damaged phrase list stops the run, and --overwrite replaces it', () => {
  for (const bad of ['[{"bad": "only half"}]\n', '{ not json\n']) {
    const target = project('bad-phrases');
    put(target, 'scripts/phrase-list.json', bad);
    const r = run([target]);
    assert.equal(r.code, 1, r.out);
    assert.ok(r.out.includes("refused: scripts/phrase-list.json in the project isn't a valid phrase list"), r.out);
    assert.ok(r.out.includes('nothing written'));
    assert.deepEqual(readdirSync(target), ['scripts']);
    assert.equal(read(target, 'scripts/phrase-list.json'), bad);
    assert.equal(run([target, '--overwrite']).code, 0);
    assert.equal(read(target, 'scripts/phrase-list.json'), read(repoRoot, 'scripts/phrase-list.json'));
    rmSync(target, { recursive: true, force: true });
  }
});

test("the project's own script is kept, a dry run says so and writes nothing, and --overwrite replaces it", () => {
  const target = project('script');
  put(target, 'scripts/check-links.js', '// our own link checker\n');
  const dry = run([target, '--dry-run']);
  assert.ok(dry.out.includes('would keep scripts/check-links.js: yours, and it differs from every version Foundry shipped'), dry.out);
  assert.ok(dry.out.includes('nothing written'));
  assert.deepEqual(readdirSync(target), ['scripts']);
  assert.deepEqual(readdirSync(join(target, 'scripts')), ['check-links.js']);

  const real = run([target]);
  assert.ok(real.out.includes('  keep scripts/check-links.js: yours'), real.out);
  assert.equal(read(target, 'scripts/check-links.js'), '// our own link checker\n');

  assert.equal(run([target, '--overwrite']).code, 0);
  assert.equal(read(target, 'scripts/check-links.js'), read(repoRoot, 'scripts/check-links.js'));
  rmSync(target, { recursive: true, force: true });
});

test('--overwrite also installs Foundry\'s skill over a same-named project skill', () => {
  const target = project('overwrite-skill');
  put(target, '.agents/skills/solo/SKILL.md', 'Our own solo skill.\n');
  const r = run([target, '--overwrite']);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('0 kept'), r.out);
  assert.equal(read(target, '.agents/skills/solo/SKILL.md'), read(repoRoot, '.agents/skills/solo/SKILL.md'));
  assert.ok(existsSync(join(target, '.claude/skills/solo/SKILL.md')));
  assert.equal(read(target, 'scripts/foundry-commands.json'), read(repoRoot, 'scripts/foundry-commands.json'));
  rmSync(target, { recursive: true, force: true });
});

test("a project AGENTS.md big enough for Codex to cut off gets a note", () => {
  const target = project('codex');
  put(target, 'AGENTS.md', `${'Our very long rule.\n'.repeat(1400)}`);
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('Codex reads only the first 32768 by default'), r.out);
  rmSync(target, { recursive: true, force: true });
});

test("new Foundry wiki pages a project's own index doesn't list are named in a note", () => {
  const target = project('wiki');
  run([target, '--wiki']);
  const index = read(target, 'docs/wiki/INDEX.md');
  const page = 'engineering/unattended-runs.md';
  put(target, 'docs/wiki/INDEX.md', `${index.split('\n').filter((line) => !line.includes(page)).join('\n')}\n- [Ours](ours.md): our own page.\n`);
  unlinkSync(join(target, 'docs/wiki', page));
  const r = run([target, '--wiki']);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes(`  create docs/wiki/${page}\n`), r.out);
  assert.ok(r.out.includes('keep docs/wiki/INDEX.md: yours'), r.out);
  assert.ok(r.out.includes(`these new Foundry pages aren't listed in it yet: ${page}.`), r.out);
  rmSync(target, { recursive: true, force: true });
});

test('a Foundry checkout without git history keeps older copies and says why', () => {
  const base = mkdtempSync(join(tmpdir(), 'install-nohistory-'));
  const copy = join(base, 'foundry');
  for (const item of ['.agents', '.claude/skills', 'AGENTS.md', 'CLAUDE.md', 'scripts']) {
    cpSync(join(repoRoot, item), join(copy, item), { recursive: true });
  }
  const target = join(base, 'project');
  mkdirSync(target);
  put(target, '.agents/skills/build-it/SKILL.md', oldestVersion('.agents/skills/build-it/SKILL.md'));
  const r = run([target], join(copy, 'scripts', 'install.js'));
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes('keep skill build-it'), r.out);
  assert.ok(r.out.includes('this Foundry checkout has no git history'), r.out);
  rmSync(base, { recursive: true, force: true });
});

test('a shallow Foundry clone keeps older copies and points at unshallowing', () => {
  const base = mkdtempSync(join(tmpdir(), 'install-shallow-'));
  const clone = join(base, 'foundry');
  execFileSync('git', ['clone', '-q', '--depth', '1', `file://${repoRoot}`, clone]);
  // Run the working copy's installer and files, not only what's committed.
  for (const item of ['.agents', '.claude/skills', 'AGENTS.md', 'scripts']) {
    cpSync(join(repoRoot, item), join(clone, item), { recursive: true });
  }
  const target = join(base, 'project');
  mkdirSync(target);
  put(target, '.agents/skills/build-it/SKILL.md', oldestVersion('.agents/skills/build-it/SKILL.md'));
  const r = run([target], join(clone, 'scripts', 'install.js'));
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes('keep skill build-it'), r.out);
  assert.ok(r.out.includes('a shallow clone'), r.out);
  assert.ok(r.out.includes('git fetch --unshallow'), r.out);
  rmSync(base, { recursive: true, force: true });
});

test('a CommonJS project is told the scripts will not load', () => {
  const target = project('cjs');
  put(target, 'package.json', '{ "type": "commonjs" }\n');
  const r = run([target]);
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('package.json sets "type": "commonjs"'), r.out);
  rmSync(target, { recursive: true, force: true });
});
