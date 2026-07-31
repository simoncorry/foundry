# Clear technical writing

How to explain technical work in plain English without deleting the terms the reader genuinely needs. This page is for agents and people writing FOR someone who does not share their context: a project owner reading a work summary, a teammate catching up, a future maintainer reading a decision record.

The problem it solves: technical writers default to compression. Compression is cheap for the writer and expensive for the reader, and when the reader is learning the system, an unexplained term doesn't just slow them down; it teaches them that they can't follow this project's writing. Clarity is a product feature of every explanation, not a style preference.

## Where these ideas come from, and where they stop

Six of the principles below are informed by ASD-STE100 (ASD Simplified Technical English), a controlled language developed for aerospace maintenance documentation, and by the plain-language and cognitive-accessibility guidance published by W3C and the UK Department for Education. A 1995 study by Shubert and colleagues found that complex aircraft procedures rewritten in Simplified English were easier to understand and to search, with essentially no change in task time; that is evidence for clearer procedural writing, not proof that any rule transfers everywhere.

Two boundaries, stated plainly:

- This page reproduces nothing from ASD-STE100: no rule text, no examples, no dictionary entries, no rule ordering. It claims no compliance, certification, approval, or endorsement. The standard itself says it was designed for procedural and descriptive technical documentation, not general correspondence. Treat these principles as borrowed judgment, not a checklist that makes writing "compliant."
- Conversation is not a maintenance manual. Audience-aware vocabulary, answer-first structure, explaining a term the first time it appears, and formatting that helps a reader scan are all older and broader plain-language ideas; they come first, and the six principles below supplement them.

## The six principles

**1. Explain a necessary technical term, then use one stable name for it.** Plain language does not mean deleting the term the reader will meet again; it means paying for it once. Introduce the term with a short explanation in the reader's words, then call it by the same name every time after. What breaks understanding is not the term; it's three different names for one thing, or one name silently reused for two things.

**2. Name the actor and the action.** "The cache is invalidated when the file changes" hides who does the invalidating. "The build script clears the cache when the file changes" tells the reader where to look when it goes wrong. Sentences where a named thing does a named action survive being read fast; sentences where things merely happen do not.

**3. Put a condition first when the reader must know it before acting.** If an instruction only applies in some situation, the situation comes before the instruction: "If the server is still running, stop it before pulling." A reader executing steps top to bottom has already acted by the time a trailing condition arrives.

**4. One main idea per sentence.** A sentence carrying two decisions invites the reader to keep one. Splitting is not dumbing down; it is choosing where the full stops go so each idea gets its own.

**5. One topic per paragraph.** A paragraph is a promise that its sentences belong together. When a paragraph drifts from what happened to why to what's next, the reader loses the thread and rereads. Three short paragraphs beat one that braids three topics.

**6. State the consequence of a warning.** "Don't run this against production" is weaker than "Don't run this against production: it rewrites every player record and there is no undo." A warning without its consequence reads as style; a warning with its consequence reads as physics.

## What NOT to import

Controlled languages come with machinery that does not transfer to conversational or explanatory writing, and importing it flattens the writer's voice for no comprehension gain:

- Hard caps on sentence or paragraph length as pass/fail rules. Length advice is only worth having when measured against real writing from the project, and even then as advice, not as a gate. Readability formulas measure ease of decoding, not whether the reader understood the system.
- Restricted vocabularies and banned grammatical forms (contractions, phrasal verbs, passive voice everywhere). These serve translation pipelines and regulatory review, not a reader learning a codebase from a trusted narrator.
- Automated certainty. A checker can find a listed phrase; it cannot judge whether a sentence makes sense. The official guidance around Simplified Technical English itself warns that automated checkers are noisy assistants, not authorities. Whether the actor is named, whether the term was explained, whether the warning carries its consequence: these stay writing responsibilities.

## Further reading

- ASD-STE100 official site and FAQ: https://www.asd-ste100.org/STE_faq.html (scope and intent, in the maintainers' own words)
- Shubert, Spyridakis, Holmback, Coney (1995), "The comprehensibility of Simplified English in procedures": https://journals.sagepub.com/doi/10.2190/WG69-D74B-4DLL-2WBK
- W3C, writing for cognitive accessibility: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/
- UK Department for Education, plain-language content design: https://design.education.gov.uk/content-design/plain-language
