# UX principles

The working vocabulary for arguing about whether an interface works. Sources: Don Norman (The Design of Everyday Things; Emotional Design), Steve Krug (Don't Make Me Think), Jon Yablonski (Laws of UX; the list below checked against lawsofux.com directly), Alan Cooper (About Face), Erika Hall (Just Enough Research), Steve Portigal (Interviewing Users).

## Norman's core six (The Design of Everyday Things)

- **Affordances**: what an object's properties allow (a flat plate affords pushing). In screens, mostly perceived affordances: what it looks like you can do.
- **Signifiers**: the marks that tell you where to act. Norman added the term because affordances go invisible on screens; a button's raised look is a signifier.
- **Mapping**: the relationship between control and effect. Good mapping needs no label (burners arranged like the knobs). If a control needs explanation to find its target, the mapping failed first.
- **Feedback**: every action gets an immediate, proportionate response. Silence after an action reads as breakage; over-loud feedback trains people to ignore it.
- **Conceptual model**: the story the user builds about how the thing works. Design communicates a model whether you intend it or not; the only question is whether the communicated model is the real one.
- **Constraints**: physical, logical, and cultural limits that prevent wrong actions before they happen. The best error message is the one a constraint made unnecessary.

Two companion ideas worth naming in reviews. The gulfs: execution (how do I do it?) and evaluation (did it work?); most usability failures are one gulf or the other. And the error taxonomy: slips (right intention, wrong action, cured by better signifiers and constraints) versus mistakes (wrong intention, cured by a better conceptual model). Design for error: undo over confirmation, and confirmation only for the genuinely destructive.

Emotional Design's three levels: visceral (immediate look and feel), behavioral (use), reflective (what it means to the person). They explain the aesthetic-usability effect below rather than contradicting usability: attractive things also have to work, but attractive working things get forgiven more.

## Krug's usability rules (Don't Make Me Think)

- The title is the law: a screen should be self-evident, and when it can't be, self-explanatory. Every question mark in a user's head is cognitive load spent on your interface instead of their goal.
- People don't read, they scan; design billboards, not essays. Clear visual hierarchy, conventional layouts, obvious clickability, and ruthless deletion (Krug's rule of thumb: halve the words on the page, then halve what survives).
- People satisfice: they click the first plausible option, not the best one. Design for the reasonable first guess being correct.
- Mindless choices beat few choices: three obvious clicks beat one that requires thought.
- Usability testing is a spot-check anyone can run: a handful of people attempting real tasks finds the worst problems; a morning a month beats a big study never run.

## The Laws of UX (Yablonski), the ones that carry daily weight

- **Fitts's Law**: acquisition time grows with distance and shrinks with target size. Put frequent actions close and big; edge and corner targets are effectively infinite in one axis.
- **Hick's Law**: decision time grows with the number and complexity of options. Trim, group, or stage choices; presets first, detail on demand.
- **Jakob's Law**: people spend most of their time in other software, so they expect yours to work the same way. Convention is a feature; novelty needs proof.
- **Miller's Law**: working memory holds about seven items, plus or minus two; the design implication is chunking, not a literal budget of seven.
- **Doherty Threshold**: keep the interaction loop under 400ms or attention breaks and productivity drops. This governs interface feedback; deliberate pacing inside a product's domain (a cast time in a game, a cooling-off step in a payment flow) is a design value this law never argues against.
- **Tesler's Law** (conservation of complexity): every task has irreducible complexity; the design decision is who absorbs it, the interface or the user. Simplification that just relocates complexity onto the user is a cost, not a win.
- **Peak-End Rule**: experiences are judged by their peak and their ending. Close every flow well; the last screen of a checkout or a failure-and-retry loop is worth disproportionate polish.
- **Aesthetic-Usability Effect**: attractive design is perceived as more usable, which buys forgiveness and also masks problems in testing; discount praise for pretty prototypes.
- **Goal-Gradient Effect**: effort accelerates near the goal; show progress and make the remaining distance visible.
- **Von Restorff Effect**: the one that differs gets remembered; emphasis works only when it's scarce.
- **Zeigarnik Effect**: interrupted tasks are remembered better than finished ones; visible incomplete states pull people back.
- **Postel's Law**: be liberal in what you accept from people (input formats, typos in forms), conservative in what you show them. An interface rule only: it never licenses lenient server-side validation, where the sound posture stays the opposite (input from outside is hostile by default).
- **Choice Overload** and **Cognitive Load**: the umbrella costs the others manage. Every element bills the user's attention; spend it on their goal.

## Research (just enough of it)

- Research is not asking people what they want; it's finding out what they do and why (Hall, Just Enough Research). Enough research to kill the riskiest assumption beats a study that arrives after the decision.
- Interviewing is a craft: open questions, silence that lets people finish, behavior over opinion, and no leading the witness (Portigal, Interviewing Users).
- Personas are goal-directed tools, not marketing demographics: a persona earns its place by carrying goals that change design decisions (Cooper, About Face). Cooper's excise concept names the tax work an interface makes people do that serves the tool, not the goal; hunt it like dead code.
- The designer is not the user, and neither is the team. The active-user paradox (nobody reads the manual) means onboarding must live inside use, not beside it.
