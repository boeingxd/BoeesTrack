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

Thailand, baht. Money moves mostly through bank transfer slips (screenshots, each with a reference number and a QR code) and cash. The app is online-only, installable on the phone, and sits behind a Cloudflare Access login (Google, with an emailed one-time code as backup, one-month sessions). Slip images are read on the owner's device.

## Capabilities and Constraints

- Entries are labelled spent, received ("add money") or saved; only spent counts toward budgets.
- Categories are by occasion (for example hangouts versus food and drink), with a free-text note; categories can be added with a plus.
- Monthly budget with a daily allowance that is derived from the month by default, can be set manually, or can be off; a warning shows when over; overspending lowers later days' derived allowance.
- Goals: a fixed monthly savings amount, plus extra contributions at any time. Saving is separate from spending.
- Add a spend: one tap from the main screen, amount first, time defaults to now and is editable, one category, optional note.
- Add slips: one tap, amount and time read automatically, a batch is split into one entry per purchase, reviewed with the slip image, the scanned value and an X to remove; duplicates are caught by the slip's QR reference; unreadable or wrong slips are reported by file name without affecting the rest.
- Export of everything as a file.
- Stack already in place: React, TypeScript and Vite, a Hono API on a Cloudflare Worker, Cloudflare D1 planned for data.
- Undecided: one or several categories per entry; the date source for slips; support for banks other than Bangkok Bank; whether any charts exist; how budgets are displayed.

## Brand Commitments

The name BoeesTrack, served at track.boee.ing. The owner chose a notebook-with-slips concept, recorded in CONCEPT.md.

## Evidence on Hand

Six Bangkok Bank slip screenshots in slipsScreenShots/ (personal data, git-ignored). There is no real transaction data yet; none must be fabricated.

## Product Principles

- Amount first, and fast: logging must take seconds.
- Today at a glance: the main screen answers how much was spent today and where the month stands.
- Slips are evidence the owner verifies; they are never silently trusted.
- Self-explanatory: the screen shows what can be done without a tutorial.
- Private by default: login in front, slip reading on the device, and the owner can export everything.
