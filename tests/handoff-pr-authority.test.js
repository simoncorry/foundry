import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

test('handoff explicitly authorizes resolving its own pull requests', () => {
  const command = read('.cursor/commands/handoff.md');
  const agreement = read('AGENTS.md');
  const readme = read('README.md');

  assert.match(command, /Invoking handoff is explicit permission to resolve pull requests created by the work being handed off/);
  assert.match(command, /merge it using the repository's merge policy/);
  assert.match(command, /close it without merging/);
  assert.match(command, /Never bypass a failed check or required review/);
  assert.match(command, /It does not cover unrelated pull requests/);
  assert.doesNotMatch(command, /## Read-only/);

  assert.match(agreement, /Invoking handoff is explicit, narrow permission to resolve pull requests/);
  assert.match(readme, /authorizes the agent to merge a ready pull request/);
});
