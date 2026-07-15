#!/usr/bin/env node

// Weekly rotation for the sessions log. Entries older than the current
// ISO week move from docs/sessions/LOG.md into docs/sessions/history/,
// one file per week, so the active log never outgrows a sitting.
//
//   node scripts/rotate-sessions.js            rotate (writes files)
//   node scripts/rotate-sessions.js --dry-run  print the plan, write nothing
//
// Week files are named YYYY-Www.md using the ISO WEEK-NUMBERING year,
// which is not always the calendar year: ISO weeks straddle year turns,
// so January 1st can belong to the previous year's week 52 or 53. The
// classic bug is reading the year from the date itself; the correct
// read comes from the week's Thursday (shift the date to Thursday, take
// THAT year). Two published vectors pin it in the tests: 2014-12-29 is
// 2015-W01 and 2012-01-01 is 2011-W52.
//
// Safety posture, copied from the project this grew out of, which
// learned it by almost losing entries:
//
//   - Entry dates come from the entry HEADINGS (## YYYY-MM-DD: Title),
//     never from file times. A heading the parser can't date makes the
//     whole run refuse (exit 1, nothing written) rather than misfile.
//   - The split is fence-aware: a heading-shaped line inside a code
//     block stays part of its entry.
//   - Preamble above the first entry (the title line, any intro prose)
//     is preserved verbatim; rotation never touches it.
//   - Loss check before writing: the multiset of entry fingerprints
//     across (log + every archive) must be identical before and after.
//     Any mismatch aborts with nothing written.
//   - A missing log or history folder is a clean no-op, not a crash:
//     projects that copied the commands in run this before their first
//     entry exists.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

// SESSIONS_ROOT lets the tests point the script at a fixture tree.
const root = process.env.SESSIONS_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const logPath = join(root, 'docs', 'sessions', 'LOG.md');
const historyDir = join(root, 'docs', 'sessions', 'history');
const dryRun = process.argv.includes('--dry-run');

// ISO week of a calendar date, plus the week-numbering year that owns it.
export function isoWeekOf(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  // Shift to this week's Thursday; its year is the week-numbering year.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const weekYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { weekYear, week };
}

export function weekFileName(year, month, day) {
  const { weekYear, week } = isoWeekOf(year, month, day);
  return `${weekYear}-W${String(week).padStart(2, '0')}.md`;
}

// Split the log into preamble + dated entries. Entries open with a
// line like `## 2026-07-15: Title` (any separator after the date).
// Fence-aware: heading-shaped lines inside ``` or ~~~ blocks are body.
export function parseLog(content) {
  const lines = content.split('\n');
  const entries = [];
  const preamble = [];
  let current = null;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence && line.match(/^## (\S+)(\s|$)/);
    if (heading) {
      if (current) entries.push(current);
      // The separator (a colon, usually) rides on the date token; strip
      // trailing punctuation before the date check.
      const token = heading[1].replace(/[.,:;]+$/, '');
      const dateMatch = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      current = { headingDate: dateMatch, lines: [line], raw: heading[1] };
      continue;
    }
    if (current) current.lines.push(line);
    else preamble.push(line);
  }
  if (current) entries.push(current);
  return { preamble, entries };
}

function fingerprint(entry) {
  return createHash('sha256').update(entry.lines.join('\n').trimEnd()).digest('hex');
}

function fingerprintArchiveFile(path) {
  const { entries } = parseLog(readFileSync(path, 'utf8'));
  return entries.map(fingerprint);
}

function allFingerprints(logEntries) {
  const prints = logEntries.map(fingerprint);
  if (existsSync(historyDir)) {
    for (const f of readdirSync(historyDir).filter((n) => n.endsWith('.md')).sort()) {
      prints.push(...fingerprintArchiveFile(join(historyDir, f)));
    }
  }
  return prints.sort();
}

