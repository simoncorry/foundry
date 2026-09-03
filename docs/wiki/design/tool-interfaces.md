# Tool interfaces (panels, rows, controls, dialogs)

Professional tools (code editors, design tools, level editors) share a visual grammar that consumer apps do not: dense, quiet, and built around a persistent canvas the chrome must never compete with. This page records that grammar with measured values from tools whose source or design files are public, so a review can say "the row is 6px too tall and the selection is shouting" instead of "it feels off". Sources: the VS Code workbench (open source, MIT; values read 2026-09-03 from the views stylesheet at https://github.com/microsoft/vscode/blob/main/src/vs/workbench/browser/parts/views/media/views.css, the sidebar stylesheet at https://github.com/microsoft/vscode/blob/main/src/vs/workbench/browser/parts/sidebar/media/sidebarpart.css, and the list color registry at https://github.com/microsoft/vscode/blob/main/src/vs/platform/theme/common/colors/listColors.ts), Figma's UI3 write-ups (June 2024 "Inside the redesigned Figma"; the October 2024 revert to docked panels), the MDN guide to the customizable select element (2026), and Norman, Krug, and the gestalt pages this wiki already carries.

## The one rule

A tool's chrome is a reference surface, not a subject. Everything in it is read hundreds of times a session, so it earns its keep by being fast to scan and impossible to mistake, never by being expressive. Every value below follows from that.

## Density: the row grid

- **Rows are 22 to 28px tall, and density is a floor, not a target.** VS Code trees render every row at 22px (`height: 22px; line-height: 22px`, measured from source) with 16px icons padded 6px from the label. Figma's rows are visibly taller (about 28 from a screenshot at unknown scale; not measured from its published kit). Below 22 the rows stop being separable; above about 32 they stop reading as a list. Where a tool lands inside that band is the owner's eye, decided in the real layout with real content, never from the number alone.
- **UI text is 11 to 13px in a proportional sans.** VS Code's default workbench font size is 13px; its filter inputs are 12px; its section titles are 11px. Figma's UI text is 11px (its published kit; not re-measured here). Monospace stays reserved for what is genuinely code or numeric (coordinates, sizes, shortcut keys), where equal-width digits stop the text from jittering as values change.
- **Indent is one step per depth, 12 to 16px**, with a chevron (a "twistie" in VS Code's vocabulary) occupying the first step so labels at the same depth align on one vertical line whether or not they can expand.
- **Labels truncate with an ellipsis, never wrap.** Every VS Code row label carries `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`. A wrapped row breaks the grid and hides that the column is too narrow.

## Selection and hover: tint, never invert

- **Hover is a step of lightness, not a color.** VS Code's `list.hoverBackground` is `#2A2D2E` on Dark+'s `#252526` sidebar: about two percent lighter, no hue. Hover is the most frequent state in the tool and must be nearly silent.
- **Selection is a tinted wash with the text left alone.** VS Code's `list.inactiveSelectionBackground` is `#37373D` (neutral, about ten percent lighter than the panel); its `list.activeSelectionBackground` (the list has keyboard focus) is `#04395E`, a dark blue wash with white text. Figma marks the selected layer with a pale blue wash and blue text. Neither tool inverts the row to a solid block. An inverted (black-on-white or white-on-black) row is a button pressed down; five of them on one screen and the eye cannot find the one that matters.
- **Active-tool state in a toolbar is a filled square around the icon**, one step of elevation or a tinted fill, never a full inversion of the toolbar itself.
- **Focus is a ring, drawn separately from selection**, so keyboard users can tell "where the cursor is" from "what is selected" (VS Code has `list.focusOutline` distinct from the selection backgrounds).

## Label hierarchy: one voice per level

- **One section-title style, used only for section titles.** VS Code's pane headers are 11px uppercase, one weight; Cursor inherits them. Everything below a title is sentence case at body size, distinguished by color (secondary for structure rows, primary for leaves) and indent, never by another uppercase style. When folders, roots, and titles all wear the same tracked uppercase, nothing outranks anything.
- **A tree root does not repeat its panel's title.** The panel title IS the root; the first rows are its children.
- **Letter-spacing on uppercase is a hair (0.3 to 0.6px), not a headline (2px).** Wide tracking is a display style; at 10 to 11px it reads as a warning label.

## Header and row actions: icons, on the edge

- **Create and configure actions are 16px icon buttons at the header's right edge**, inside a 22 to 28px hit box (VS Code: `width: 28px; height: 22px` action labels with 16px glyphs; Cursor shows a filter and a new-folder glyph at the right of its "Repositories" header). Text buttons ("+ New item") belong in empty states and dialogs, not in headers.
- **Per-row actions appear on hover, selection, or focus** and are hidden otherwise (`display: none` until `.monaco-list-row:hover`). A row's own action means "do this HERE", which removes the need for a "current item" the header buttons would otherwise have to track.
- **The header action means the root; the row action means that row.** One rule covers both trees and browsers, and the dialog it opens pre-fills from whichever was pressed.

## Disclosure: always signposted

- **Anything that expands shows a chevron.** Right when closed, down when open; it flips instantly (VS Code and Figma both), because a disclosure that opens dozens of times a session earns no animation. A folder with no chevron is a mystery row.

## Controls: the platform, re-drawn

- **Text inputs sit on the surface color with a hairline border**, 24 to 28px tall in dense tools (VS Code's filter input is 24px at 12px text), placeholder in the muted text color, and the border turns to the accent on focus. No inner shadow, no radius beyond the house radius.
- **Number inputs hide the browser's spinner** (it is 8px wide and never the right style); the value is edited by typing or by the tool's own scrub gesture.
- **Selects are the native element, restyled.** Chromium's customizable select (`select, ::picker(select) { appearance: base-select }`, stable since Chrome 135) gives full CSS control of the button, the picker, each option, the arrow (`::picker-icon`), and the current-selection mark (`::checkmark`) while keeping native keyboard and form behavior. Option groups are labeled with a `<legend>` child. Two consequences to design for: the select no longer sizes itself to its longest option (give it the field's width), and the picker is a top-layer popover (it escapes any overflow clipping, including a dialog's). A hand-built dropdown is only justified where this is unavailable.
- **Checkboxes are 14 to 16px squares** (VS Code: 16px with a 1px border) with the checked state riding the accent.
- **File inputs are never shown raw.** Hide the native control, trigger it from a styled button ("Choose files..."), and render the picked files as rows the user can inspect.
- **Range sliders draw their own 2px track and a square or round thumb sized to the row grid**; the filled portion is the accent.

## Dialogs: a fixed anatomy

- **Title, optional description, body, footer**, in that order, every time (the shape Radix's dialog primitive names as Title / Description / Content and every mature design system reproduces). The title is the body size plus one step, bold, sentence case; the description is one muted line; the footer holds a ghost Cancel and exactly one primary action, right-aligned.
- **Fields follow one grammar:** label above control, a 4px gap between them, 12px between fields, and two fields share a row only when they are one value in two parts (width and height). A field's helper or error text sits under the control in the small size.
- **Two widths, not five.** A default (about 400px) for forms, a wide variant (about 560px) for lists. Every select and input inside takes the field's full width.
- **Entrance is a short opacity fade (150 to 200ms, ease-out); exit is instant.** A tool dialog opens and closes dozens of times a day; the fastest exit is none. Never scale from zero, never slide. Animate `opacity` only (plus the discrete `display`/`overlay` pair when a top-layer element needs them), and never `transition: all`.
- **Refusals land in the form and the form stays open**, in the validator's own words, so the fix is a retype, not a re-open (Norman's feedback principle applied to a modal).

## The check to run on any tool surface

1. Count the inverted (solid-filled) regions on screen. More than one that is not a primary button, and selection is shouting.
2. Count the distinct uppercase-tracked styles. More than one, and the hierarchy is fake.
3. Find a row that can expand with no chevron, a label that wraps, a native-looking select or file input, a header with text buttons. Each is a missed convention the user has already learned elsewhere (Jakob's Law).
4. Open every dialog and check the anatomy order and the field grammar; measure the gaps.
5. Hover a row: if the background jumps a full color rather than a step of lightness, hover is too loud.
