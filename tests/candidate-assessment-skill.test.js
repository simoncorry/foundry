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

function section(source, heading, nextHeading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `${heading} should exist`);
  const end = nextHeading ? source.indexOf(nextHeading, start + heading.length) : source.length;
  assert.notEqual(end, -1, `${nextHeading} should follow ${heading}`);
  return source.slice(start, end);
}

function levelThreeHeadings(source) {
  return [...source.matchAll(/^### (.+)$/gm)].map((match) => match[1]);
}

function namedScoreFields(source) {
  return [...source.matchAll(/^- `([^`]+)`:/gm)].map((match) => match[1]);
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

  assert.deepEqual(levelThreeHeadings(hiringManager), hiringManagerCriteria);
  assert.equal((hiringManager.match(/Core gate\./g) ?? []).length, 3);

  assert.deepEqual(levelThreeHeadings(portfolio), portfolioCriteria);
  assert.equal((portfolio.match(/Core gate\./g) ?? []).length, 3);

  assert.deepEqual(levelThreeHeadings(exercise), designExerciseCriteria);
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

  assert.deepEqual(
    namedScoreFields(section(setup, '## Hiring Manager Scorecard', '## Portfolio Review Scorecard')),
    hiringManagerCriteria,
  );
  assert.deepEqual(
    namedScoreFields(section(setup, '## Portfolio Review Scorecard', '## Design Exercise Scorecard')),
    portfolioCriteria,
  );
  assert.deepEqual(
    namedScoreFields(section(setup, '## Design Exercise Scorecard', '## Field-Level Scale Description')),
    designExerciseCriteria,
  );

  const overall = section(setup, '### Overall Recommendation', '### Reason for Recommendation');
  for (const mapping of ['- `4`: Strong Yes', '- `3`: Yes', '- `2`: No', '- `1`: Strong No']) {
    assert.ok(overall.includes(mapping), `Overall Recommendation should define ${mapping}`);
  }

  assert.doesNotMatch(setup, /Trait - Smile|Trait - Fast-brained|Trait - Care and Intensity/);
  assert.match(setup, /leave it unscored and say so in the comment/);
});

test('large-company AI examples do not stand in for startup hiring evidence', () => {
  const research = read('references/research-basis.md');
  const startupEvidence = section(research, '## Early-Stage Hiring Evidence', '## AI Practice Evidence');
  const aiEvidence = section(research, '## AI Practice Evidence', '## Deliberate Departures From Conventional Rubrics');

  assert.doesNotMatch(startupEvidence, /Figma|Anthropic/);
  assert.match(aiEvidence, /Figma and Anthropic are evidence for the AI-practice bar only/);
  assert.match(aiEvidence, /They are not the model for startup hiring or process/);
});
