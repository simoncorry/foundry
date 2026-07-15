import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// Every wiki page must be DIRECTLY listed in INDEX.md. The index is the
// map; a page reachable only through another page is a page nobody
// finds. Anchors are stripped before resolving. check-links already
// guards the other direction (a listed page that doesn't exist).
function findOrphans(wikiDir) {
  const indexPath = join(wikiDir, 'INDEX.md');
  const linked = new Set();
  for (const m of readFileSync(indexPath, 'utf8').matchAll(/\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g)) {
    linked.add(join(wikiDir, m[1]));
  }
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md') && full !== indexPath) pages.push(full);
    }
  };
  walk(wikiDir);
  return pages.filter((p) => !linked.has(p)).map((p) => relative(wikiDir, p));
}

test('every page in the real wiki is listed in its index', () => {
  const wikiDir = join(repoRoot, 'docs', 'wiki');
  assert.ok(existsSync(join(wikiDir, 'INDEX.md')), 'docs/wiki/INDEX.md must exist');
  assert.deepEqual(findOrphans(wikiDir), []);
});

test('an unlisted page is caught as an orphan', () => {
  const root = mkdtempSync(join(tmpdir(), 'wiki-fixture-'));
  mkdirSync(join(root, 'topic'), { recursive: true });
  writeFileSync(join(root, 'INDEX.md'), '# Map\n\n- [Listed](topic/listed.md): a page.\n');
  writeFileSync(join(root, 'topic', 'listed.md'), '# Listed\n');
  writeFileSync(join(root, 'topic', 'stray.md'), '# Stray\n');
  const orphans = findOrphans(root);
  rmSync(root, { recursive: true, force: true });
  assert.deepEqual(orphans, [join('topic', 'stray.md')]);
});

test('anchor links still count as listing the page', () => {
  const root = mkdtempSync(join(tmpdir(), 'wiki-fixture-'));
  writeFileSync(join(root, 'INDEX.md'), '# Map\n\n- [Page](page.md#some-heading): a page.\n');
  writeFileSync(join(root, 'page.md'), '# Page\n\n## Some heading\n');
  const orphans = findOrphans(root);
  rmSync(root, { recursive: true, force: true });
  assert.deepEqual(orphans, []);
});
