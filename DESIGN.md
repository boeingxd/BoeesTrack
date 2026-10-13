---
name: BoeesTrack
description: A ruled blue-ink notebook for daily and monthly baht spending, with bank slips clipped in only for review.
colors:
  paper: "oklch(98.6% 0.005 250)"
  paper-2: "oklch(96% 0.008 250)"
  paper-3: "oklch(93.5% 0.01 250)"
  desk: "oklch(95% 0.008 250)"
  sheet: "oklch(99.4% 0.003 250)"
  rule: "oklch(88% 0.022 245)"
  edge: "oklch(62% 0.04 255)"
  ink: "oklch(27% 0.06 262)"
  ink-2: "oklch(40% 0.05 260)"
  muted: "oklch(52% 0.035 256)"
  red: "oklch(56% 0.18 25)"
  red-text: "oklch(46% 0.17 25)"
  margin-red: "oklch(80% 0.07 25)"
  focus-blue: "oklch(52% 0.19 258)"
  selection: "oklch(88% 0.06 258)"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, Noto Sans Thai, sans-serif"
    fontSize: "clamp(2.75rem, 13vw, 4rem)"
    fontWeight: 200
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, Noto Sans Thai, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, Noto Sans Thai, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, Noto Sans Thai, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  scanned-value:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
rounded:
  s: "6px"
  hairline: "2px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  line: "52px"
  page-pad: "20px"
  margin-col: "56px"
  tap: "44px"
components:
  button-add:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.s}"
    height: "56px"
  button-slips:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.s}"
    height: "56px"
  button-confirm-disabled:
    backgroundColor: "{colors.paper-3}"
    textColor: "{colors.muted}"
  slip:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.hairline}"
    padding: "24px 12px 16px"
  line:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "52px"
    padding: "8px 20px"
---

# Design System: BoeesTrack

## Overview

**Creative North Star: "The Ruled Page"**

A cool near-white sheet with pale blue rules, blue-black ink, and one red. The notebook lives in structure only: each day is a page with a bold date over a 1px ink rule, one purchase per ruled line, a red margin line beside the rows. There is no texture, no cards, no tiles. Slips are guests: they appear as lighter pages with a clip in batch review, and as a picture below the fields of an entry saved from a slip.

Density is calm and phone-first (a 30rem column, centred on wider screens, with a thin rule either side). The big figure is light (weight 200) and sits on the left page edge together with the titles; emphasis comes from weight 500 to 600 and ink, never from colour.

**Key Characteristics:**
- Rules, margin and day headers carry the structure; fills are rare and always ink.
- One red (margin line, warnings, over-budget). One blue (focus ring only).
- Amounts are tabular figures; money is whole baht when averaged.
- Works at 320px with no horizontal overflow; every tap target is at least 44px.

## Colors

Restrained: blue-leaning neutrals plus ink, one red, and a focus blue. Neutrals all lean to hue 245 to 262.

### Primary
- **Blue-Black Ink** (oklch(27% 0.06 262)): text, the 1px day-header rule, today's bar, the filled Add button, the selected-tab rule, the outline on the "free today" part of the budget bar.
- **Soft Ink** (oklch(40% 0.05 260)): secondary text, month title, day sums.

### Secondary
- **Notebook Red** (oklch(56% 0.18 25)): over-budget bar fills and the border of a warning slip. Warning text uses **Deep Red** (oklch(46% 0.17 25)). The **Margin Red** (oklch(80% 0.07 25)) is the pale line beside ruled rows.

### Neutral
- **Desk** (oklch(95% 0.008 250)): the body ground outside the page.
- **Paper** (oklch(98.6% 0.005 250)): the page. **Sheet** (oklch(99.4% 0.003 250)): the lighter slip page.
- **Paper-2 / Paper-3**: hover and pressed fills.
- **Rule** (oklch(88% 0.022 245)): every hairline, bar tracks, unfilled share bars.
- **Edge** (oklch(62% 0.04 255)): mid-tone for past-day bars, "before today" in the budget bar, select underlines.
- **Muted** (oklch(52% 0.035 256)): labels, times, notes, inactive tabs.
- **Focus Blue** (oklch(52% 0.19 258)) and **Selection** (oklch(88% 0.06 258)): focus ring and text selection only.

