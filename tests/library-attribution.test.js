import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const motionDir = join(repoRoot, 'docs', 'wiki', 'motion');

// The motion pages adapt MIT-licensed work, and MIT's one condition is
// that the notice travels with the substance. This pin keeps a future
// edit from quietly dropping the legally load-bearing credit.
test('every motion page names its MIT source', () => {
  const pages = readdirSync(motionDir).filter((f) => f.endsWith('.md'));
  assert.ok(pages.length >= 5, 'the motion library has at least five pages');
  for (const page of pages) {
    const text = readFileSync(join(motionDir, page), 'utf8');
    assert.ok(text.includes('MIT'), `${page} must carry the MIT license mention`);
    assert.ok(
      /kowalski/i.test(text) || /meng\s?to/i.test(text),
      `${page} must credit Kowalski or Meng To by name`
    );
  }
});

test('the overview carries the full attribution with both source repos', () => {
  const text = readFileSync(join(motionDir, 'overview.md'), 'utf8');
  assert.ok(text.includes('emilkowalski/skills'), 'overview links the Kowalski repo');
  assert.ok(text.includes('MengTo/Skills'), 'overview links the Meng To repo');
  assert.ok(/copyright emil kowalski/i.test(text), 'overview carries the Kowalski copyright line');
  assert.ok(/copyright meng to/i.test(text), 'overview carries the Meng To copyright line');
});
