#!/usr/bin/env node

// Keeps Foundry's always-loaded rules and source commands inside the context
// budgets the project promises. The source commands are the skill bodies in
// .agents/skills/; their generated headers and the Claude copies are derived
// from those bodies, so counting them would charge the same prose twice.
//
// A project that installs Foundry keeps its own skills in .agents/skills/
// too, so only the names in scripts/foundry-commands.json (written by the
// generator, rewritten by the installer to the commands it installed) are
// counted. A project's AGENTS.md likewise holds the project's own rules
// around Foundry's marked section, and only that section is Foundry's to
// budget.

import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { splitSkill } from './skill-file.js';

export const CONTEXT_LIMITS = Object.freeze({
  agentsBytes: 8_192,
  commandBytes: 112_640,
});

// The installer writes Foundry's rules between these two lines in a
// project's AGENTS.md. Foundry's own AGENTS.md carries neither.
export const FOUNDRY_SECTION = Object.freeze({
  start: "<!-- Foundry's rules start here. The Foundry installer replaces everything down to the end line, so write your own rules above or below these two lines, never between them. -->",
  end: "<!-- Foundry's rules end here. -->",
});

// Where Foundry's section sits in an AGENTS.md: null when the file has no
// markers, else the character range between the start and end lines. A
// marker counts only as a whole line (a trailing carriage return allowed),
// so prose that mentions one never matches. Anything other than exactly one
// start line followed by one end line throws, because guessing where
// Foundry's text ends could cut into the project's own rules.
export function foundrySection(text) {
  const starts = [];
  const ends = [];
  let offset = 0;
  for (const line of text.split('\n')) {
    const bare = line.endsWith('\r') ? line.slice(0, -1) : line;
    const after = offset + line.length + 1;
    if (bare === FOUNDRY_SECTION.start) starts.push({ at: offset, after });
    if (bare === FOUNDRY_SECTION.end) ends.push({ at: offset, after });
    offset = after;
  }
  if (starts.length === 0 && ends.length === 0) return null;
  if (starts.length !== 1 || ends.length !== 1 || ends[0].at < starts[0].after) {
    throw new Error(
      `AGENTS.md has ${starts.length} start and ${ends.length} end line(s) for Foundry's section` +
      `${starts.length === 1 && ends.length === 1 ? ', with the end line first' : ''}; ` +
      'it needs exactly one of each, start first'
    );
  }
  return { innerStart: starts[0].after, innerEnd: ends[0].at };
}

function readNormalized(path, label) {
  try {
    return readFileSync(path, 'utf8').replace(/\r\n?|\n/g, '\n');
  } catch (error) {
    const reason = error?.code ?? error?.message ?? 'unknown read error';
    throw new Error(`${label} could not be read (${reason})`);
  }
}

function commandNames(root) {
  const label = 'scripts/foundry-commands.json';
  const text = readNormalized(join(root, 'scripts', 'foundry-commands.json'), label);
  let names;
  try {
    names = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON (${error.message})`);
  }
  // The pattern also keeps a listed name from climbing out of .agents/skills/.
  if (!Array.isArray(names) || names.some((name) => typeof name !== 'string' || !/^[a-z0-9-]+$/.test(name))) {
    throw new Error(`${label} must be a list of command names`);
  }
  if (names.length === 0) throw new Error(`${label} lists no commands`);
  return names;
}

export function measureContextBudgets(rootDir) {
  const root = resolve(rootDir);
  const agentsPath = join(root, 'AGENTS.md');
  const commandsDir = join(root, '.agents', 'skills');
  const agentsText = readNormalized(agentsPath, 'AGENTS.md');
  const section = foundrySection(agentsText);
  const agentsBytes = Buffer.byteLength(section ? agentsText.slice(section.innerStart, section.innerEnd) : agentsText, 'utf8');

  const commandFiles = commandNames(root)
    .map((name) => {
      const path = join(commandsDir, name, 'SKILL.md');
      const portablePath = relative(root, path).split(sep).join('/');
      const { body } = splitSkill(readNormalized(path, portablePath));
      return { path: portablePath, bytes: Buffer.byteLength(body, 'utf8') };
    })
    .sort((a, b) => b.bytes - a.bytes || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  return {
    agentsBytes,
    commandBytes: commandFiles.reduce((sum, file) => sum + file.bytes, 0),
    commandCount: commandFiles.length,
    commandFiles,
  };
}

export function evaluateContextBudgets(measurement, limits = CONTEXT_LIMITS) {
  const violations = [];
  if (measurement.agentsBytes > limits.agentsBytes) {
    violations.push({ name: 'AGENTS.md', actual: measurement.agentsBytes, limit: limits.agentsBytes });
  }
  if (measurement.commandBytes > limits.commandBytes) {
    violations.push({ name: 'source commands', actual: measurement.commandBytes, limit: limits.commandBytes });
  }
  return { ok: violations.length === 0, violations };
}

function printReport(measurement, evaluation) {
  console.log(`[context-budgets] AGENTS.md: ${measurement.agentsBytes} / ${CONTEXT_LIMITS.agentsBytes} bytes`);
  console.log(
    `[context-budgets] source commands: ${measurement.commandBytes} / ${CONTEXT_LIMITS.commandBytes} bytes ` +
    `across ${measurement.commandCount} files`
  );
  for (const file of measurement.commandFiles) {
    console.log(`[context-budgets] ${String(file.bytes).padStart(6)}  ${file.path}`);
  }
  for (const violation of evaluation.violations) {
    const over = violation.actual - violation.limit;
    console.error(
      `[context-budgets] OVER: ${violation.name} is ${violation.actual} bytes, ` +
      `${over} byte${over === 1 ? '' : 's'} above its ${violation.limit}-byte limit`
    );
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--check') || args.filter((arg) => arg === '--check').length > 1) {
    console.error('[context-budgets] usage: node scripts/check-context-budgets.js [--check]');
    process.exitCode = 1;
    return;
  }

  try {
    const root = process.env.CONTEXT_BUDGET_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');
    const measurement = measureContextBudgets(root);
    const evaluation = evaluateContextBudgets(measurement);
    printReport(measurement, evaluation);
    if (args.includes('--check') && !evaluation.ok) process.exitCode = 1;
  } catch (error) {
    console.error(`[context-budgets] ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolveArgvPath(process.argv[1])).href;
if (invokedDirectly) main();

function resolveArgvPath(argvPath) {
  for (const candidate of [argvPath, `${argvPath}.js`]) {
    try {
      return realpathSync(candidate);
    } catch {
      // Try the next supported spelling.
    }
  }
  return resolve(argvPath);
}
