# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person: the owner. They live in Thailand, pay mostly by bank transfer (which produces slip screenshots; Bangkok Bank so far) and partly in cash, and receive income irregularly across the month. They open the app several times a day, usually on a phone: right after paying, or at the end of a day out.

## Product Purpose

A personal money tracker with daily and monthly views. It tells the owner how much they spent today and where the month's budget stands at a glance, and lets them log a spend in a few taps or upload slips and have them read for them. Success is that logging takes seconds, so the owner keeps using it.

## Positioning

A personal tool built around Thai bank transfer slips and irregular income, with a daily allowance derived from the month. It is not a general-purpose budgeting app.

## Operating Context

Thailand, baht. Money moves mostly through bank transfer slips (screenshots, each with a reference number and a QR code) and cash. The app is online-only, installable on the phone, and sits behind a Cloudflare Access login (Google, with an emailed one-time code as backup, one-month sessions). Slip images are read on the owner's device (in the browser, nothing is sent to a reading service) and the pictures are kept in a private storage bucket behind the same login.

## Capabilities and Constraints

- Entries are labelled spent, received ("add money") or saved; only spent counts toward budgets.
- Categories are by occasion (for example hangouts versus food and drink), with a free-text note; categories can be added with a plus, and renamed or deleted from the Edit tag on the Add screen (a rename carries the old entries along; a deleted tag's entries move to "Other", which is always the last tag and cannot be changed).
- Monthly budget (typed as an amount, or set as a percentage of the balance at the moment of saving, kept as a plain amount) with a daily allowance that is derived from the month by default, can be set manually, or can be off; a warning shows when over; overspending lowers later days' derived allowance.
- Goals: a fixed monthly savings amount, plus extra contributions at any time. Saving is separate from spending.
- A savings pot can be edited or deleted from Savings; deleting asks first, returns what was left in it to the balance as one adjustment, and keeps its entries in History. A deleted pot's name cannot be reused.
- Add a spend: one tap from the main screen, amount first, time defaults to now and is editable, one category, optional note.
- Edit or delete an entry from its page: amount, tag, note and date can change (kind and pot stay fixed); deleting asks first; bank check-in adjustments can only be deleted. A slip entry can be edited like any other and keeps its slip reference and picture.
- History: find any day through a Day / Week / Month switch and a calendar jump, search all time, filter by kind, tag and source (all, slips, or typed in by hand, told apart by the slip reference, not by whether a picture is still stored), and sort by newest, oldest, biggest or smallest. The filters sit behind one "Filters" row that shows how many are set. A button at the bottom deletes exactly the entries on screen (and their pictures) after a warning with the count and total.
- Add slips: one tap, amount, time and the receiver's name are read automatically (Thai and English, in the browser), a batch is split into one entry per purchase, reviewed with the slip picture beside editable fields and an X to remove; duplicates are caught by the slip's bank reference (a slip with no readable reference gets a fingerprint of the picture instead); unreadable or wrong slips are reported by file name without affecting the rest. The first batch downloads about 9 MB of reading files once.
- Names are guesses: the amount and time are read reliably on the owner's real Bangkok Bank slips, names less so (about two in three exact, most of the rest close), and names that mix Thai and English letters can come out garbled. The note is the receiver's name and the owner corrects it in the review; a note they have edited is never overwritten by a later reading.
- Shop memory: a slip's shop is identified by its Biller ID plus shop code (a Biller ID alone is shared by many shops), or by the masked account or phone number, or by the e-wallet number. The next slip from the same shop starts with the note and tag of the newest earlier entry from it, and says so. Corrections to a note or tag therefore teach the next slip. A biller with no readable shop code is not remembered.
- Slip pictures: each saved slip keeps its picture (up to 6 MB). The entry screen shows it below the fields (tap for full size) with "Remove picture"; History can clear pictures older than 3, 6 or 12 months by the entry's own date, showing the count and size first. Removing pictures never removes entries, and deleting an entry deletes its picture.
- Friends owe me (2026-10-14): when the owner pays a whole bill, a spend can list friends' parts (Split, on Add or when editing; "Split evenly" in whole baht, leftover stays with the owner). Only the owner's part counts as spending. A friend paying back is its own "Paid back" line: it raises the balance but is not counted as Received, and deleting it means they owe again. An unpaid part can be forgiven, which makes it the owner's spending on that day (shown as its own line). Home shows one "Friends owe you" line under the balance while anything is owed; it opens a sheet of open parts by friend (Savings stays pots only). Parts already paid back or forgiven can't be changed. Paybacks are typed in, not read from slips.
- Export of everything: a JSON backup and a spreadsheet (CSV) of the entries, at the bottom of History. There is no restore yet.
- Stack already in place: React, TypeScript and Vite, a Hono API on a Cloudflare Worker, Cloudflare D1 holds the data and a private R2 bucket holds the slip pictures (both live).
- Undecided: one or several categories per entry; support for banks other than Bangkok Bank and for paper receipts; whether transfers or e-wallet top-ups to the owner's own name count as spending (they are probably not spending, and are read like any other slip for now); a restore for the backup; whether any charts exist; how budgets are displayed.

## Optional goals (from the 2026-10-14 comparison and audit)

Nothing here is decided or promised. It came from comparing BoeesTrack with Yayikast/expenses-tracker (a Google Sheets, Apps Script and GitHub Pages app) and auditing both. Pick a phase when it is wanted; each phase should ship on its own. Their app is a reference for ideas only: do not copy its stack, its session handling or its one-file frontend. BoeesTrack is ahead on login (Cloudflare Access), typing and tests, money stored as integer satang, and on-device slip reading with the pictures kept private.

**Phase 1: Safety (small, no screen changes)**
- Update Hono (`npm audit` flags versions up to 4.13.6; the flagged parts are middleware this app does not use, so the risk is probably low). Then `npm test` and `npm run build`.
- Add route tests for `src/worker/data.ts` and `slips.ts`. Today only `wire.ts` and `access.ts` have tests, and these routes hold the code that deletes data. Cases: a repeated id gives 409, deleting an entry deletes its picture, a batch of 500 ids, an unknown pot or tag.
- `PUT /slips/:ref` trusts the Content-Type header: check the file's first bytes are JPEG, PNG or WebP.
- `lib/csv.ts` does not neutralise cells that start with `=`, `+`, `-` or `@` (a note read from a slip could). Prefix them so a spreadsheet shows them as text.
- Check that the app treats a 409 on a repeated entry id as "already saved" when a save is retried.
- Unconfirmed, only worth checking: that the Access cookie is `SameSite=Lax`, since the API parses JSON whatever the Content-Type says.

**Phase 2: Slip details**
- A printed reference can be a shorter form of the longer QR reference (the other app matches by prefix, at least 16 characters). Check against the private OCR benchmark whether BoeesTrack misses duplicates this way before changing anything.
- Duplicates with no readable reference are already caught by a picture fingerprint, so a date, time and amount check is not needed.

**Phase 3: Money features** (only if the owner uses them; each needs a migration and the migrations must be applied before the Worker that reads them is deployed)
- Monthly items: recurring bills and income (allowance, rent, a phone plan) that wait as pending each month until marked paid or received, and link to a slip so the month is not counted twice. The biggest gap against the other app.
- Split bills and lend/borrow: built as "Friends owe me" (see Capabilities). The owner meant splitting with friends, not across tags.
- Monthly items, as designed by the owner on 2026-10-14: a list of rules (name, amount, day, tag, in or out); an item is due each month until a transaction is linked to it by tapping the due item; a due item does not lower the allowance until paid.

**Phase 4: Scale, later**
- `/api/data` returns every entry on every load. Fine for a year or two of one person's entries; load only recent entries when it gets slow.

## Brand Commitments

The name BoeesTrack, served at track.boee.ing. The owner chose a notebook-with-slips concept, recorded in CONCEPT.md.

## Evidence on Hand

The owner's real Bangkok Bank slip screenshots in slipsScreenShots/ (personal data, git-ignored, with the true values kept beside them for measuring reading changes; never quote or commit them). On 38 of them the amount and time are right every time, names exact on 27 and close on 36. The live database holds the owner's own entries; none must be fabricated.

## Product Principles

- Amount first, and fast: logging must take seconds.
- Today at a glance: the main screen answers how much was spent today and where the month stands.
- Slips are evidence the owner verifies; they are never silently trusted. A reading is a first guess shown for correcting, and the picture stays beside it.
- Self-explanatory: the screen shows what can be done without a tutorial.
- Private by default: login in front, slip reading on the device, slip pictures in a private bucket the owner can clear, and the owner can export everything.
