#!/usr/bin/env node

// Voice gate. Scans a draft against the phrase list and prints each match
// with a plain-English rewrite and its line number. Reads the draft from
// stdin.
//
//   node scripts/voice-gate.js < draft.txt
//   echo "$DRAFT" | node scripts/voice-gate.js
//
// Deterministic, no network, no dependencies. Matching lives in
// scripts/prose-matcher.js, shared with the blocking gate, so the two
// can't drift: case-insensitive, word-boundary aware, markdown code
// skipped, and a whole-draft ```markdown copy wrapper (a handoff block)
// still scanned as prose.
//
// Honest limit: the gate only knows its list. New jargon it hasn't met
// passes through, which is why the human test still applies: would
// someone outside the codebase follow this sentence?
//
// Advisory only; always exits 0. A broken phrase list is reported loudly
// and the gate refuses to claim the draft is clean, but it still exits 0:
// blocking is the committed-prose gate's job, not the draft nudge's.
// Kill switch: VOICE_GATE_DISABLED=1.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPhraseList, compilePhrases, scanProse } from './prose-matcher.js';

if (process.env.VOICE_GATE_DISABLED === '1') {
  process.exit(0);
}

const listPath = join(dirname(fileURLToPath(import.meta.url)), 'phrase-list.json');

async function readStdin() {
  let draft = '';
  for await (const chunk of process.stdin) draft += chunk;
  return draft;
}

const draft = await readStdin();
if (!draft.trim()) {
  console.log('[voice-gate] no draft provided on stdin');
  process.exit(0);
}

let compiled;
try {
  compiled = compilePhrases(loadPhraseList(listPath));
} catch (err) {
  console.warn(`[voice-gate] BROKEN LIST: ${err.message}`);
  console.warn('[voice-gate] The draft was NOT checked. Fix scripts/phrase-list.json.');
  process.exit(0);
}

const hits = scanProse(draft, compiled);

if (hits.length === 0) {
  console.log('[voice-gate] OK, no listed phrases found in draft.');
} else {
  console.log(`[voice-gate] ${hits.length} phrase(s) found:`);
  for (const { line, bad, good } of hits) {
    console.log(`  line ${line}: "${bad}" -> try: "${good}"`);
  }
  console.log('\n[voice-gate] Rewrite these before sending.');
}
process.exit(0);
