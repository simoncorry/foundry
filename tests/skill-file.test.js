import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSkill, firstSentence, skillProblems, splitSkill } from '../scripts/skill-file.js';

test('a header exists only when the very first line is ---', () => {
  assert.deepEqual(splitSkill('Body first.\n\n---\nname: x\n---\n'), {
    header: null,
    body: 'Body first.\n\n---\nname: x\n---\n',
  });
  assert.deepEqual(splitSkill(' ---\nname: x\n---\nBody.\n'), {
    header: null,
    body: ' ---\nname: x\n---\nBody.\n',
  });
});

test('the header ends at the first whole --- line, so a later --- stays in the body', () => {
  const text = "---\nname: 'a'\n---\n\nIntro.\n\n---\nnot a header\n---\n";
  assert.deepEqual(splitSkill(text), {
    header: "name: 'a'",
    body: 'Intro.\n\n---\nnot a header\n---\n',
  });
});

test('a --- that only starts a longer line does not close the header', () => {
  assert.deepEqual(splitSkill("---\nname: 'a'\n----\nmore: x\n---\nBody.\n"), {
    header: "name: 'a'\n----\nmore: x",
    body: 'Body.\n',
  });
});

test('exactly one blank line after the header belongs to it', () => {
  assert.equal(splitSkill("---\nname: 'a'\n---\nBody.\n").body, 'Body.\n');
  assert.equal(splitSkill("---\nname: 'a'\n---\n\nBody.\n").body, 'Body.\n');
  assert.equal(splitSkill("---\nname: 'a'\n---\n\n\nBody.\n").body, '\nBody.\n');
});

test('a byte-order mark and \\r\\n line endings split the same way', () => {
  assert.deepEqual(splitSkill("\uFEFF---\r\nname: 'a'\r\n---\r\n\r\nBody.\r\n"), {
    header: "name: 'a'",
    body: 'Body.\r\n',
  });
});

test('an empty header and a header closing at end of file both split', () => {
  assert.deepEqual(splitSkill('---\n---\n\nBody.\n'), { header: '', body: 'Body.\n' });
  assert.deepEqual(splitSkill("---\nname: 'a'\n---"), { header: "name: 'a'", body: '' });
});

test('an unclosed header is treated as body, not swallowed', () => {
  const text = "---\nname: 'a'\nBody with no closing line.\n";
  assert.deepEqual(splitSkill(text), { header: null, body: text });
});

test('buildSkill writes the exact header and round-trips any body', () => {
  assert.equal(
    buildSkill('quiz', "Ask what's next. Then grade.\n"),
    "---\nname: 'quiz'\ndescription: 'Ask what''s next.'\ndisable-model-invocation: true\n---\n\nAsk what's next. Then grade.\n"
  );
  for (const body of ['One. Two.\n', '\nLeading blank. Body.\n', 'No trailing newline.', 'Has\r\nWindows endings.\r\n']) {
    assert.equal(splitSkill(buildSkill('round-trip', body)).body, body);
  }
});

test('firstSentence takes the first non-empty line up to its first sentence end', () => {
  assert.equal(firstSentence('\n\nHello there. More.\n'), 'Hello there.');
  assert.equal(firstSentence('Is it done? Yes.\n'), 'Is it done?');
  assert.equal(firstSentence('Version 1.5 ships. Later.\n'), 'Version 1.5 ships.');
  assert.equal(firstSentence('No break at all\nsecond line.\n'), 'No break at all');
});

test('skillProblems accepts every header key the generator writes, and only those', () => {
  assert.deepEqual(skillProblems('alpha', buildSkill('alpha', 'Fine body. Yes.\n')), []);
  const problems = skillProblems('alpha', "---\nname: 'alpha'\nicon: beaker\n  - stray list item\n---\n\nBody. Yes.\n");
  assert.equal(problems.length, 2);
  assert.ok(problems[0].includes('"icon: beaker"'));
  assert.ok(problems[1].includes('"  - stray list item"'));
});

test('skillProblems flags a second header hiding behind blank lines', () => {
  const stacked = `---\nname: 'a'\n---\n\n\n\n${buildSkill('a', 'Body. Yes.\n')}`;
  assert.equal(skillProblems('a', stacked).length, 1);
  assert.ok(skillProblems('a', stacked)[0].includes('still starts with a --- line'));
});

test('skillProblems enforces the Agent Skills name rules and the description limit', () => {
  const ok = 'Body. Yes.\n';
  for (const bad of ['Upper', '-leading', 'trailing-', 'two--hyphens', 'under_score', 'a'.repeat(65)]) {
    assert.equal(skillProblems(bad, ok).length, 1, bad);
  }
  for (const good of ['a', 'challenge-plan-5', 'x'.repeat(64)]) {
    assert.deepEqual(skillProblems(good, ok), [], good);
  }
  assert.deepEqual(skillProblems('a', `${'x'.repeat(1023)}.\n`), []);
  assert.equal(skillProblems('a', `${'x'.repeat(1024)}.\n`).length, 1);
});
