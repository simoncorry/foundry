import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isoWeekOf, weekFileName, parseLog } from '../scripts/rotate-sessions.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'rotate-sessions.js');

function run(rootOverride, args = []) {
  try {
    const out = execFileSync('node', [script, ...args], {
      env: { ...process.env, SESSIONS_ROOT: rootOverride },
      encoding: 'utf8',
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

function isoDate(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const PREAMBLE = '# Sessions\n\nOne entry per session, newest first.\n';

function makeFixture(logContent) {
  const root = mkdtempSync(join(tmpdir(), 'sessions-fixture-'));
  mkdirSync(join(root, 'docs', 'sessions'), { recursive: true });
  if (logContent !== null) {
    writeFileSync(join(root, 'docs', 'sessions', 'LOG.md'), logContent);
  }
  return root;
}

// The two published year-boundary vectors: the week-numbering year comes
// from the week's Thursday, not the date's own calendar year.
test('week math holds at year boundaries', () => {
  assert.deepEqual(isoWeekOf(2014, 12, 29), { weekYear: 2015, week: 1 });
  assert.deepEqual(isoWeekOf(2012, 1, 1), { weekYear: 2011, week: 52 });
  assert.equal(weekFileName(2014, 12, 29), '2015-W01.md');
  assert.equal(weekFileName(2012, 1, 1), '2011-W52.md');
});

test('entries older than the current week rotate into per-week files', () => {
  const log = `${PREAMBLE}\n## ${isoDate(0)}: Today\n\nCurrent week entry.\n\n## ${isoDate(9)}: Last week\n\nOlder entry one.\n\n## ${isoDate(16)}: Two weeks back\n\nOlder entry two.\n`;
  const root = makeFixture(log);
  const r = run(root);
  const kept = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8');
  const archives = readdirSync(join(root, 'docs', 'sessions', 'history')).sort();
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.equal(archives.length, 2);
  assert.ok(kept.includes('Today'));
  assert.ok(!kept.includes('Last week'));
});

test('a dateless entry heading refuses the whole run with nothing written', () => {
  const log = `${PREAMBLE}\n## someday: No date here\n\nBody.\n\n## ${isoDate(10)}: Dated\n\nBody.\n`;
  const root = makeFixture(log);
  const before = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8');
  const r = run(root);
  const untouched = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8');
  const historyExists = existsSync(join(root, 'docs', 'sessions', 'history'));
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('REFUSING'));
  assert.equal(untouched, before);
  assert.equal(historyExists, false);
});

test('everything in the current week is a no-op', () => {
  const log = `${PREAMBLE}\n## ${isoDate(0)}: Fresh\n\nBody.\n`;
  const root = makeFixture(log);
  const r = run(root);
  const historyExists = existsSync(join(root, 'docs', 'sessions', 'history'));
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('nothing to rotate'));
  assert.equal(historyExists, false);
});

test('a heading-shaped line inside a fence stays part of its entry', () => {
  const log = `${PREAMBLE}\n## ${isoDate(9)}: Has a fence\n\nBody with an example:\n\n\`\`\`\n## 2020-01-01: Not a real entry\n\`\`\`\n\nMore body.\n`;
  const root = makeFixture(log);
  const r = run(root);
  const archives = readdirSync(join(root, 'docs', 'sessions', 'history'));
  const archived = readFileSync(join(root, 'docs', 'sessions', 'history', archives[0]), 'utf8');
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.equal(archives.length, 1, 'one week file, not two');
  assert.ok(archived.includes('Not a real entry'), 'the fenced line traveled inside its entry');
});

test('preamble above the first entry survives rotation verbatim', () => {
  const log = `${PREAMBLE}\n## ${isoDate(9)}: Old\n\nBody.\n`;
  const root = makeFixture(log);
  run(root);
  const kept = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8');
  rmSync(root, { recursive: true, force: true });
  assert.ok(kept.startsWith('# Sessions\n\nOne entry per session, newest first.'));
});

test('a missing log is a clean no-op for copy-install projects', () => {
  const root = makeFixture(null);
  const r = run(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('nothing to rotate'));
});

test('dry-run prints the plan and writes nothing', () => {
  const log = `${PREAMBLE}\n## ${isoDate(9)}: Old\n\nBody.\n`;
  const root = makeFixture(log);
  const r = run(root, ['--dry-run']);
  const historyExists = existsSync(join(root, 'docs', 'sessions', 'history'));
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.ok(r.out.includes('would move'));
  assert.equal(historyExists, false);
});

test('rotation appends to an existing week file without losing its entries', () => {
  const oldDate = isoDate(9);
  const log1 = `${PREAMBLE}\n## ${oldDate}: First old\n\nBody one.\n\n## ${isoDate(0)}: Current\n\nStays.\n`;
  const root = makeFixture(log1);
  run(root);
  // A second rotation with another entry from the same old week.
  const log2 = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8') + `\n## ${oldDate}: Second old\n\nBody two.\n`;
  writeFileSync(join(root, 'docs', 'sessions', 'LOG.md'), log2);
  run(root);
  const archives = readdirSync(join(root, 'docs', 'sessions', 'history'));
  const archived = readFileSync(join(root, 'docs', 'sessions', 'history', archives[0]), 'utf8');
  rmSync(root, { recursive: true, force: true });
  assert.equal(archives.length, 1);
  assert.ok(archived.includes('First old') && archived.includes('Second old'));
});

test('the loss check refuses when an archive would swallow an appended entry', () => {
  // An archive whose last entry carries an unclosed fence makes any
  // appended entry disappear on re-parse (the open fence swallows its
  // heading). The staged-write fingerprint comparison must catch that
  // and refuse, or rotation silently loses the new entry.
  const oldDate = isoDate(9);
  const root = makeFixture(`${PREAMBLE}\n## ${oldDate}: New old entry\n\nBody.\n`);
  mkdirSync(join(root, 'docs', 'sessions', 'history'), { recursive: true });
  const [y, m, d] = oldDate.split('-').map(Number);
  const archive = weekFileName(y, m, d);
  writeFileSync(
    join(root, 'docs', 'sessions', 'history', archive),
    `# Sessions, ${archive.replace('.md', '')}\n\n## ${oldDate}: Archived with open fence\n\n\`\`\`\nnever closed\n`
  );
  const logBefore = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8');
  const r = run(root);
  const logAfter = readFileSync(join(root, 'docs', 'sessions', 'LOG.md'), 'utf8');
  rmSync(root, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.includes('LOSS CHECK FAILED'));
  assert.equal(logAfter, logBefore, 'the log is untouched after a refused rotation');
});

test('parseLog splits entries and keeps preamble separate', () => {
  const { preamble, entries } = parseLog(`Title\n\n## 2026-07-15: A\n\nBody A.\n\n## 2026-07-14: B\n\nBody B.\n`);
  assert.equal(preamble.join('\n').trim(), 'Title');
  assert.equal(entries.length, 2);
  assert.ok(entries[0].headingDate && entries[1].headingDate);
});
