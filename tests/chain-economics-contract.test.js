import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const commandsDir = join(repoRoot, '.cursor', 'commands');

function command(name) {
  return readFileSync(join(commandsDir, `${name}.md`), 'utf8');
}

function commandsWithLiveGate(overrides = {}) {
  return readdirSync(commandsDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => {
      const name = file.replace(/\.md$/, '');
      const body = overrides[name] ?? readFileSync(join(commandsDir, file), 'utf8');
      return body.includes('voice-gate.js');
    })
    .map((file) => file.replace(/\.md$/, ''))
    .sort();
}

function hasFreshnessPolicy(text) {
  const lower = text.toLowerCase();
  const priorRoundChanges = /changed (?:during|in) (?:the )?(?:prior|preceding|round \d)/.test(lower);
  const newAngleNeeds = /(?:angle.*(?:newly )?requires|new angle.*requires)/.test(lower);
  const compacted = /compact|summari[sz]/.test(lower);
  const changedAfterRead = /changed (?:since|after) inspection/.test(lower);
  const unseenContext = /no earlier round inspected|unseen (?:surrounding )?context|context .*not.*(?:seen|inspected)/.test(lower);
  const fullRead = /full surrounding context|fully read|re-?read the whole|full read/.test(lower);
  return priorRoundChanges && newAngleNeeds && compacted && changedAfterRead && unseenContext && fullRead;
}

function hasValidationDiscovery(text) {
  const lower = text.toLowerCase();
  const rules = lower.indexOf('explicit project rules');
  const ci = lower.indexOf('ci', rules + 1);
  const scripts = lower.indexOf('package scripts', ci + 1);
  return (
    rules >= 0 &&
    ci > rules &&
    scripts > ci &&
    /ordered (?:check )?set|ordered set/.test(lower) &&
    /broadest existing suite/.test(lower) &&
    /missing project-level check/.test(lower)
  );
}

function hasUniversalGreenRerun(text) {
  return /(?:suite|complete check).{0,40}(?:reaches|is) green.{0,100}(?:run|execute).{0,30}(?:again|once more)/is.test(text);
}

test('only the five prose-heavy stages require an explicit live voice gate', () => {
  const expected = ['construct-the-plan', 'frame-it', 'handoff', 'quiz', 'wrap-up'];
  assert.deepEqual(commandsWithLiveGate(), expected);

  const agreement = readFileSync(join(repoRoot, 'AGENTS.md'), 'utf8');
  assert.match(agreement, /suspects? the draft is dense or awkward/i);

  const universalMutation = command('build-it') + '\nRun `node scripts/voice-gate.js` before every reply.\n';
  assert.notDeepEqual(commandsWithLiveGate({ 'build-it': universalMutation }), expected);
});

test('middle review rounds use freshness escapes while rounds 1 and 5 require full reads', () => {
  for (const round of [2, 3, 4]) {
    assert.equal(hasFreshnessPolicy(command(`challenge-implementation-${round}`)), true, `round ${round}`);
  }
  for (const round of [1, 5]) {
    assert.match(command(`challenge-implementation-${round}`), /re-read every file|re-read each modified file/i);
    assert.match(command(`challenge-implementation-${round}`), /full surrounding context/i);
  }

  const reworded = [
    'Fully read files changed in the preceding round and anything the new angle requires.',
    'Re-read the whole file if the chat was summarized, if it changed after inspection,',
    'or if the angle needs unseen context.',
  ].join(' ');
  assert.equal(hasFreshnessPolicy(reworded), true);
  assert.equal(hasFreshnessPolicy(reworded.replace('if the chat was summarized, ', '')), false);
});

test('test-it and wrap-up share the validation ladder without a universal green rerun', () => {
  const testIt = command('test-it');
  const wrapUp = command('wrap-up');

  assert.equal(hasValidationDiscovery(testIt), true);
  assert.equal(hasValidationDiscovery(wrapUp), true);
  assert.match(testIt, /targeted checks remain unlimited/i);
  assert.match(testIt, /time, randomness, concurrency, or an outside process/i);
  assert.match(testIt, /run that complete check or set once/i);
  assert.match(wrapUp, /once after the cumulative review/i);
  assert.match(testIt, /red result.*substantive change/is);
  assert.match(wrapUp, /red result.*substantive change/is);
  assert.equal(hasUniversalGreenRerun(testIt), false);
  assert.equal(hasUniversalGreenRerun(wrapUp), false);

  const reworded = [
    'Choose the full verification path from explicit project rules, then CI as an ordered set,',
    'then package scripts. If none exists, use the broadest existing suite and report the',
    'missing project-level check.',
  ].join(' ');
  assert.equal(hasValidationDiscovery(reworded), true);
  assert.equal(hasUniversalGreenRerun('When the complete check is green, run it once more.'), true);
});
