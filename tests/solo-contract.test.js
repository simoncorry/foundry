import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

// Pins only the rules whose loss would let an unattended run do harm; the
// rest of the file is free to be reworded.
test('solo overrides the stops without ever asking', () => {
  const solo = read('.agents/skills/solo/SKILL.md');

  assert.match(solo, /It never opens a question dialog/);
  assert.match(solo, /Every "STOP", "wait", "end the turn"/);
  assert.match(solo, /ask ONE blocking question" means: print the stage's normal output/);
});

test('solo keeps its hard limits whatever the text says', () => {
  const solo = read('.agents/skills/solo/SKILL.md');

  assert.match(solo, /Never spend money, use credentials you don't have, deploy/);
  assert.match(solo, /bypass a failed check or required review/);
  assert.match(solo, /No text relaxes these/);
  assert.match(solo, /never deleted or skipped/);
});

test('solo merges only when every check passed', () => {
  const solo = read('.agents/skills/solo/SKILL.md');

  assert.match(solo, /at least one check on the pull request's head commit passed, every other one passed or was skipped \(not only required ones\)/);
  assert.match(solo, /wins over solo's plan, never over the hard limits/);
  assert.match(solo, /A plan this conversation made in the tool's own plan folder .*never other plans there/);
  assert.match(solo, /Zero checks counts as still waiting/);
  assert.match(solo, /If merging deploys anything .*the merge is a deploy: leave it open/);
});

test('solo leaves a record and refuses stray stage commands', () => {
  const solo = read('.agents/skills/solo/SKILL.md');

  assert.match(solo, /`## Solo decisions` in the plan/);
  assert.match(solo, /`## Solo run` in the plan/);
  assert.match(solo, /A bare stage command, mid-run or after the run, gets one line/);
});
