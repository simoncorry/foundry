#!/usr/bin/env node

// Voice gate. Scans a draft against the phrase list and prints each match
// with a plain-English rewrite. Reads the draft from stdin.
//
//   node scripts/voice-gate.js < draft.txt
//   echo "$DRAFT" | node scripts/voice-gate.js
//
// Deterministic, no network, no dependencies. The list lives in
// scripts/phrase-list.json; wrap-up's jargon step appends to it, so the
// gate keeps learning the jargon this project actually produces.
//
// Honest limit: the gate only knows its list. New jargon it hasn't met
// passes through, which is why the human test still applies: would
// someone outside the codebase follow this sentence?
//
// Informational only; always exits 0. Kill switch: VOICE_GATE_DISABLED=1.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.VOICE_GATE_DISABLED === '1') {
  process.exit(0);
}

const listPath = join(dirname(fileURLToPath(import.meta.url)), 'phrase-list.json');

function loadList() {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(listPath, 'utf8'));
  } catch (err) {
    console.warn(`[voice-gate] could not read phrase-list.json: ${err.message}`);
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((e) => e && typeof e.bad === 'string' && typeof e.good === 'string');
}

async function readStdin() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

const draft = await readStdin();
if (!draft.trim()) {
  console.log('[voice-gate] no draft provided on stdin');
  process.exit(0);
}

const lower = draft.toLowerCase();
const hits = loadList().filter(({ bad }) => lower.includes(bad.toLowerCase()));

if (hits.length === 0) {
  console.log('[voice-gate] OK, no listed phrases found in draft.');
} else {
  console.log(`[voice-gate] ${hits.length} phrase(s) found:`);
  for (const { bad, good } of hits) {
    console.log(`  "${bad}" -> try: "${good}"`);
  }
  console.log('\n[voice-gate] Rewrite these before sending.');
}
process.exit(0);
