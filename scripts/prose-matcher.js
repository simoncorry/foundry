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
//     are skipped. One exception: a ```markdown (or ```md) fence is a
//     copy wrapper, not a code sample, so its contents are scanned as
//     prose wherever the fence appears (a handoff block travels this way,
//     usually behind a lead-in sentence). Fences INSIDE a wrapper count
//     as real code again; nesting is by fence length, the CommonMark
//     rule, so a wrapper must use more backticks than any inner fence
//     (handoffs use four). To skip a genuine markdown SAMPLE, fence it as
//     plain code (bare ``` or a non-markdown language), not ```markdown.
//   - Every hit reports its 1-based line number in the ORIGINAL text.
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
const WRAPPER_INFO = /^(markdown|md)$/i;

// Returns [{ line, text }] for prose lines only, with inline code spans
// blanked (spaces preserve column positions). `line` is 1-based against
// the original text.
//
// One pass with a fence stack, following CommonMark's length nesting. A
// fenced block opened with a markdown/md info string is a "wrapper"
// (scan its contents as prose); any other info string, or none, is
// "code" (skip its contents). A block closes on a bare fence line of the
// same character and at least the opener's run length. Inside a code
// block only a close counts; a fence line inside a wrapper opens a
// nested block. So a wrapper's prose is scanned wherever the wrapper
// sits, and a real code fence inside it is still skipped.
export function extractProseLines(text) {
  const out = [];
  const stack = [];
  text.split('\n').forEach((raw, i) => {
    const m = raw.match(FENCE_LINE);
    if (m) {
      const run = m[1];
      const info = m[2].trim();
      const top = stack[stack.length - 1];
      if (top && info === '' && run[0] === top.char && run.length >= top.len) {
        stack.pop();
        return;
      }
      if (top && top.kind === 'code') return; // fence-shaped code content
      stack.push({ char: run[0], len: run.length, kind: WRAPPER_INFO.test(info) ? 'wrapper' : 'code' });
      return;
    }
    const top = stack[stack.length - 1];
    if (!top || top.kind === 'wrapper') {
      out.push({ line: i + 1, text: raw.replace(/`[^`]*`/g, (s) => ' '.repeat(s.length)) });
    }
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
