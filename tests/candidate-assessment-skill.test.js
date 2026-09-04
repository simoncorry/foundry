import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = join(repoRoot, 'skills', 'candidate-assessment');

const hiringManagerCriteria = [
  'Distinctive Edge and Generative Curiosity',
  'Problem Finding, Autonomy, and Impact',
  'Velocity, Learning, and Product Judgment',
  'Constructive Challenge, Self-Awareness, and Trust',
  'AI-Native Builder Practice',
];

const portfolioCriteria = [
  'Problem Choice and Framing',
  'Personal Ownership and Judgment',
  'Craft, Taste, and Human Intent',
  'Shipping, Customer Contact, and Learning',
  'Distinctive Spike',
  'AI-Enabled Build Practice',
];

const designExerciseCriteria = [
  'Question Quality and Discovery',
  'Problem Framing and Perspective',
  'Exploration and Distinctive Thinking',
  'Prioritization, Tradeoffs, and Velocity',
  'Collaboration and Adaptation',
  'Direction, Craft, and Human Intent',
];

function read(relativePath) {
  return readFileSync(join(skillRoot, relativePath), 'utf8');
}

test('candidate assessment is a complete installable skill', () => {
  const skill = read('SKILL.md');
  const metadata = read('agents/openai.yaml');

  assert.match(skill, /^---\nname: candidate-assessment\ndescription: .+\n---\n/);
  assert.match(metadata, /display_name: "Candidate Assessment"/);
  assert.match(metadata, /default_prompt: "Use \$candidate-assessment/);

  for (const file of [
    'scoring-and-output.md',
    'hiring-manager.md',
    'portfolio-review.md',
    'design-exercise.md',
    'final-synthesis.md',
    'research-basis.md',
    'ashby-setup.md',
  ]) {
    assert.match(skill, new RegExp(`\\(references/${file.replace('.', '\\.')}\\)`));
    assert.ok(read(`references/${file}`).trim().length > 0, `${file} should not be empty`);
  }
});

test('the Ashby output contract keeps its paste-ready fields and 1 to 4 decision scale', () => {
  const scoring = read('references/scoring-and-output.md');

  for (const heading of [
    '## Overall Recommendation',
    '## Reason for Recommendation',
    '## Next Steps',
    '## Areas to Probe',
    '## What Candidate Cares About',
    '## Criterion Scores',
  ]) {
    assert.ok(scoring.includes(heading), `${heading} should remain in the output contract`);
  }

  for (const anchor of [
    '### 1: Strong No',
    '### 2: No',
    '### 3: Yes',
    '### 4: Strong Yes',
  ]) {
    assert.ok(scoring.includes(anchor), `${anchor} should remain defined`);
  }

  assert.match(scoring, /Do not average the criterion scores/);
  assert.match(scoring, /AI must be at least 3/);
});

test('each interview plan preserves its intended evidence and gates', () => {
  const hiringManager = read('references/hiring-manager.md');
  const portfolio = read('references/portfolio-review.md');
  const exercise = read('references/design-exercise.md');
  const synthesis = read('references/final-synthesis.md');

  for (const criterion of hiringManagerCriteria) {
    assert.ok(hiringManager.includes(`### ${criterion}`), `hiring manager should score ${criterion}`);
  }
  assert.equal((hiringManager.match(/Core gate\./g) ?? []).length, 3);

  for (const criterion of portfolioCriteria) {
    assert.ok(portfolio.includes(`### ${criterion}`), `portfolio should score ${criterion}`);
  }
  assert.equal((portfolio.match(/Core gate\./g) ?? []).length, 3);

  for (const criterion of designExerciseCriteria) {
    assert.ok(exercise.includes(`### ${criterion}`), `design exercise should score ${criterion}`);
  }
  assert.equal((exercise.match(/Core gate\./g) ?? []).length, 2);
  assert.match(exercise, /Strong visual output cannot rescue/);

  for (const requirement of [
    'Problem finding and independent ownership',
    'Product craft, taste, and human judgment',
    'Velocity tied to shipping',
    'AI-native build practice at 3 or higher',
  ]) {
    assert.ok(synthesis.includes(requirement), `final synthesis should require ${requirement}`);
  }
});

test('the Ashby setup replaces the inherited generic trait scorecard', () => {
  const setup = read('references/ashby-setup.md');

  for (const plan of [
    '## Hiring Manager Scorecard',
    '## Portfolio Review Scorecard',
    '## Design Exercise Scorecard',
  ]) {
    assert.ok(setup.includes(plan), `${plan} should remain configured`);
  }

  for (const criterion of [
    ...hiringManagerCriteria,
    ...portfolioCriteria,
    ...designExerciseCriteria,
  ]) {
    assert.ok(setup.includes(`\`${criterion}\``), `Ashby setup should include ${criterion}`);
  }

  for (const label of ['1 Strong No', '2 No', '3 Yes', '4 Strong Yes']) {
    assert.ok(setup.includes(label), `Ashby setup should define ${label}`);
  }

  assert.doesNotMatch(setup, /Trait - Smile|Trait - Fast-brained|Trait - Care and Intensity/);
  assert.match(setup, /leave it unscored and say so in the comment/);
});
