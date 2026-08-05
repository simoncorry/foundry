#!/usr/bin/env node

// Keeps Foundry's always-loaded rules and source commands inside the context
// budgets the project promises. Generated command shapes are derived from the
// source commands, so counting them again would charge the same prose twice.

import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CONTEXT_LIMITS = Object.freeze({
  agentsBytes: 8_192,
  commandBytes: 112_640,
});

function readNormalized(path, label) {
  try {
    return readFileSync(path, 'utf8').replace(/\r\n?|\n/g, '\n');
  } catch (error) {
    const reason = error?.code ?? error?.message ?? 'unknown read error';
    throw new Error(`${label} could not be read (${reason})`);
  }
}

export function measureContextBudgets(rootDir) {
  const root = resolve(rootDir);
  const agentsPath = join(root, 'AGENTS.md');
  const commandsDir = join(root, '.cursor', 'commands');
  const agentsBytes = Buffer.byteLength(readNormalized(agentsPath, 'AGENTS.md'), 'utf8');

  let entries;
  try {
    entries = readdirSync(commandsDir, { withFileTypes: true });
  } catch (error) {
    const reason = error?.code ?? error?.message ?? 'unknown read error';
    throw new Error(`source command directory could not be read (${reason})`);
  }

  const commandFiles = entries
    .filter((entry) => (entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith('.md'))
    .map((entry) => {
      const path = join(commandsDir, entry.name);
      const portablePath = relative(root, path).split(sep).join('/');
      return {
        path: portablePath,
        bytes: Buffer.byteLength(readNormalized(path, portablePath), 'utf8'),
      };
    })
    .sort((a, b) => b.bytes - a.bytes || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  if (commandFiles.length === 0) {
    throw new Error('source command directory contains no markdown commands');
  }

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