### Named Rules
**The One Red Rule.** Red marks the margin line and warnings (over today, over month, unreadable or duplicate slip). Never decoration, category or status colour.
**The Ink-Only Rule.** Charts and bars use ink, edge and rule tones. Today is the darkest bar; the rest are edge.

## Typography

**Display / Body Font:** Geist Variable (self-hosted via fontsource; fallback ui-sans-serif, system-ui, Noto Sans Thai)
**Mono Font:** Geist Mono Variable, for slip references and scanned values only.

**Character:** One calm sans. Light at large size for figures, medium and semibold for emphasis. Tabular numerals are set on the whole body.

### Hierarchy
- **Display** (200, clamp(2.75rem, 13vw, 4rem), 1.05, -0.03em): the spent figure on Home/Insight and the amount on Add (2.5rem on screens shorter than 44rem). The baht sign is set at 0.5em in muted regular.
- **Title** (600, 1rem): day headers, top-bar titles, button labels. Day-header sums are 500 in soft ink.
- **Body** (400, 1rem, 1.5): entry category, notes at 0.875rem muted.
- **Label** (400, 0.875rem / 0.75rem): budget labels, times, field labels (0.75rem), bar values.
- **Scanned value** (Geist Mono 600, 1.25rem): the number read from a slip, the loudest thing on that card. The receiver's name is read into the note, in Geist, not mono.

### Named Rules
**The Light Figure Rule.** Big numbers are weight 200 and left-aligned on the page edge; bolder weights are for headers and the small sums.

## Layout

A single column, max 30rem, centred; from 40rem up it gains a 1px rule on both sides. Grid: 4px-based spacing; page padding 1.25rem; a 3.5rem margin column holds time/label on the left of every ruled row; row height 3.25rem. The red margin line sits at page-pad + margin-col and runs only beside ruled rows (day lines, add fields, review sheet), never behind titles or the hero.

Home: month title; "Spent today" label and figure; the Budget meters with an edit gear; a note line; the Balance with a "Check" button; day pages (today plus three earlier days), or, with no entries yet, a short "Your notebook is empty" help block. The four main screens (Home, Insight, History, Savings) share the bottom bar. Insight: a title with previous/next arrows, a Day / Week / Month switch, the hero figure, a comparison line, then Day by day bars (week and month) or the day's entries (day), Where it went, Biggest spends, Habits. The Add screen, entry screen and slip review are full-height screens that hide the bottom bar (entrance: slide up 1.5rem and fade, 220ms) with the keypad or batch bar anchored at the bottom with safe-area padding. Under 44rem tall, the Add screen shrinks its amount and key heights and turns the tag row into one scrolling line.

## Elevation & Depth

Flat. There are no drop shadows. Depth is the page against the desk tone, hairline rules, and the lighter Sheet tone for slips. The only box-shadow is an inset 1px ink ring used as an outline (the free-allowance segment of the budget bar). Bottom sheets are separated by a 1px ink rule on their top edge and a dimmed screen behind them, not by a shadow.

**The Flat Rule.** Surfaces separate by rule or tone, never by shadow.

## Shapes

Mostly square. 6px radius on buttons and icon buttons; 2px on bars, the slip page and the budget bar. Tabs are marked by a 2px ink rule (above the tab in the bottom bar, under it in the Day / Week / Month switch), not pilled. A bottom sheet has 6px radius on its top corners only. Rows are separated by 1px rule, not boxed.

## Components

### Buttons
- **Add (tabbar__add, confirm):** filled ink, paper text, 6px radius, 56px tall, weight 600, 1px press-down. Disabled: Paper-3 with muted text.
- **Slips (topbar__slips):** a text button with a clip icon at the right of the Add screen's top bar (hidden while editing an entry); at 320px only the clip shows. It starts the slip picker.
- **Icon button:** 44x44, 6px radius, hover Paper-2.
- **Text button:** underlined, 44px min height.

