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

A cool near-white sheet with pale blue rules, blue-black ink, and one red. The notebook lives in structure only: each day is a page with a bold date over a 1px ink rule, one purchase per ruled line, a red margin line beside the rows. There is no texture, no cards, no tiles. Slips are guests: they appear as lighter pages with a clip, and only in batch review.

Density is calm and phone-first (a 30rem column, centred on wider screens, with a thin rule either side). The big figure is light (weight 200) and sits on the left page edge together with the titles; emphasis comes from weight 500 to 600 and ink, never from colour.

**Key Characteristics:**
- Rules, margin and day headers carry the structure; fills are rare and always ink.
- One red (margin line, warnings, over-budget). One blue (focus ring only).
- Amounts are tabular figures; money is whole baht when averaged.
- Works at 320px with no horizontal overflow; every tap target is at least 44px.

## Colors

Restrained: blue-leaning neutrals plus ink, one red, and a focus blue. Neutrals all lean to hue 245 to 262.

### Primary
- **Blue-Black Ink** (oklch(27% 0.06 262)): text, the 1px day-header rule, today's bar, the filled Add button, selected-tab underline, the outline on Slips and on the "free today" part of the budget bar.
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
- **Scanned value** (Geist Mono 600, 1.25rem): the number read from a slip, the loudest thing on that card.

### Named Rules
**The Light Figure Rule.** Big numbers are weight 200 and left-aligned on the page edge; bolder weights are for headers and the small sums.

## Layout

A single column, max 30rem, centred; from 40rem up it gains a 1px rule on both sides. Grid: 4px-based spacing; page padding 1.25rem; a 3.5rem margin column holds time/label on the left of every ruled row; row height 3.25rem. The red margin line sits at page-pad + margin-col and runs only beside ruled rows (day lines, add fields, review sheet), never behind titles or the hero.

Home: top row Home | Insight (full-width, ruled below); month title and "Sample data" note; "Spent today" label and figure; one month BudgetBar with labels; a note line; day pages (today plus three earlier days, then an "All history" line); a pinned dock. Insight: same top row, a title with previous/next arrows, a Day / Week / Month switch, the hero figure, a comparison line, then Day by day bars (week and month) or the day's entries (day), Where it went, Biggest spends, Habits. The Add screen and slip review are full-height sheets (entrance: slide up 1.5rem and fade, 220ms) with the keypad or batch bar anchored at the bottom with safe-area padding. Under 44rem tall, the Add screen shrinks its amount and key heights and turns the tag row into one scrolling line.

## Elevation & Depth

Flat. There are no drop shadows. Depth is the page against the desk tone, hairline rules, and the lighter Sheet tone for slips. The only box-shadow is an inset 1px ink ring used as an outline (Slips button, free-allowance segment of the budget bar).

**The Flat Rule.** Surfaces separate by rule or tone, never by shadow.

## Shapes

Mostly square. 6px radius on buttons and icon buttons; 2px on bars, the slip page and the budget bar. Tabs are underlined (2px ink), not pilled. Rows are separated by 1px rule, not boxed.

## Components

### Buttons
- **Add (dock__add, confirm):** filled ink, paper text, 6px radius, 56px tall, weight 600, 1px press-down. Disabled: Paper-3 with muted text.
- **Slips (dock__slips):** outlined (inset 1px ink), weight 500, with a clip icon; hover/press fills Paper-2/Paper-3.
- **Icon button:** 44x44, 6px radius, hover Paper-2.
- **Text button:** underlined, 44px min height.

### Navigation (ViewSwitch / ScaleSwitch)
Segmented radiogroups made of text tabs: Home | Insight fills the top row in equal columns, underlined in ink when active, muted otherwise. Day / Week / Month is a smaller (0.875rem) left-aligned row of the same tabs. Arrows (icon buttons) page the period; Next is disabled on the current period.

### Figure
Baht sign small and muted, digits large; used for the Home and Insight hero.

### BudgetBar
One 10px bar for the month budget on a rule-tone track: before today (edge), today (ink), still free today (outlined, not filled). Turns red when the month is over; only today's segment turns red when today is over. Exposed as an image with a text alternative.

### DayList
Per day: a title row (bold date left, day total right, 1px ink rule under) then ruled lines in a grid (time in the margin column, category and optional note, amount right with "+" for received). Empty days read "Nothing spent". A newly added line settles in (translateY -6px, 420ms).

### DayBars
Ink-only vertical bars sharing one height scale. Week: 10rem, seven bars with value and weekday labels, each a button to open that day. Month: 6rem, thin and non-interactive, with first and last date underneath.

### CategoryTags
Plain text tags, no fill; chosen tag has a 2px ink underline; "New" tag with plus opens an inline underlined input.

### Add screen and keypad
Amount first as a Display figure; ruled fields (Note, When with "Change", Tag) with the margin line continuing; a 3-column keypad of ruled cells (1.25rem digits, 52px high) and a filled confirm button.

### Slip sheets (SlipReview)
Each slip is a Sheet-tone page with 1px rule, 2px radius, and a paperclip (ClipMark) straddling its top edge: a thumbnail placeholder and mono scanned value left; time, mono reference, category select and an X right. Warning slips (unreadable, duplicate) use a red border, warning icon and deep-red title, listed by file name. Removed slips collapse to one muted line with an undo text button. A sticky batch bar holds the total and confirm.

### History field rows
Ruled rows with a label in the margin column (Find, Tag, Kind, Month) and a borderless input or native select, followed by a results line (count, total, Reset) and DayList groups.

### Icon / ClipMark
Inline SVG, 1.75 stroke, round caps, currentColor; a fixed set (back, forward, down, plus, close, check, backspace, clip, warning). ClipMark is a purpose-drawn paperclip.

## Do's and Don'ts

### Do:
- **Do** take every colour, size, space and timing from tokens.css; no inline colours or font names.
- **Do** keep titles and the hero on the left page edge and the margin line beside ruled rows only.
- **Do** show averages and allowances in whole baht; keep amounts tabular.
- **Do** make all targets at least 44px and check 320px for no horizontal overflow.
- **Do** keep slips confined to batch review; the notebook is the app.
- **Do** keep one filled button (primary job) and one outlined button (second job) per pinned bar.
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
- "Sample data" note and the slip thumbnail bars are placeholders for unwired data, not system patterns.