function main() {
  if (!existsSync(logPath)) {
    console.log('[rotate-sessions] no docs/sessions/LOG.md yet; nothing to rotate.');
    return;
  }

  const content = readFileSync(logPath, 'utf8');
  const { preamble, entries } = parseLog(content);

  const undated = entries.filter((e) => !e.headingDate);
  if (undated.length > 0) {
    console.error('[rotate-sessions] REFUSING to rotate: entry heading(s) without a YYYY-MM-DD date:');
    for (const e of undated) console.error(`  ## ${e.raw}`);
    console.error('[rotate-sessions] Fix the heading(s); nothing was written.');
    process.exit(1);
  }

  const now = new Date();
  const currentWeekFile = weekFileName(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());

  const keep = [];
  const moves = new Map(); // week file name -> entries, oldest first
  for (const entry of entries) {
    const [, y, m, d] = entry.headingDate.map(Number);
    const target = weekFileName(y, m, d);
    if (target === currentWeekFile) keep.push(entry);
    else {
      if (!moves.has(target)) moves.set(target, []);
      moves.get(target).push(entry);
    }
  }

  if (moves.size === 0) {
    console.log('[rotate-sessions] nothing to rotate; every entry is in the current week.');
    return;
  }

  if (dryRun) {
    for (const [file, moved] of moves) {
      console.log(`[rotate-sessions] would move ${moved.length} entr${moved.length === 1 ? 'y' : 'ies'} -> docs/sessions/history/${file}`);
    }
    console.log(`[rotate-sessions] would keep ${keep.length} current-week entr${keep.length === 1 ? 'y' : 'ies'} in LOG.md`);
    return;
  }

  const before = allFingerprints(entries);

  // Stage every write in memory first.
  const stagedArchives = new Map();
  for (const [file, moved] of moves) {
    const path = join(historyDir, file);
    const existing = existsSync(path) ? readFileSync(path, 'utf8').trimEnd() + '\n\n' : `# Sessions, ${file.replace('.md', '')}\n\n`;
    stagedArchives.set(path, existing + moved.map((e) => e.lines.join('\n').trimEnd()).join('\n\n') + '\n');
  }
  const preambleText = preamble.join('\n').trimEnd();
  const stagedLog = (preambleText ? preambleText + '\n\n' : '') + keep.map((e) => e.lines.join('\n').trimEnd()).join('\n\n') + (keep.length ? '\n' : '');

  // Loss check: re-parse the staged writes and compare fingerprints.
  const after = [];
  after.push(...parseLog(stagedLog).entries.map(fingerprint));
  for (const text of stagedArchives.values()) {
    after.push(...parseLog(text).entries.map(fingerprint));
  }
  if (existsSync(historyDir)) {
    for (const f of readdirSync(historyDir).filter((n) => n.endsWith('.md')).sort()) {
      const p = join(historyDir, f);
      if (!stagedArchives.has(p)) after.push(...fingerprintArchiveFile(p));
    }
  }
  after.sort();

  if (JSON.stringify(before) !== JSON.stringify(after)) {
    console.error('[rotate-sessions] LOSS CHECK FAILED: staged writes would change the entry set. Nothing was written.');
    process.exit(1);
  }

  mkdirSync(historyDir, { recursive: true });
  for (const [path, text] of stagedArchives) writeFileSync(path, text);
  writeFileSync(logPath, stagedLog);
  for (const [file, moved] of moves) {
    console.log(`[rotate-sessions] moved ${moved.length} entr${moved.length === 1 ? 'y' : 'ies'} -> docs/sessions/history/${file}`);
  }
}

// Run only when invoked directly (node scripts/rotate-sessions.js), never on
// import. import.meta.main is the modern way to say this, but it only exists
// on Node 22.18 and 24.2 or newer; anything older leaves it undefined, which
// would turn the script into a silent no-op. Comparing module URL to argv
// works everywhere. Node resolves "scripts/rotate-sessions" (no extension) to
// this file but leaves argv as typed, so resolve the argv path the same way
// before comparing, or that spelling would silently skip main() too.
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolveArgvPath(process.argv[1])).href;
if (invokedDirectly) main();

function resolveArgvPath(argvPath) {
  for (const candidate of [argvPath, `${argvPath}.js`]) {
    try {
      return realpathSync(candidate);
    } catch {
      // keep trying; fall through to the raw path
    }
  }
  return argvPath;
}
