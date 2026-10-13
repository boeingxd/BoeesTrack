# BoeesTrack: design concept

**Concept: the notebook with slips clipped in.**
The app is a notebook. Slips are guests, and they appear only where they are real: the batch review, shown as clipped pages, and the picture on the entry made from a slip.

## Evidence (the owner's own words)

- "I like notebook ... for easily understanding what can be done on it, self explanatory"
- Apple devices, Notion and Google Classroom: "how clean they are, the layout being easy to understand, white space, aesthetic without doing too much". Take the philosophy, not the screens. No iOS mock-up.
- "I really really value UX."
- Anti-reference: youratlas.com (black-to-magenta gradient hero, glowing grid of rounded squares, bold sans mixed with italic serif, pill badges, logo strips, hype copy, two big pinned buttons).
- The money life runs through Thai bank transfer slips (screenshots), plus cash.

## The 3-second glance

Today's spend. This month: spent against budget, the daily allowance and the over-budget warning. Today's entries beneath. Goal progress. Three actions: add a spend, add money, add slips.

## UX flow the concept must serve

1. **Add a spend:** one tap from the main screen. Amount first. Time defaults to now and can be changed. One category tag, optional note.
2. **Add slips:** a separate one-tap path. Amount and time are filled in automatically. A batch is split into one entry per purchase and reviewed with the slip image, the scanned value and an X to remove it.

## What the metaphor implies (to be settled in the brief, not decided here)

- **Layout:** each day is a page of ruled lines, one purchase per line. The next empty line is the "add" action. The month header is the cover of the spread.
- **Type:** one calm text face; numerals set for clear amounts.
- **Colour:** paper-like ground and one ink colour; restraint is the point.
- **Motion:** a new entry settles into its line; moving between days is a quiet flip.
- **Slips:** in the batch review, slips look like pages clipped to the notebook.

## Rules

- The metaphor lives in structure (lines, pages, spreads), never in decoration. No leather, stitching or fake handwriting.
- Notebook is the app; slips are guests.
- Self-explanatory: the screen should show what can be done without a tutorial.
- Borrow principles from references; never copy a UI.

## Risk

Kitsch from skeuomorphic detail; two metaphors blurring into each other. Check every screen: would someone guess "notebook" from structure alone, without textures?

## Anchor (owner's choice)

- **Lead anchor: Dime** (iOS budget and expense tracker). Borrow its structure and flow: quick add from the home screen, budgets per category, daily and monthly breakdowns, swipe between expense and income when adding, suggestions while typing, undo on delete. Translate everything into notebook lines and pages instead of cards.
- **Secondary influence: BalancePro** (Dribbble concept by Arip for kiwari). Borrow only its cleanliness: calm grey ground, generous spacing, one dark accent, clear hierarchy. Do not borrow its cards, pastel bars or pie charts.
- Reason given by the owner: Dime should lead; BalancePro "looks cleaner than Dime".
- **Dime screens now seen** (six App Store screenshots fetched to a scratch folder outside the repo, with the owner's OK): white ground; one big light-weight number at top; entries grouped by day with small-caps headers, subtotals and hairline rules; coloured emoji tiles per category; amount-first add screen with keypad, date-time chip, category chip and a dark confirm key; weekly bar chart with dashed average line; half-gauge and 2x2 cards for budgets; bottom bar with five tabs and a dark center "+".
- **Translation suggestions awaiting the owner's reaction:** keep day groups and the amount-first add flow; replace colourful tiles with plain text tags; replace gauge and cards with ruled budget lines; keep the dark "+" as the one-tap add.

## Owner decisions on the Dime translation

- **Keep:** the day groups (small-caps day header, daily subtotal, hairline rule, entries as ruled lines) and the amount-first add flow.
- **Drop:** the colourful category tiles (categories become plain text tags).
- **Still open:** charts and how budgets are shown (Dime uses a gauge and cards). The bottom bar was settled in the 2026-10-13 revamp, below.

## Since the first pass (2026-10-12)

The slips are real now, and the owner's decisions shaped how:

- **Read on the device, kept private.** Slips are read in the browser (no AI-vision button for now). The picture is kept in a private bucket, so the owner can look back at the evidence.
- **Review row: picture beside fields.** In the review the slip picture sits on the left, cropped to the top where the amount and time are, with the amount, time, note and tag to its right and an X at the corner. The receiver's name goes into the note.
- **Shop memory.** A slip from a shop seen before starts with that shop's earlier note and tag, and a small line says so. Reading is two rounds: the whole slip for amount, time and reference, then a closer look at just the name.
- **The guest stays a guest.** Slips still never take over the notebook. Besides the review, the only other place a slip shows is the entry screen: its picture sits below the entry's fields as a clipped page, with "Remove picture" beside "Delete entry". A slip entry is edited like any other.
- **Clearing.** Pictures can be removed one at a time, in bulk by age (3, 6 or 12 months, with the count and size shown first), or with the entry. History gets a Source filter (all, slips, typed in by hand).
- **Calm filters.** History keeps its period, search and result line in view and tucks Kind, Tag and Source behind one "Filters" row, after the first version with three dropdowns felt overwhelming.

## UI revamp (2026-10-13)

The layout was audited against a mobile UI brief (about 19 rules from a notes-app video) and revised. The owner took the recommendations on each open question:

- **Bottom bar.** Home, Insight, History and Savings are four text tabs along the bottom, with Add as a separate filled button beside them (flat, square-cornered, no pill and no shadow, so the notebook stays flat). It replaces the top tab row and the Home dock, and hides on the Add, entry and slip screens.
- **Slips moved into Add.** The "separate one-tap path" is now a Slips button in the Add screen's top bar, so it is two taps from anywhere.
- **Bottom sheets for small choices.** Budget, Check balance, History filters and the pot forms rise over the current screen instead of replacing it or expanding inline.
- **Empty states.** Home, Savings and Add explain themselves when there is nothing yet; History's no-results state offers one way out.
- **Gestures skipped for now** (swipe back, swipe down to dismiss, long press). **Not applied:** floating pill bar, round "+", cards, carousels; the brief's density advice does not fit History and Insight, which stay as dense ruled lists.

## Confirmed design brief (first pass)

- **Mode:** Operate. Phone-first; short visits of seconds.
- **Screens:** home, add a spend, slip batch review. Labelled synthetic sample data. Not wired to the database. Untouched: login, Worker, API. Budgets and goals screens later.
- **Structure:** each day is a ruled page (small-caps day header, daily subtotal, hairline rule, entries as lines, category as a plain text tag, amount at the right). Focal moment: today's big number and the next empty line.
- **Add:** the next empty line at the top of today adds a spend; a smaller action beside it adds slips. Amount first, Dime-style on-screen keypad inside the page, time defaults to now and is editable, one category, optional note.
- **Slip review:** slips appear here, as pages clipped to the notebook, with the slip image, the scanned value, an X to remove, and per-file warnings for unreadable or duplicate slips. (Since then the entry screen also shows a saved slip's picture; see above.)
- **Month at a glance (no chart):** numbers for spent, budget and today's allowance, plus one thin ruled progress line; over-budget warning state.
- **Excluded:** charts, cards, colourful tiles, textures like leather or stitching. (A bottom bar was excluded here at first and added in the 2026-10-13 revamp.)
- **States:** empty day, typical (3-8 entries), heavy (15+), a month of day pages, over budget; add (empty, typing, time edited, category chosen or not); review batch of 1-10 slips including one unreadable, one duplicate, one removed. Amounts roughly 25-461 baht.
- **Language and money:** English, baht.
