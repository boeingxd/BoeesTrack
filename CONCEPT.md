# BoeesTrack: design concept

**Concept: the notebook with slips clipped in.**
The app is a notebook. Slips are guests, and they appear only where they are real: the batch review, shown as clipped pages.

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
- **Still open:** charts, how budgets are shown (Dime uses a gauge and cards), and the bottom bar.

## Confirmed design brief (first pass)

- **Mode:** Operate. Phone-first; short visits of seconds.
- **Screens:** home, add a spend, slip batch review. Labelled synthetic sample data. Not wired to the database. Untouched: login, Worker, API. Budgets and goals screens later.
- **Structure:** each day is a ruled page (small-caps day header, daily subtotal, hairline rule, entries as lines, category as a plain text tag, amount at the right). Focal moment: today's big number and the next empty line.
- **Add:** the next empty line at the top of today adds a spend; a smaller action beside it adds slips. Amount first, Dime-style on-screen keypad inside the page, time defaults to now and is editable, one category, optional note.
- **Slip review:** slips appear only here, as pages clipped to the notebook, with the slip image, the scanned value, an X to remove, and per-file warnings for unreadable or duplicate slips.
- **Month at a glance (no chart):** numbers for spent, budget and today's allowance, plus one thin ruled progress line; over-budget warning state.
- **Excluded:** charts, cards, colourful tiles, textures like leather or stitching, a bottom bar (for now).
- **States:** empty day, typical (3-8 entries), heavy (15+), a month of day pages, over budget; add (empty, typing, time edited, category chosen or not); review batch of 1-10 slips including one unreadable, one duplicate, one removed. Amounts roughly 25-461 baht.
- **Language and money:** English, baht.
