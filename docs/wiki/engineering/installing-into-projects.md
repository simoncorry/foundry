# Installing into someone else's project

What we learned making Foundry's installer stop overwriting a project's own work. The installer copies Foundry into a project and runs again on every update, so it keeps meeting files it didn't write. These are the rules that held up, and the outside facts they lean on.

## Tell your copies apart by their contents, not their names

A file named like one of yours may not be yours. The project may have written its own, or edited the copy you left. Names prove nothing, so compare contents against every version you ever shipped. Git already stores those: `git log --raw` lists the fingerprint of every version of every path, and hashing the project's file the same way git does (the word "blob", the size, a zero byte, then the bytes, through SHA-1) gives a fingerprint to match. A match means the project left your copy alone, and it's safe to replace. No match means the file is the project's, so it stays. Nothing extra has to be stored in the project.

Three things weaken the match, and each needs to be said out loud rather than guessed around:

- **A download or a shallow clone has no history, or only part of it.** GitHub's checkout action fetches a single commit unless told `fetch-depth: 0` (actions/checkout README), and `git clone --depth 1` does the same. Older untouched copies then look like the project's own, so the installer keeps them and says why.
- **Windows checkouts can change line endings.** An untouched copy with carriage-return line endings has a different fingerprint, so match the file a second time with plain newlines.
- **Git can refuse to read a checkout another user owns.** Treat that the same as having no history.

## The rule has to reach every write and every delete

The first version applied the keep rule to copying and forgot two paths the plan had marked "unchanged": cleaning up old command files, which deleted any file by name, and a list file it always rewrote. An independent grader found both. Whatever rule protects the project's files has to be checked on every path that writes or deletes, cleanup included.

## Shared files need a merge rule

Some files belong to both sides. For a rules file, put your text between two marker lines and only ever replace what's between them. Count a marker only when it's a whole line, so a sentence that mentions it can't fool the match, and refuse to guess when markers are missing, doubled, or out of order. For a list both sides add to, merge by key and keep the project's entries first. Re-adding an entry the project deleted is its own kind of overwrite. Foundry's history can tell the two apart: an entry older than the newest one the project already has was offered before, so its absence was a choice.

A file the project deletes outright still comes back on the next run. Telling "deleted on purpose" from "never installed" would need a record of past installs, which this design deliberately avoids.

## Refuse before the first write, report after the last

A run that stops halfway leaves a project in neither state. Check everything that can stop the copy before writing anything: links that lead outside the project, a file where a folder is needed (or the reverse), files that can't be written, damaged inputs. Print the report only after the writes land, so it never claims work that failed.

## Outside facts the installer leans on

- **Codex reads only the first 32 KiB of AGENTS.md by default and cuts the rest without a warning** (its `project_doc_max_bytes` setting; openai/codex `agents_md.rs`, and issue 7138, "AGENTS.md is silently truncated"). Adding a section below a project's long rules can push it past the limit, so the installer warns on every run where the file is over it.
- **Node won't load ES module scripts in a project whose package.json says `"type": "commonjs"`.** With no type set, Node detects module syntax and loads them with a warning. Foundry's scripts are ES modules, so the installer warns. The real fix (renaming every script) touches every command file and is still open.

## Run what you ship inside a real install

Reading the scripts didn't find two of this session's bugs. Running them inside a fresh install did: the link checker crashed in a project with no package.json, and the CommonJS failure above. The install tests now run the installed copy of the link checker inside a temporary project.