### Navigation (TabBar / ScaleSwitch)
The bottom bar (TabBar) is pinned to the bottom of Home, Insight, History and Savings, above the safe area, with a 1px rule on top: four tabs, each a 22px icon over a 0.875rem label (56px tall, equal columns, a 2px ink rule above the active one, muted otherwise) and, beside them, Add as its own filled button (plus icon and "Add"; at 320px only the plus, still 44px wide). It is hidden on the Add, entry and slip screens. The tab icons are home, insight (three bars), history (clock) and savings (piggy bank). Day / Week / Month is a smaller (0.875rem) left-aligned row of the same tabs. Arrows (icon buttons) page the period; Next is disabled on the current period.

### Figure
Baht sign small and muted, digits large; used for the Home and Insight hero.

### BudgetBar
One 10px bar for the month budget on a rule-tone track: before today (edge), today (ink), still free today (outlined, not filled). Turns red when the month is over; only today's segment turns red when today is over. Exposed as an image with a text alternative.

### DayList
Per day: a title row (bold date left, day total right, 1px ink rule under) then ruled lines in a grid (time in the margin column, category and optional note, amount right with "+" for received). Empty days read "Nothing spent". A newly added line settles in (translateY -6px, 420ms).

### DayBars
Ink-only vertical bars sharing one height scale. Week: 10rem, seven bars with value and weekday labels, each a button to open that day. Month: 6rem, thin and non-interactive, with first and last date underneath.

### CategoryTags
Plain text tags, no fill; chosen tag has a 2px ink underline; "Other" is always the last tag, then "New" (plus opens an inline underlined input) and "Edit" (opens the Edit tags sheet).

### Edit tags (TagEditor)
A bottom sheet reached from the "Edit" tag on the Add screen. One ruled row per tag: the name, a muted entry count, a rename (pencil) button and a delete (trash) button, 44px each. Rename swaps the row for an underlined input with a check and an X; a name another tag already has shows a deep-red hint and cannot be saved. Delete swaps the row for the usual warning with "Keep it" and "Yes, delete", saying how many entries move to Other. "Other" shows "Always kept" and has no buttons: it cannot be renamed or deleted, because deleted tags' entries land in it.

### Bottom sheet (Sheet)
For a choice that belongs to the screen under it: Budget, Check balance, History Filters, New pot and Edit pot. It rises from the bottom (220ms) over a dimmed screen, at most 30rem wide and 90% of the screen high, with a top bar (X, centred title) and the same ruled fields as the full screens. It closes with the X, a tap on the dimmed area or Escape. There are no gestures yet (no swipe to dismiss).

### Add screen and keypad
Amount first as a Display figure; ruled fields (Note, When with "Change", Tag) with the margin line continuing; a 3-column keypad of ruled cells (1.25rem digits, 52px high) and a filled confirm button.

