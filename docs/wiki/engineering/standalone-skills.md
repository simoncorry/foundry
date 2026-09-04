# Standalone skills

Foundry's named build stages live in the generated command system. A useful skill that is not part of that sequence belongs in its own bundle under `skills/<name>`. This keeps it installable without quietly turning it into another stage for every Foundry project.

## What belongs in the bundle

Keep `skills/<name>/SKILL.md` at the root of the bundle. Put user-facing metadata in `skills/<name>/agents/openai.yaml` and larger instructions in `skills/<name>/references/` so the agent reads only what the task needs. The main skill must link every required reference with a relative path.

## What proves it works

Folder existence is weak proof. Install the skill from its GitHub path into a temporary directory and compare that result with the source. Add a focused test for the promises that cross files, especially names or scores repeated in setup instructions and evaluation rubrics. Foundry's normal link and jargon checks still apply.
