// The one place that knows the shape of a Foundry skill file.
//
// A skill file is .agents/skills/<name>/SKILL.md: a generated header, a
// blank line, then the hand-written instructions (the body). The generator
// rewrites the header of a file people edit, so splitting must be exact:
//
//   - A header exists only when the file's very first line is `---`, and it
//     ends at the next line that is exactly `---`. A `---` anywhere else is
//     body text (construct-the-plan and handoff both contain such lines).
//   - A leading byte-order mark is dropped and \r\n is accepted, so a
//     Windows checkout splits the same way.
//   - At most one blank line after the closing `---` belongs to the header,
//     so a body round-trips byte for byte.
//
// The generator and the context-budget checker both split through here, so
// they can never disagree about where the body starts.

export const HEADER_KEYS = ['name', 'description', 'disable-model-invocation'];

// The Agent Skills standard and Cursor both require this shape, and both
// skip a skill that breaks it without saying so. 64 and 1024 are the
// standard's limits, which Codex enforces the same way.
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;

const HEADER = /^---\r?\n(?:([\s\S]*?)\r?\n)?---(?:\r?\n|$)/;

export function splitSkill(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const match = clean.match(HEADER);
  if (!match) return { header: null, body: clean };
  const rest = clean.slice(match[0].length);
  const body = rest.replace(/^\r?\n/, '');
  return { header: match[1] ?? '', body };
}

// The description is the body's first sentence; Codex and Cursor show it in
// their skill lists. Emitted single-quoted: YAML's single-quoted style has
// exactly one escape (a doubled quote), so backslashes and other punctuation
// in a command's first line can't break the header parse.
export function firstSentence(body) {
  const firstLine = body.split(/\r?\n/).find((l) => l.trim().length > 0) ?? '';
  const match = firstLine.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : firstLine).trim();
}

function quote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildSkill(name, body) {
  return [
    '---',
    `name: ${quote(name)}`,
    `description: ${quote(firstSentence(body))}`,
    // Unquoted on purpose: a quoted 'true' is a string, which a tool may
    // not read as on.
    'disable-model-invocation: true',
    '---',
    '',
    body,
  ].join('\n');
}

// Returns the problems with a skill file as plain sentences; empty means the
// file can be rebuilt safely. Checks run before anything is written.
export function skillProblems(name, text) {
  const problems = [];
  if (!NAME_PATTERN.test(name) || name.length > MAX_NAME) {
    problems.push(`folder name "${name}" must be lowercase letters, digits, and single hyphens, at most ${MAX_NAME} characters`);
  }
  const { header, body } = splitSkill(text);
  if (/^(?:[ \t]*\r?\n)*---\r?\n/.test(body)) {
    problems.push('the body still starts with a --- line after the header; remove the extra header instead of letting a second one stack on top');
  }
  if (header !== null) {
    for (const line of header.split(/\r?\n/)) {
      if (line.trim() === '') continue;
      const key = line.match(/^([A-Za-z0-9_-]+):/)?.[1];
      if (!key || !HEADER_KEYS.includes(key)) {
        problems.push(`header line "${line}" is not one the generator writes (${HEADER_KEYS.join(', ')}); add it to scripts/skill-file.js or remove it`);
      }
    }
  }
  const description = firstSentence(body);
  if (description === '') {
    problems.push('the body is empty, so there is no first sentence to use as the description');
  } else if (description.length > MAX_DESCRIPTION) {
    problems.push(`the first sentence is ${description.length} characters; the description limit is ${MAX_DESCRIPTION}`);
  }
  return problems;
}