### Slip sheets (SlipReview)
Each slip is a Sheet-tone page with 1px rule, 2px radius, and a paperclip (ClipMark) straddling its top edge. Two columns: the real slip picture on the left (clamp 5.5 to 7.5rem wide, 9:14, cropped to the top where the amount and date are, 1px rule border), and the fields on the right: the amount in mono (an AmountField), a datetime field, a note field (the receiver's name) with a status line under it (while the closer name read runs: a thin rule with an ink stretch moving along it and "Checking the name… 1 of 3", the note flashing an ink underline each time the reader changes it; afterwards "Name checked" and a 44px refresh button, "Read the name again", which replaces the note with a fresh reading), the category select, a small muted hint line "Name and tag filled in from your earlier slip" when shop memory filled them, and the mono bank reference (hidden when it is only a picture fingerprint); an X sits at the top corner. Fields are borderless with a 1px rule underneath. Warning slips (reading, unreadable, duplicate) use a red border, warning icon and deep-red title, listed by file name; "Reading slip N…" has no icon. Removed slips collapse to one muted line with a "Put back" text button. A sticky batch bar holds the total and confirm.

### Entry screen picture and buttons (EntryDetail)
A slip entry shows its saved picture below the fields at full column width (1px rule border, Paper-2 behind it), as a link that opens the picture full size. Under it are two outlined red buttons, 56px tall: "Remove picture" then "Delete entry", 8px apart, with 32px of room under the last one so it never sits on the screen edge. Either one swaps in the same two-button confirmation: a warning line, then "Keep it" (outlined ink) and "Yes, remove" or "Yes, delete" (filled deep red).

### History controls
Top to bottom: the period title with arrows, the Day / Week / Month switch, a search field, one "Filters" row with the sort beside it, the results line, then DayList groups, then a footer block.
- **Search:** a full box (1px edge border, 6px radius, 46px tall) with a magnifier icon inside at the left; the border and icon turn ink on focus.
- **Filters row:** a full-width text button with a funnel icon, the word "Filters", a muted "N set" count when any are set, and the Sort select on the right. Tapping it opens the Filters bottom sheet with three ruled rows (Kind, Tag, Source), each a muted label (5rem column) and a borderless native select (a value that is set is ink and weight 500, an unset one is muted), a filled "Show N entries" button and, when any are set, a "Clear filters" text button. Filters apply as they are changed.
- **Results line:** the count and total on the left, a Sort select with an up-down icon, and Reset when anything differs from the default (it wraps below at 320px).
- **No results:** a muted search icon, "Nothing matched", a one-line hint (a spelling hint when searching), and one filled button: "Clear search" when a search is typed, otherwise "Reset filters".
- **Footer block:** under one 1px rule and with 32px of room at the bottom: "Download backup" and "Spreadsheet" as two equal text links; "Clear old slip pictures", a row like the Filters row that opens a 3 / 6 / 12 months Segmented control, a status line ("N pictures · size. The entries stay.") and an outlined red "Remove these N pictures"; then an outlined red "Delete these N entries" for what the filters show. Both red buttons confirm with a warning and Keep them / Yes buttons, and are kept 24px apart so one is not tapped for the other.

### Icon / ClipMark
Inline SVG, 1.75 stroke, round caps, currentColor; a fixed set (back, forward, down, plus, close, check, backspace, edit, clip, settings, search, filter, sort, refresh, trash, home, insight, history, savings, warning). ClipMark is a purpose-drawn paperclip.

## Do's and Don'ts

### Do:
- **Do** take every colour, size, space and timing from tokens.css; no inline colours or font names.
- **Do** keep titles and the hero on the left page edge and the margin line beside ruled rows only.
- **Do** show averages and allowances in whole baht; keep amounts tabular.
- **Do** make all targets at least 44px and check 320px for no horizontal overflow.
- **Do** keep slips confined to batch review and the picture on a slip's own entry; the notebook is the app.
- **Do** keep one filled button (primary job) per pinned bar; Add is the only one on the bottom bar.
- **Do** use a bottom sheet, not an inline expansion, for a small choice that belongs to the current screen.
- **Do** give each first-run and no-results state one sentence of help and at most one action.
- **Do** honour reduced motion (fade only, 150ms).

### Don't:
- **Don't** add cards, colourful tiles, per-category colours, pills, gradients, pie or gauge charts.
- **Don't** use red for anything but the margin line and warnings.
- **Don't** add leather, stitching, paper textures or handwriting; the metaphor is lines and pages.
- **Don't** use shadows for depth.
- **Don't** colour bars; ink and edge tones only.
- **Don't** use Geist Mono outside slip references and scanned values.
- **Don't** make the month bars tappable; 28 to 31 columns are too narrow.

### Known gaps (not canonized)
- Day headers are documented elsewhere as "small-caps", but the CSS has no small-caps or uppercase; the build uses bold sentence-case. Treat the build as truth.
