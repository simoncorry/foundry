#!/usr/bin/env node

// Wiki pointer check, for projects that consume Foundry's wiki.
//
// A consumer project's own docs can point at pages in a local Foundry
// checkout (for example `~/Sites/foundry/docs/wiki/engineering/overview.md`).
// Those pointers rot silently when a wiki page moves or is renamed, because
// nothing in the consumer's repo notices. This check re-verifies every
// pointer on each run, from inside the consumer's own check chain.
//
// What it does:
//   1. Walks the surfaces the consumer names and collects every token that
//      starts with the checkout path (tilde form or absolute).
//   2. Resolves each token against the local checkout and fails on a missing
//      target. Resolution is contained: a token that escapes the checkout
//      after resolving fails rather than probing elsewhere on disk.
//   3. Asserts each pointer-carrying file also mentions the raw-URL fallback
//      (so machines without the checkout keep a working route to the pages).
//
// When the checkout is absent the check prints a note and exits 0. The rot
// this guards against happens on the machine that edits the pointers, and
// that machine has the checkout; runners without one can't check anything.
//
// Usage (all three arguments required):
//   node check-wiki-pointers.js \
//     --checkout ~/Sites/foundry \
//     --raw-host raw.githubusercontent.com/OWNER/REPO \
//     --surfaces '.cursor/skills:SKILL.md,.cursor/rules:.mdc,AGENTS.md'
//
// Surfaces format, comma-separated:
//   path/to/file.md      a single file
//   some/dir:NAME.md     every file named NAME.md under the directory
//   some/dir:.ext        every file ending .ext under the directory
// Directory entries are walked recursively.
//
// Optional: --root <dir> sets the consumer root to scan (default: the
// working directory the check is invoked from).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';

function fail(message) {
  console.error(`[wiki-pointers] ${message}`);
  process.exit(1);
}

function expandTilde(p) {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return join(homedir(), p.slice(2));
  return p;
}

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!['--checkout', '--raw-host', '--surfaces', '--root'].includes(flag)) {
      fail(`unknown argument ${flag}; expected --checkout, --raw-host, --surfaces, and optionally --root`);
    }
    const value = argv[i + 1];
    if (value === undefined) fail(`${flag} needs a value`);
    args[flag.slice(2).replace('-host', 'Host')] = value;
    i++;
  }
  for (const required of ['checkout', 'rawHost', 'surfaces']) {
    if (!args[required]) fail(`missing --${required === 'rawHost' ? 'raw-host' : required}; this check refuses to guess a consumer's layout`);
  }
  return args;
}

// Recursive walk keeping only files that match the filter: an exact name
// (SKILL.md) or a suffix when the filter starts with a dot (.mdc).
function walkDir(dir, filter, found) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(p, filter, found);
    } else if (filter.startsWith('.') ? entry.name.endsWith(filter) : entry.name === filter) {
      found.push(p);
    }
  }
}

function collectSurfaces(root, surfacesSpec) {
  const surfaces = [];
  for (const rawEntry of surfacesSpec.split(',')) {
    const entry = rawEntry.trim();
    if (!entry) continue;
    const colon = entry.lastIndexOf(':');
    if (colon === -1) {
      const p = join(root, entry);
      if (existsSync(p) && statSync(p).isFile()) surfaces.push(p);
      continue;
    }
    const dir = join(root, entry.slice(0, colon));
    const filter = entry.slice(colon + 1);
    if (!existsSync(dir)) continue;
    walkDir(dir, filter, surfaces);
  }
  return surfaces;
}

const args = parseArgs(process.argv.slice(2));
const CHECKOUT = resolve(expandTilde(args.checkout));
const ROOT = resolve(expandTilde(args.root));

console.log('Wiki pointer check');
console.log('==================');

if (!existsSync(CHECKOUT)) {
  console.log(`Checkout not found at ${CHECKOUT}; skipping (expected on machines without one — the machine that edits pointers has the checkout).`);
  process.exit(0);
}

// Pointers appear in prose in two spellings: the tilde form the consumer
// writes (`~/Sites/foundry/...`) and, rarely, the absolute form. Both are
// matched. Everything up to whitespace, a backtick, or a closing paren is
// the token; trailing sentence punctuation is stripped afterward so a bare
// mention at the end of a sentence doesn't false-fail.
const home = homedir();
const tildePrefix = CHECKOUT.startsWith(home + sep) ? '~' + CHECKOUT.slice(home.length) : null;
const prefixes = [CHECKOUT + '/', ...(tildePrefix ? [tildePrefix + '/'] : [])];
const TOKEN_RE = new RegExp(
  `(?:${prefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[^\\s\`)]+`,
  'g'
);

let failures = 0;
let pointers = 0;
let carriers = 0;

for (const surface of collectSurfaces(ROOT, args.surfaces)) {
  const content = readFileSync(surface, 'utf8');
  const tokens = content.match(TOKEN_RE) || [];
  if (tokens.length === 0) continue;
  carriers++;
  const shortName = surface.startsWith(ROOT + sep) ? surface.slice(ROOT.length + 1) : surface;

  for (const raw of tokens) {
    const token = raw.replace(/[.,;:]+$/, '');
    pointers++;
    const target = resolve(expandTilde(token));
    if (target !== CHECKOUT && !target.startsWith(CHECKOUT + sep)) {
      console.error(`  [FAIL] ${shortName}: ${token} escapes the checkout after resolving; pointers must stay under it`);
      failures++;
      continue;
    }
    if (!existsSync(target)) {
      console.error(`  [FAIL] ${shortName}: ${token} does not resolve (renamed or deleted upstream?)`);
      failures++;
    }
  }

  if (!content.includes(args.rawHost)) {
    console.error(`  [FAIL] ${shortName}: carries checkout pointers but no raw-URL fallback note (${args.rawHost}); machines without the checkout lose their route`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} pointer failure(s). Fix the pointer or the fallback note; the wiki page may have moved upstream.`);
  process.exit(1);
}
console.log(`All ${pointers} pointers across ${carriers} file(s) resolve; every carrier has its raw-URL fallback note.`);
process.exit(0);
