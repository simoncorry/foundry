// Shared prose matcher. One home for how Foundry's two gates find listed
// phrases in human-facing text: the advisory draft gate (voice-gate.js)
// and the blocking committed-prose gate (check-jargon.js) both build on
// these helpers, so matching semantics cannot drift between them.
//
// The semantics, in plain terms:
//
//   - Matching is case-insensitive.
//   - A phrase that starts or ends with a letter or digit only matches at
//     word edges: a listed "zorbly flux" is found in "the zorbly flux
//     case" but not inside "mezorbly fluxative". A phrase whose edge is
//     punctuation (the em dash entry, for example) matches as a plain
//     substring, because its neighbours are legitimately letters.
//   - Markdown code is not prose. Fenced blocks and inline `code` spans
//     are skipped. One exception: a document wrapped WHOLE in a single
//     outer ```markdown (or ```md) fence is a copy wrapper, not a code
//     sample, so its contents are unwrapped and scanned normally
//     (handoff blocks travel this way). Fences inside the unwrapped body
//     count as real code again.
//   - Every hit reports its 1-based line number in the ORIGINAL text,
//     so a hit inside an unwrapped handoff still points at the real line.
//
// List loading is strict and throws: an unreadable file, a non-array
// root, or a malformed entry raises an Error naming the problem. Each
// caller decides what failing closed means for its posture (the blocking
// gate exits 1; the advisory gate reports the broken list loudly and
// never prints a clean verdict).

import { readFileSync } from 'node:fs';

// ─── list loading ────────────────────────────────────────────────────────

export function assertValidPhraseList(parsed) {
  if (!Array.isArray(parsed)) {
    throw new Error('phrase list must be a flat array of {"bad", "good"} entries.');
  }
  const malformed = parsed.filter(
    (e) => !e || typeof e !== 'object' || typeof e.bad !== 'string' || typeof e.good !== 'string'
      || e.bad.trim() === '' || e.good.trim() === '' || Object.keys(e).length !== 2
  );
  if (malformed.length > 0) {
    const listing = malformed.map((e) => JSON.stringify(e)).join('\n  ');
    throw new Error(
      `${malformed.length} entr(y/ies) not shaped {"bad": string, "good": string}:\n  ${listing}`
    );
  }
  return parsed;
}

export function loadPhraseList(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`phrase list is unreadable or not valid JSON (${err.message}).`);
  }
  return assertValidPhraseList(parsed);
}

// ─── phrase compilation ──────────────────────────────────────────────────

const RE_SPECIALS = /[.*+?^${}()|[\]\\]/g;
const WORD_EDGE = /^[\p{L}\p{N}]/u;
const WORD_EDGE_END = /[\p{L}\p{N}]$/u;

// Word boundaries only guard edges that are themselves word characters;
// a punctuation-edged phrase keeps substring semantics on that side.
//
// Performance shape: the boundary regexes use Unicode property escapes,
// which are expensive to CONSTRUCT (measured ~0.3ms each; a 140-entry
// list paid ~40ms at startup). So each entry compiles its regex lazily,
// and matching prefilters with a cheap lowercase substring check first:
// the regex only ever confirms or rejects a substring hit, and a
// boundary match is always also a substring match, so semantics are
// unchanged.
export function compilePhrases(list) {
  return list.map(({ bad, good }) => {
    const entry = { bad, good, lowerBad: bad.toLowerCase(), _re: null };
    Object.defineProperty(entry, 're', {
      get() {
        if (!this._re) {
          const escaped = bad.replace(RE_SPECIALS, '\\$&');
          const lead = WORD_EDGE.test(bad) ? '(?<![\\p{L}\\p{N}])' : '';
          const tail = WORD_EDGE_END.test(bad) ? '(?![\\p{L}\\p{N}])' : '';
          this._re = new RegExp(`${lead}${escaped}${tail}`, 'iu');
        }
        return this._re;
      },
    });
    return entry;
  });
}

// ─── markdown region extraction ──────────────────────────────────────────

const FENCE_LINE = /^\s*(`{3,}|~{3,})(.*)$/;
const OUTER_OPEN = /^(`{3,}|~{3,})\s*(markdown|md)\s*$/i;
const OUTER_CLOSE = /^(`{3,}|~{3,})\s*$/;

// A whole-document ```markdown wrapper is a copy wrapper, not code.
// Detection is deliberately narrow: the FIRST non-empty line opens the
// fence with a markdown/md info string, and the LAST non-empty line
// closes it with the same character and at least the same run length.
// Anything less exact stays a normal code fence.
export function unwrapOuterMarkdownFence(text) {
  const lines = text.split('\n');
  let first = 0;
  while (first < lines.length && lines[first].trim() === '') first += 1;
  let last = lines.length - 1;
  while (last >= 0 && lines[last].trim() === '') last -= 1;
  if (first >= last) return { lines, offset: 0, unwrapped: false };
  const open = lines[first].trim().match(OUTER_OPEN);
  const close = lines[last].trim().match(OUTER_CLOSE);
  if (
    open && close
    && close[1][0] === open[1][0]
    && close[1].length >= open[1].length
  ) {
    return { lines: lines.slice(first + 1, last), offset: first + 1, unwrapped: true };
  }
  return { lines, offset: 0, unwrapped: false };
}

// Returns [{ line, text }] for prose lines only, with inline code spans
// blanked (spaces preserve column positions). `line` is 1-based against
// the original text, including any unwrapped outer fence.
export function extractProseLines(text) {
  const { lines, offset } = unwrapOuterMarkdownFence(text);
  const out = [];
  let fence = null;
  lines.forEach((raw, i) => {
    const m = raw.match(FENCE_LINE);
    if (m) {
      if (!fence) {
        fence = { char: m[1][0], len: m[1].length };
      } else if (m[1][0] === fence.char && m[1].length >= fence.len && m[2].trim() === '') {
        fence = null;
      }
      return;
    }
    if (fence) return;
    out.push({
      line: offset + i + 1,
      text: raw.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length)),
    });
  });
  return out;
}

// ─── matching ────────────────────────────────────────────────────────────

// One hit per phrase per line: enough to point at the line, and it keeps
// output stable when a phrase repeats within a line.
export function matchLine(lineText, compiled) {
  const hits = [];
  const lower = lineText.toLowerCase();
  for (const entry of compiled) {
    // Cheap substring prefilter; the boundary regex (lazily compiled)
    // only confirms or rejects these few candidates.
    if (!lower.includes(entry.lowerBad)) continue;
    if (entry.re.test(lineText)) hits.push({ bad: entry.bad, good: entry.good });
  }
  return hits;
}

// Markdown-aware scan: unwrap, strip code, match. Returns
// [{ line, bad, good }] with original 1-based line numbers.
export function scanProse(text, compiled) {
  const hits = [];
  for (const { line, text: prose } of extractProseLines(text)) {
    for (const hit of matchLine(prose, compiled)) {
      hits.push({ line, ...hit });
    }
  }
  return hits;
}
